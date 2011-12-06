/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.data");

/**
 * @class Service represents a WMS server.
 *
 * @param capabilitiesUrl The capabilities url of the service
 * @param definition Service object as returned by the getCapabilities request
 * @param layers Ext.util.MixedCollection with layer ids as keys and OpenLayers.Layer instances as values
 * 		(see de.ingrid.mapclient.frontend.data.Service.getLayerId)
 */
de.ingrid.mapclient.frontend.data.Service = function(capabilitiesUrl, definition, layers) {
	this.capabilitesUrl = capabilitiesUrl;
	this.definition = definition;
	this.layers = layers;
};

/**
 * Get the capabilities url of the service
 * @return The capabilities url
 */
de.ingrid.mapclient.frontend.data.Service.prototype.getCapabilitiesUrl = function() {
	return this.capabilitesUrl;
};

/**
 * Get the service definition
 * @return Object as returned by the getCapabilities request
 */
de.ingrid.mapclient.frontend.data.Service.prototype.getDefinition = function() {
	return this.definition;
};

/**
 * Get the map layers
 * @return Array of OpenLayers.Layer instances
 */
de.ingrid.mapclient.frontend.data.Service.prototype.getLayers = function() {
	return this.layers.getRange();
};

/**
 * Check if the service contains a given layer
 * @param layer OpenLayers.Layer instance
 * @return Boolean
 */
de.ingrid.mapclient.frontend.data.Service.prototype.contains = function(layer) {
	return this.layers.containsKey(de.ingrid.mapclient.frontend.data.Service.getLayerId(layer));
};

/**
 * Get a layer by it's id
 * @param id The id
 * @return layer OpenLayers.Layer instance
 */
de.ingrid.mapclient.frontend.data.Service.prototype.getLayerById = function(id) {
	return this.layers.get(id);
};

/**
 * Compare two given layers and return true, if they are the same
 * @param a OpenLayers.Layer instance
 * @param b OpenLayers.Layer instance
 * @return Boolean
 */
de.ingrid.mapclient.frontend.data.Service.compareLayers = function(a, b) {
	var isSame = de.ingrid.mapclient.frontend.data.Service.getLayerId(a) == de.ingrid.mapclient.frontend.data.Service.getLayerId(b);
	return isSame;
};

/**
 * Get an unique identifier for the layer
 * @param layer OpenLayers.Layer instance
 * @return String
 */
de.ingrid.mapclient.frontend.data.Service.getLayerId = function(layer) {
	return layer.url+':'+layer.name;
};

/**
 * Static function to create a service instance from the capabilities url
 * @note The returned instance only contains the capabilities url, the definition and layers array is empty
 * @param capabilitiesUrl The capabilities url of the WMS server
 * @return de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl = function(capabilitiesUrl) {
	var service = new de.ingrid.mapclient.frontend.data.Service(capabilitiesUrl, {}, []);
	return service;
};

/**
 * Static function to load a service definition from the capabilities url
 * @param capabilitiesUrl The capabilities url of the WMS server
 * @param callback Function to be called after the data are loaded. A de.ingrid.mapclient.frontend.data.Service
 * instance is passed to the callback.
 */
de.ingrid.mapclient.frontend.data.Service.load = function(capabilitiesUrl, callback) {
	var self = this;

	// if the service is loaded already, return it immediately
	if (de.ingrid.mapclient.frontend.data.Service.registry.containsKey(capabilitiesUrl)) {
		// get the service from the registry
		var service = de.ingrid.mapclient.frontend.data.Service.registry.get(capabilitiesUrl);
		// call the callback if given
		if (callback instanceof Function) {
			callback(service);
		}
	}
	else {
		// load the service
		Ext.Ajax.request({
			url: de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(capabilitiesUrl),
			method: 'GET',
			success: function(response, request) {
				var format = new OpenLayers.Format.WMSCapabilities();
				var capabilities = format.read(response.responseText);
				if (capabilities.capability) {
					// set up store data
					var data = new GeoExt.data.WMSCapabilitiesReader().readRecords(response.responseText);
					if (data.success) {
						var store = new GeoExt.data.WMSCapabilitiesStore();
						store.add(data.records);
						// prepare layers from records
						var records = store.getRange();
						var layers = new Ext.util.MixedCollection();
						for (var i=0, count=records.length; i<count; i++) {
							var record = records[i];

							// extract the layer from the record
							var layer = record.get("layer");
							layer.mergeNewParams({
								format: "image/png",
								transparent: true,
								INFO_FORMAT: self.getPreferredInfoFormat(capabilities.capability)
							});
							// set layer parameters
							layer.visibility = false;

							// add the layer to the layer lists
							var layerId = de.ingrid.mapclient.frontend.data.Service.getLayerId(layer);
							layers.add(layerId, layer);
						}

						// create the service instance from the result
						var service = new de.ingrid.mapclient.frontend.data.Service(capabilitiesUrl, capabilities.service, layers);
						// register the service
						de.ingrid.mapclient.frontend.data.Service.registry.add(capabilitiesUrl, service);
						// call the callback if given
						if (callback instanceof Function) {
							callback(service);
						}
					} else {
						de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
					}
				} else {
					de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
				}
			},
			failure: function(response, request) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
			}
		});
	}
};

/**
 * Static function to find the service definition to which the given layer belongs
 * @param layer OpenLayers.Layer instance
 * @return de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.data.Service.findByLayer = function(layer) {
	var result = null;
	de.ingrid.mapclient.frontend.data.Service.registry.each(function(service) {
		if (service.contains(layer)) {
			result = service;
			return;
		}
	});
	return result;
};

/**
 * Static function to find the service definition to which the given url belongs
 * @param url The service url
 * @return de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.data.Service.findByUrl = function(url) {
	var result = null;
	var urlParts = url.split("?");
	de.ingrid.mapclient.frontend.data.Service.registry.each(function(service) {
		var serviceUrlParts = service.getDefinition().href.split("?");
		if (urlParts[0] == serviceUrlParts[0]) {
			result = service;
			return;
		}
	});
	return result;
};

/**
 * Merge the service layer params into the passed layer's params
 * @param layer OpenLayers.Layer instance
 */
de.ingrid.mapclient.frontend.data.Service.mergeDefaultParams = function(layer) {
	var service = de.ingrid.mapclient.frontend.data.Service.findByLayer(layer);
	var serviceLayer = service.getLayerById(de.ingrid.mapclient.frontend.data.Service.getLayerId(layer));
	layer.mergeNewParams(serviceLayer.params);
};

/**
 * Get the preferred info format for the GetFeatureInfo request for the given capabilities.
 * @param capability The capability object created by OpenLayers
 * @return String (Mime type)
 */
de.ingrid.mapclient.frontend.data.Service.getPreferredInfoFormat = function(capability) {
	if (capability.request && capability.request.getfeatureinfo) {
		var formats = capability.request.getfeatureinfo.formats || [];
		// prefer html and fallback to first offered format
		if (formats.length > 0) {
			for (var i=0, count=formats.length; i<count; i++) {
				if (formats[i].match(/html/)) {
					return formats[i];
				}
			}
			return formats[0];
		}
	}
	return '';
};

/**
 * Global service registry (used to find the service to which a given layer belongs)
 */
de.ingrid.mapclient.frontend.data.Service.registry = new Ext.util.MixedCollection();