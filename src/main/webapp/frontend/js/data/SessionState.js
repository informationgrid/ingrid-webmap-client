/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
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
	
	this.kmlRedlining = [];

	this.selectedLayersByService = [];
	
	this.treeState = [];
	
	this.capabilitiesUrlOrder = [];
	// apply values from the provided config object
	this.url = "";

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

	var selectedLayers = [];
	for (var i=0, count=this.selectedLayersByService.length; i<count; i++) {
		selectedLayers.push(this.selectedLayersByService[i]);
	}
	
	var treeState = [];
	for (var i=0, count=this.treeState.length; i<count; i++) {
		treeState.push(this.treeState[i]);
	}
	
	// encode to JSON
	var serializedState = Ext.encode({
		id: "ext-gen2",
		title: this.title,
		description: this.description,
		wmcDocument: wmcDocument,
		activeServices: capabilityUrls,
		kmlArray: this.kmlArray,
		kmlRedlining: this.kmlRedlining,
		selectedLayersByService: selectedLayers,
		url: this.url,
		treeState: treeState
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
	this.url = data.url;
	this.kmlRedlining = data.kmlRedlining;
	this.selectedLayersByService = data.selectedLayersByService;
	this.treeState = data.treeState;
	this.capabilitiesUrlOrder = data.activeServices;
	// unserialize map state (must be applied)
	this.wmcDocument = data.wmcDocument;

	// define exit condition (unserialization is finished, when the last service is loaded)
	var numServices = data.activeServices.length;
	var lastCapUrl = data.activeServices[numServices-1];

	// unserialize active services
	var self = this;
	this.activeServices = [];
	var callbackCount = 0;
	for (var i=0;i<numServices; i++) {
		// the service needs to be loaded
		var capabilitiesUrl = data.activeServices[i];
		de.ingrid.mapclient.frontend.data.Service.load(capabilitiesUrl, function(service) {
			callbackCount++;
			self.activeServices.push(service);
			if (callbackCount == numServices) {
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
	var context = format.read(this.wmcDocument);
	var layers = format.getLayersFromContext(context.layersContext);
	// merge default params from layers already loaded for the service
	for (var i=0, count=layers.length; i<count; i++) {
		var layer = layers[i];
		de.ingrid.mapclient.frontend.data.Service.mergeDefaultParams(layer);
		de.ingrid.mapclient.frontend.data.Service.fixLayerProperties(layer);
		// add base layers first, because the map needs it to
		// obtain the maxExtent
		if (layer.isBaseLayer == true) {
			this.map.addLayer(layer);
		}
	}
	// add other layers later
	for (var i=0, count=layers.length; i<count; i++) {
		if (!layer.isBaseLayer) {
			this.map.addLayer(layers[i]);
		}
	}
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

