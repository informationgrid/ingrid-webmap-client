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
 * @param store GeoExt.data.WMSCapabilitiesStore instance
 */
de.ingrid.mapclient.frontend.data.ServiceCopy = function(capabilitiesUrl, title, categories, deactivatedLayers) {
	this.capabilitiesUrl = capabilitiesUrl;
	this.title = title;
	this.categories = categories;
	this.deactivatedLayers = deactivatedLayers;
};



de.ingrid.mapclient.frontend.data.ServiceCopy.prototype.getCapabilitiesUrl = function() {
	return this.capabilitiesUrl;
};


de.ingrid.mapclient.frontend.data.ServiceCopy.prototype.getTitle = function() {
	return this.title;
};


de.ingrid.mapclient.frontend.data.ServiceCopy.prototype.getCategories = function() {
	return this.categories;
};

de.ingrid.mapclient.frontend.data.ServiceCopy.prototype.getDeactivatedLayers = function() {
	return this.categories;
};




/**
 * Static function to load a service definition from the capabilities url
 * @param capabilitiesUrl The capabilities url of the WMS server
 * @param callback Function to be called after the data are loaded. A de.ingrid.mapclient.frontend.data.Service
 * instance is passed to the callback.
 */
de.ingrid.mapclient.frontend.data.ServiceCopy.prototype.save = function() {
	var self = this;
	var thisSerialized = Ext.encode({
			capabilitiesUrl: self.capabilitiesUrl,
			title: self.title,
			categories: self.categories,
			deactivatedLayers: self.deactivatedLayers
	
	});

		Ext.Ajax.request({
			url: de.ingrid.mapclient.COPY_SERVICE_URL+'/',
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },			
			success: function(response, request) {
				console.debug("Gut.");
			},
			failure: function(response, request) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.COPY_SERVICE_FAILURE);	
			},
			xmlData: thisSerialized
		});
};

