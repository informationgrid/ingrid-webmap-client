/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.data");

/**
 * @class ServiceCopy represents a temporary service object it is only for transfering service data between
 * admin interface and backend
 * 
 * @param capabilitiesUrl The capabilities url of the service
 * @param definition Service object as returned by the getCapabilities request
 * @param layers Ext.util.MixedCollection with layer ids as keys and OpenLayers.Layer instances as values
 * 		(see de.ingrid.mapclient.frontend.data.Service.getLayerId)
 * @param store GeoExt.data.WMSCapabilitiesStore instance
 */
de.ingrid.mapclient.frontend.data.ServiceContainer = function(originalCapUrl, title, categories, deactivatedLayers, checkedLayers,layerNameChanges) {
	this.originalCapUrl = originalCapUrl;
	this.title = title;
	this.categories = categories;
	this.deactivatedLayers = deactivatedLayers;
	this.checkedLayers = checkedLayers;
	this.layerNameChanges = layerNameChanges;
};



de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.getOriginalCapUrl = function() {
	return this.originalCapUrl;
};


de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.getTitle = function() {
	return this.title;
};


de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.getCategories = function() {
	return this.categories;
};

de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.getDeactivatedLayers = function() {
	return this.categories;
};

de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.serialise = function() {

	var self = this;
	var thisSerialised = Ext.encode({
			originalCapUrl: self.originalCapUrl,
			title: self.title,
			categories: self.categories,
			deactivatedLayers: self.deactivatedLayers,
			checkedLayers: self.checkedLayers,
			layerNameChanges: self.layerNameChanges
	
	});
	return thisSerialised;
}



/**
 * Static function to copy a service 
 */
de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.copy = function(serialisedData) {


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
			xmlData: serialisedData
		});
};
/**
 * Static function to add a service 
 */
de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.add = function(serialisedData) {


		Ext.Ajax.request({
			url: de.ingrid.mapclient.ADD_SERVICE_URL+'/',
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },			
			success: function(response, request) {
				console.debug("Gut.");
			},
			failure: function(response, request) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.ADD_SERVICE_FAILURE);	
			},
			xmlData: serialisedData
		});
};
/**
 * Static function to edit a service 
 */
de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.update = function(serialisedData) {


		Ext.Ajax.request({
			url: de.ingrid.mapclient.UPDATE_SERVICE_URL+'/',
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },			
			success: function(response, request) {
				console.debug("Gut.");
			},
			failure: function(response, request) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.UPDATE_SERVICE_FAILURE);	
			},
			xmlData: serialisedData
		});
};
/**
 * Static function to remove a service 
 */
de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.remove = function(serialisedData) {


		Ext.Ajax.request({
			url: de.ingrid.mapclient.REMOVE_SERVICE_URL+'/',
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },			
			success: function(response, request) {
				console.debug("Gut.");
			},
			failure: function(response, request) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.REMOVE_SERVICE_FAILURE);	
			},
			xmlData: serialisedData
		});
};
/**
 * Static function to get a service 
 */
de.ingrid.mapclient.frontend.data.ServiceContainer.prototype.get = function(serialisedData) {


		Ext.Ajax.request({
			url: de.ingrid.mapclient.GET_SERVICE_URL+'/',
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },			
			success: function(response, request) {
				console.debug("Gut.");
			},
			failure: function(response, request) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.REMOVE_SERVICE_FAILURE);	
			},
			xmlData: serialisedData
		});
};
