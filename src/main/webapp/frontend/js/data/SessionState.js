/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.data");

/**
 * @class SessionState is used to transport all user session data when storing
 * or retrieving these to or from the server.
 */
de.ingrid.mapclient.frontend.data.SessionState = function(config) {

	/**
	 * @cfg The data id (optional)
	 */
	this.id = "";

	/**
	 * @cfg The title (optional)
	 */
	this.title = "";

	/**
	 * @cfg The description (optional)
	 */
	this.description = "";

	/**
	 * @cfg OpenLayers.Map instance
	 */
	this.map = "";

	/**
	 * @cfg Array of de.ingrid.mapclient.frontend.data.Service instances
	 */
	this.activeServices = [];

	/**
	 * The serialized map state, will be set by the unserialize method
	 */
	this.wmcDocument = null;

	this.kmlArray = [];

	// apply values from the provided config object
	Ext.apply(this, config);
};

/**
 * Serialize the map state and active services into a JSON object with properties
 * wmcDocument and activeServices (array of capability urls)
 * @return Object
 */
de.ingrid.mapclient.frontend.data.SessionState.prototype.serialize = function() {
	// serialize the map state
	var format = new OpenLayers.Format.WMC({
		'layerOptions': {
			buffer: 0
		}
	});
	var wmcDocument = format.write(this.map);

	// serialize the active services
	var capabilityUrls = [];
	for (var i=0, count=this.activeServices.length; i<count; i++) {
		capabilityUrls.push(this.activeServices[i].getCapabilitiesUrl());
	}

	// encode to JSON
	var serializedState = Ext.encode({
		id: id,
		title: this.title,
		description: this.description,
		wmcDocument: wmcDocument,
		activeServices: capabilityUrls,
		kmlArray: this.kmlArray
	});
	return serializedState;
};

/**
 * Unserialize the map state and active services from a given JSON object with properties
 * wmcDocument and activeServices.
 * @note The map state will not be applied to the map (see de.ingrid.mapclient.frontend.data.SessionState.restoreMapState)
 * @param data Object
 * @param callback Function to call after unserialization is finished
 */
de.ingrid.mapclient.frontend.data.SessionState.prototype.unserialize = function(data, callback) {
	// decode from JSON
	var data = Ext.decode(data);

	// unserialize simple properties
	this.id = data.id;
	this.title = data.title;
	this.description = data.description;
	this.kmlArray = data.kmlArray;

	// unserialize map state (must be applied)
	this.wmcDocument = data.wmcDocument;

	// define exit condition (unserialization is finished, when the last service is loaded)
	var numServices = data.activeServices.length;
	var lastCapUrl = data.activeServices[numServices-1];

	// unserialize active services
	var self = this;
	this.activeServices = [];
	for (var i=0, count=data.activeServices.length; i<count; i++) {
		// the service needs to be loaded
		var capabilitiesUrl = data.activeServices[i];
		de.ingrid.mapclient.frontend.data.Service.load(capabilitiesUrl, function(service) {
			self.activeServices.push(service);
			if (i == count) {
				//formerly
				//lastCapUrl == service.getCapabilitiesUrl()
				if (callback instanceof Function) {
					callback();
				}
			}
		});
	}
};

/**
 * Applies the serialized data to the map after the data are unserialized
 * @note We define an extra method for this, in order to allow the user to decide when to do this.
 */
de.ingrid.mapclient.frontend.data.SessionState.prototype.restoreMapState = function(callback) {
	var self = this;
	if (this.wmcDocument == null) {
		throw "No unserialized data.";
	}

	var format = new OpenLayers.Format.WMC({
		'layerOptions' : {
			buffer : 0
		}
	});
	// restore map state
	var context = format.read(this.wmcDocument, this.map);
	var layers = format.getLayersFromContext(context.layersContext);
	// merge default params from layers already loaded for the service
	for (var i=0, count=layers.length; i<count; i++) {
		var layer = layers[i];
		de.ingrid.mapclient.frontend.data.Service.mergeDefaultParams(layer);
		de.ingrid.mapclient.frontend.data.Service.fixLayerProperties(layer);
	}
	this.map.addLayers(layers);
	de.ingrid.mapclient.frontend.data.MapUtils.assureProj4jsDef(context.projection, function() {
		self.changeProjection(context.projection);
		self.map.zoomToExtent(context.bounds);
		if (callback instanceof Function) {
			callback();
		}
	});
};

/**
 * Change the map projection to the given one. We assume that the projection
 * definition is loaded already
 * @param newProjCode EPSG code
 */
de.ingrid.mapclient.frontend.data.SessionState.prototype.changeProjection = function(newProjCode) {
	de.ingrid.mapclient.frontend.data.MapUtils.changeProjection(newProjCode, this.map, this, false);
};

