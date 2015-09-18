/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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


Ext.Loader.syncRequire([
    'GeoExt.data.WmsCapabilitiesLayerModel',
    'GeoExt.data.reader.WmsCapabilities'
]);
/**
 * @class Service represents a WMS server.
 *
 * @param capabilitiesUrl The capabilities url of the service
 * @param definition Service object as returned by the getCapabilities request
 * @param layers Ext.util.MixedCollection with layer ids as keys and OpenLayers.Layer instances as values
 * 		(see de.ingrid.mapclient.frontend.data.Service.getLayerId)
 * @param store GeoExt.data.WMSCapabilitiesStore instance
 */
de.ingrid.mapclient.frontend.data.Service = function(capabilitiesUrl, definition, layers, store) {
	this.capabilitiesUrl = decodeURIComponent(capabilitiesUrl);
	this.definition = definition;
	this.layers = layers;
	this.capabilitiesStore = store;
};

/**
 * Get the capabilities url of the service
 * @return The capabilities url
 */
de.ingrid.mapclient.frontend.data.Service.prototype.getCapabilitiesUrl = function() {
	return this.capabilitiesUrl;
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
 * Get a layer by it's id (@see de.ingrid.mapclient.frontend.data.Service.getLayerId)
 * @param id The id
 * @return OpenLayers.Layer instance
 */
de.ingrid.mapclient.frontend.data.Service.prototype.getLayerById = function(id) {
	return this.layers.get(id);
};

/**
 * Get a layer by it's name
 * @param name The name
 * @return OpenLayers.Layer instance
 */
de.ingrid.mapclient.frontend.data.Service.prototype.getLayerByName = function(name) {
	return this.layers.findBy(function(item) {
		return (item.params.LAYERS == name);
	});
};
/**
 * Get a layer by it's name
 * @param name The name
 * @return OpenLayers.Layer instance
 */

//TODO this is not yet implemented titles can not be unique names
de.ingrid.mapclient.frontend.data.Service.prototype.getLayerByTitle = function(name) {
	return this.layers.find(function(item) {
		return (item.name == name);
	});
};
/**
 * Get a layer record contained in the GeoExt.data.WMSCapabilitiesStore by it's id
 * (@see de.ingrid.mapclient.frontend.data.Service.getLayerId)
 * @param id The id
 * @return Ext.data.Record instance
 */
de.ingrid.mapclient.frontend.data.Service.prototype.getLayerRecordById = function(id) {
	var index = this.capabilitiesStore.findBy(function(record, recordId) {
		if (de.ingrid.mapclient.frontend.data.Service.getLayerId(record.get("layer")) == id) {
			return true;
		}
		return false;
	}, this);
	if (index != -1) {
		return this.capabilitiesStore.getAt(index);
	}
	return null;
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
	// compatibility code for non WMS layers (KML layers)
	if (layer.params) {
		return layer.url+':'+layer.params.LAYERS;
	} else {
		return layer.url+':'+layer.name;
	}
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
de.ingrid.mapclient.frontend.data.Service.load = function(capabilitiesUrl, callback, showFlash, expandNode, zoomToExtent) {
	var self = this;

	// if the service is loaded already, return it immediately
	// for now we disable simply this disable this function and load the service
	// in any case, but we might come back to this
//	if (de.ingrid.mapclient.frontend.data.Service.registry.containsKey(capabilitiesUrl)) {
//		// get the service from the registry
//		var service = de.ingrid.mapclient.frontend.data.Service.registry.get(capabilitiesUrl);
//		// call the callback if given
//		if (callback instanceof Function) {
//			if(showFlash)
//			callback(service, showFlash);
//			else
//			callback(service);
//		}
//	}
//	else {
	
		Ext.getBody().mask(i18n('tPleaseWaitCapabilities'));
		// load the service
		var ajax = Ext.Ajax.request({
			url: de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(capabilitiesUrl),
			method: 'GET',
			success: function(response, request) {
				Ext.getBody().unmask();
				var type;
				var format;
				
				if(response.responseText.indexOf('<ViewContext') != -1){
					format = new OpenLayers.Format.WMC();
				}else if(response.responseText.indexOf('<WFS_Capabilities') != -1 || response.responseText.indexOf('<wfs:') != -1){
					de.ingrid.mapclient.Message.showError(i18n('tLoadingFailServiceWFS')+"<br />\nUrl: <br />"+capabilitiesUrl);
					return;
				}else if(response.responseText.indexOf('<csw:') != -1){
					de.ingrid.mapclient.Message.showError(i18n('tLoadingFailServiceCSW')+"<br />\nUrl: <br />"+capabilitiesUrl);
					return;
				}else if(response.responseText.indexOf('ServiceException') != -1){
					de.ingrid.mapclient.Message.showError(i18n('tLoadingFailServiceException')+"<br />\nUrl: <br />"+capabilitiesUrl);
					return;
				}else if(response.responseText.length == 0){
					de.ingrid.mapclient.Message.showError(i18n('tLoadingFailServiceNoContent')+"<br />\nUrl: <br />"+capabilitiesUrl);
					return;
				}else{
					format = new OpenLayers.Format.WMSCapabilities();
				}

				var capabilities = format.read(response.responseText);
				if (capabilities.capability || format.name == "WMC") {
					// set up store data
					// we check if
					var data;
					if(format.name == "WMC"){
						data = new GeoExt.data.WMCReader().readRecords(capabilities);
					}else{
						data = new de.ingrid.mapclient.frontend.data.WMSCapabilitiesReader().readRecords(response.responseText);
					}
					if(data){
						if (data.success) {
							var store;
							if(format.name == "WMC"){
								store = new GeoExt.data.LayerStore();
							}else{
								store = Ext.create('GeoExt.data.WmsCapabilitiesLayerStore', {});								
							}
							
							store.add(data.records);
							// prepare layers from records
							var records = store.getRange();
							var layers = new Ext.util.MixedCollection();
							for (var i=0, count=records.length; i<count; i++) {
								var record = records[i];

								// extract the layer from the record
								var layer = record.getLayer();
								if(format.name == "WMC") {
	                                var myImageFormat = self.getPreferredImageFormat('',data.records[i]);								
	    							layer.mergeNewParams({
	                                    format: myImageFormat.format,
	                                    transparent: myImageFormat.transparent,
	    								INFO_FORMAT: self.getPreferredInfoFormat('',data.records[i])
	    							});
								} else {
									var myImageFormat = self.getPreferredImageFormat(capabilities.capability, null);
	                                layer.mergeNewParams({
	                                    format: myImageFormat.format,
	                                    transparent: myImageFormat.transparent,
	                                    INFO_FORMAT: self.getPreferredInfoFormat(capabilities.capability,null)
	                                });
								}

								// set layer parameters
								// we explicitly set a layerAbstract param, since it somehow gets lost later
								layer.addOptions({layerAbstract:record.data['abstract']},true);
								// Add identifier to options
								if(record.data.identifiers)
									layer.addOptions({identifiers:record.data.identifiers});
								// Add llbox
								if(record.data.llbbox)
									layer.addOptions({llbbox:record.data.llbbox});
								// Add bbox
								if(record.data.bbox){
									layer.bbox = record.data.bbox;
								}
								
								var layerVersion = layer.params.VERSION;
								
								if(layerVersion == "1.3.0"){
									layer.yx["EPSG:4326"] = true;
									layer.yx["EPSG:31466"] = true;
									layer.yx["EPSG:31467"] = true;
									layer.yx["EPSG:31468"] = true;
									layer.yx["EPSG:31469"] = true;
									layer.yx["EPSG:2397"] = true;
									layer.yx["EPSG:2398"] = true;
									layer.yx["EPSG:2399"] = true;
									layer.yx["EPSG:3034"] = true;
									layer.yx["EPSG:3035"] = true;
								}
								
								//check if the config wants us to singleTile or not, but first we check if this property exists
								var isSingleTile = de.ingrid.mapclient.Configuration.getSettings("defaultSingleTile");
								if(isSingleTile){
									layer.singleTile = true;
									layer.ratio = 1;
								}
								//check if the config wants us to transition or not, but first we check if this property exists
								var transitionEffect = de.ingrid.mapclient.Configuration.getSettings("defaultTransitionEffect").trim();
								if(transitionEffect && transitionEffect.length > 0) {
									layer.transitionEffect = transitionEffect;
								}
								layer.visibility = false;
								layer.queryable = record.get("queryable"); // needed for GetFeatureInfo request
								layer.isBaseLayer = false;	// WMS layers are base layers by default, but in this application
															// the base layer is defined explicitly

								layer.styles = record.get("styles");
								self.fixLayerProperties(layer);

								// add the layer to the layer lists
								var layerId = de.ingrid.mapclient.frontend.data.Service.getLayerId(layer);
								layers.add(layerId, layer);
							}

							// create the service instance from the result
							var service;
							if(format.name == "WMC"){
								var temp = {
									title:capabilities.title
								}
								service = new de.ingrid.mapclient.frontend.data.Service(capabilitiesUrl, temp, layers, store);
							}else{
								service = new de.ingrid.mapclient.frontend.data.Service(capabilitiesUrl, capabilities.service, layers, store);
							}
							// register the service
							de.ingrid.mapclient.frontend.data.Service.registry.add(capabilitiesUrl, service);
							// call the callback if given
							if (callback instanceof Function) {
								if(showFlash){
									callback(service, showFlash, false, expandNode, zoomToExtent);
								} else {
									callback(service, false, false, expandNode, zoomToExtent);	
								}
							}
						} else {
							de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
						}
					} else {
						de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
					}
				} else {
					de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
				}
			},
			failure: function(response, request) {
				Ext.getBody().unmask();
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
			}
		});
		
		var task = new Ext.util.DelayedTask(function(){
			if(ajax.conn){
				var msg = Ext.Msg;
				msg.buttonText = {ok: i18n('tOk'), cancel: i18n('tAbbrechen'), yes: i18n('tJa'), no: i18n('tNein')};
				msg.show({
				    title: i18n('tLoadingServiceTaskTitle'),
				    msg: i18n('tLoadingServiceTaskMessage'),
				    buttons: Ext.Msg.YESNO,
				    modal: false,
					fn: function(btn){
						if (btn == 'yes'){
							if(ajax.conn){
								ajax.conn.abort();
								Ext.getBody().unmask();
							}
						}
						if (btn == 'no'){
							task.delay(10000);
						}
					}
				});
				msg.getDialog().getPositionEl().setTop(parseInt(de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop")) + 50);
			}
		});      
        task.delay(10000);
//	}
};

de.ingrid.mapclient.frontend.data.Service.loadDefault = function(capabilitiesUrl, checkedLayers, callback, showFlash, expandNode, zoomToExtent, calls, entry) {
	var self = this;
	// load the service
	var ajax = Ext.Ajax.request({
		url: de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(capabilitiesUrl),
		method: 'GET',
		success: function(response, request) {
			var type;
			var format;
			
			if(response.responseText.indexOf('<ViewContext') != -1){
				format = new OpenLayers.Format.WMC();
			}else if(response.responseText.indexOf('<WFS_Capabilities') != -1 || response.responseText.indexOf('<wfs:') != -1){
				de.ingrid.mapclient.Message.showError(i18n('tLoadingFailServiceWFS')+"<br />\nUrl: <br />"+capabilitiesUrl);
				return;
			}else if(response.responseText.indexOf('<csw:') != -1){
				de.ingrid.mapclient.Message.showError(i18n('tLoadingFailServiceCSW')+"<br />\nUrl: <br />"+capabilitiesUrl);
				return;
			}else if(response.responseText.indexOf('ServiceException') != -1){
				de.ingrid.mapclient.Message.showError(i18n('tLoadingFailServiceException')+"<br />\nUrl: <br />"+capabilitiesUrl);
				return;
			}else if(response.responseText.length == 0){
				de.ingrid.mapclient.Message.showError(i18n('tLoadingFailServiceNoContent')+"<br />\nUrl: <br />"+capabilitiesUrl);
				return;
			}else{
				format = new OpenLayers.Format.WMSCapabilities();
			}

			var capabilities = format.read(response.responseText);
			if (capabilities.capability || format.name == "WMC") {
				// set up store data
				// we check if
				var data;
				if(format.name == "WMC"){
					data = new GeoExt.data.WMCReader().readRecords(capabilities);
				}else{
					data = new de.ingrid.mapclient.frontend.data.WMSCapabilitiesReader().readRecords(response.responseText);
				}
				if(data){
					if (data.success) {
						if(format.name == "WMC")
							var store = new GeoExt.data.LayerStore();
						else
							var store = Ext.create('GeoExt.data.WMSCapabilitiesStore', {
								format: format
							});
						store.add(data.records);
						// prepare layers from records
						var records = store.getRange();
						var layers = new Ext.util.MixedCollection();
						for (var i=0, count=records.length; i<count; i++) {
							var record = records[i];

							// extract the layer from the record
							var layer = record.get("layer");
							if(format.name == "WMC") {
	                            var myImageFormat = self.getPreferredImageFormat('',data.records[i]);								
								layer.mergeNewParams({
	                                format: myImageFormat.format,
	                                transparent: myImageFormat.transparent,
									INFO_FORMAT: self.getPreferredInfoFormat('',data.records[i])
								});
							} else {
								var myImageFormat = self.getPreferredImageFormat(capabilities.capability, null);
	                            layer.mergeNewParams({
	                                format: myImageFormat.format,
	                                transparent: myImageFormat.transparent,
	                                INFO_FORMAT: self.getPreferredInfoFormat(capabilities.capability,null)
	                            });
							}

							// set layer parameters
							// we explicitly set a layerAbstract param, since it somehow gets lost later
							layer.addOptions({layerAbstract:record.data['abstract']},true);
							// Add identifier to options
							if(record.data.identifiers)
								layer.addOptions({identifiers:record.data.identifiers});
							// Add llbox
							if(record.data.llbbox)
								layer.addOptions({llbbox:record.data.llbbox});
							// Add bbox
							if(record.data.bbox){
								layer.bbox = record.data.bbox;
							}
							
							//check if the config wants us to singleTile or not, but first we check if this property exists
							var isSingleTile = de.ingrid.mapclient.Configuration.getSettings("defaultSingleTile");
							if(isSingleTile){
								layer.singleTile = true;
								layer.ratio = 1;
							}
							//check if the config wants us to transition or not, but first we check if this property exists
							var transitionEffect = de.ingrid.mapclient.Configuration.getSettings("defaultTransitionEffect").trim();
							if(transitionEffect && transitionEffect.length > 0) {
								layer.transitionEffect = transitionEffect;
							}
							
							layer.visibility = false;
							
							layer.queryable = record.get("queryable"); // needed for GetFeatureInfo request
							layer.isBaseLayer = false;	// WMS layers are base layers by default, but in this application
														// the base layer is defined explicitly

							layer.styles = record.get("styles");
							self.fixLayerProperties(layer);

							// add the layer to the layer lists
							var layerId = de.ingrid.mapclient.frontend.data.Service.getLayerId(layer);
							layers.add(layerId, layer);
						}

						// create the service instance from the result

						if(format.name == "WMC"){
						var temp = {
							title:capabilities.title
							}
						var service = new de.ingrid.mapclient.frontend.data.Service(capabilitiesUrl, temp, layers, store);
						}
						else
						var service = new de.ingrid.mapclient.frontend.data.Service(capabilitiesUrl, capabilities.service, layers, store);
						// register the service
						de.ingrid.mapclient.frontend.data.Service.registry.add(capabilitiesUrl, service);
						// call the callback if given
						if (callback instanceof Function) {
							if(showFlash)
								callback(service, showFlash, false, expandNode, zoomToExtent, checkedLayers);
							else
								callback(service, false, false, expandNode, zoomToExtent, checkedLayers);
						}
					} else {
						de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
					}
				}
			} else {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
			}
			if(entry < calls.length){
				self.loadCalls(calls, entry);
			}
		},
		failure: function(response, request) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE+"<br />\nUrl: "+capabilitiesUrl);
			if(entry < calls.length){
				self.loadCalls(calls, entry);
			}
		}
	});
};

de.ingrid.mapclient.frontend.data.Service.loadCalls = function(calls, entry) {
	var self = this;
	if(calls[entry]){
		var capabilitiesUrl = calls[entry][0];
		var checkedLayers = calls[entry][1];
		var callback = calls[entry][2];
		var showFlash = calls[entry][3];
		var expandNode = calls[entry][4];
		var zoomToExtent = calls[entry][5];
		self.loadDefault(capabilitiesUrl, checkedLayers, callback, showFlash, expandNode, zoomToExtent, calls, entry + 1);
	}
}

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
	if (service) {
		var serviceLayer = service.getLayerById(de.ingrid.mapclient.frontend.data.Service.getLayerId(layer));
		if (serviceLayer) {
			layer.mergeNewParams(serviceLayer.params);
			layer.llbbox = serviceLayer.llbbox;
		}
	}
};

/**
 * Fix layer properties in order to work with OpenLayers
 * @param layer OpenLayers.Layer instance
 */
de.ingrid.mapclient.frontend.data.Service.fixLayerProperties = function(layer) {
	// fix layer properties
	layer.maxScale = layer.maxScale == Infinity ? 0 : layer.maxScale;
	layer.minScale = layer.minScale == Infinity ? 0 : layer.minScale;
	layer.options.maxScale = layer.options.maxScale == Infinity ? 0 : layer.options.maxScale;
	layer.options.minScale = layer.options.minScale == Infinity ? 0 : layer.options.minScale;
};

/**
 * Get the preferred image format for the GetMap request for the given capabilities.
 * Always uses png if supported. Otherwise use first format ! If that one is jpeg transparency is false !
 * This is a fix to OpenLayers which always delivers png (if opaque attribute in layer not set !?).
 * @param capability The capability object created by OpenLayers
 * @return { "format":string, "transparent":boolean }<br/>
 *  default if no format set:<br/>
 *  { format: "image/png", transparent: true }
 */
de.ingrid.mapclient.frontend.data.Service.getPreferredImageFormat = function(capability, wmcData) {
	// default settings if NO format !
	var myImageFormat = { format: "image/png", transparent: true };

	var formats = [];
	if (capability.request && capability.request.getmap) {
		formats = capability.request.getmap.formats || [];
	} else if(wmcData){
        formats = wmcData.data.formats || [];
    }

    if (formats.length > 0) {
        for (var i=0, count=formats.length; i<count; i++) {
        	var formatValue = formats[i];
        	if (wmcData)
                formatValue = formats[i].value;

            // always use first image format as default !
            if (i==0) {
                myImageFormat.format = formatValue;
                if (formatValue.toLowerCase().match(/jpeg/)) {
                    myImageFormat.transparent = false;
                } else {
                    myImageFormat.transparent = true;            	
                }
            }
            
            // check if format is png, then use that one !
            if (formatValue.toLowerCase().match(/png/)) {
                myImageFormat.format = formatValue;
                myImageFormat.transparent = true;
                break;
            }
        }
    }
	return myImageFormat;
};


/**
 * Get the preferred info format for the GetFeatureInfo request for the given capabilities.
 * @param capability The capability object created by OpenLayers
 * @return String (Mime type)
 */
de.ingrid.mapclient.frontend.data.Service.getPreferredInfoFormat = function(capability, wmcData) {
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
	}else if(wmcData){
		var formats = wmcData.data.formats || [];
		// prefer html and fallback to first offered format
		if (formats.length > 0) {
			for (var i=0, count=formats.length; i<count; i++) {
				if (formats[i].value.match(/html/)) {
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
