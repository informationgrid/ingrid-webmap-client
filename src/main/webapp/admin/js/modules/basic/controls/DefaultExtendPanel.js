/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultExtendPanel is used to define the map's default extend.
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel = Ext.extend(Ext.Panel, {

	title: 'Eigenschaften',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,

	/**
	 * The map extend panel
	 */
	mapExtendPanel: null,
	
	gridDefault: null,
	settingsStoreDefault: {},
	propertyNamesDefault: {}
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.prototype.initComponent = function() {

	this.mapExtendPanel = new de.ingrid.mapclient.admin.controls.MapExtendPanel({
	});

	var self = this;
	
	// create the searcher grid
	this.gridDefault = new Ext.grid.PropertyGrid({
		title: 'Karten Einstellungen',
	    autoHeight: true,
        propertyNames: this.propertyNamesDefault,
        source:  this.settingsStoreDefault,
        viewConfig : {
            forceFit: true,
            scrollOffset: 2 // the grid will never have scrollbars
        },
        autoExpandColumn: {
            forceFit: true
        }
	});
	
	
	Ext.apply(this, {
		items: [this.mapExtendPanel,
		        {
		        	xtype: 'container',
					height: 20
			    },
			    {
					xtype: 'container',
					layout: 'column',
					anchor: '100%',
				    items: [{
						xtype: 'container',
						columnWidth: 1,
						height: 50
					}, {
						xtype: 'container',
						layout: 'form',
						height: 50,
						items: {
							xtype: 'button',
							text: 'Initiale Kartenausdehnung Speichern',
							anchor: '100%',
							style: {
				                paddingTop: '10px'
				            },
							handler: function() {
								if (self.mapExtendPanel.validate()) {
									self.saveMapExtend();
								}
							}
						}
					}]
			    },
	            this.gridDefault,
		        {
		        	xtype: 'container',
					height: 20
			    },
			    {
					xtype: 'container',
					layout: 'column',
					anchor: '100%',
				    items: [{
						xtype: 'container',
						columnWidth: 1,
						height: 50
					}, {
						xtype: 'container',
						layout: 'form',
						height: 50,
						items: {
							xtype: 'button',
							text: 'Einstellungen Speichern',
							anchor: '100%',
							style: {
				                paddingTop: '10px'
				            },
							handler: function() {
								self.saveSettings();
							}
						}
					}]
			    }]
	});
	de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.superclass.onRender.apply(this, arguments);

	// initialize the settings list
	var settings = de.ingrid.mapclient.Configuration.getValue('settings');
	if(settings){
		for (var i=0, count=settings.length; i<count; i++) {
			var setting = settings[i];
			var key = setting.key;
			var value = setting.value;
			
			// Check if boolean value
			if (value.toLowerCase()=='false'){
				value = false;
			} else if (value.toLowerCase()=='true'){
			    value =  true;
			}
			
			if(setting.group == "default"){
				this.settingsStoreDefault[key] = value;
				this.propertyNamesDefault[key] = setting.name;
			}
		}
	}
	
	// initialize the mapExtend fields
	var mapExtend = de.ingrid.mapclient.Configuration.getValue("mapExtend");
	this.mapExtendPanel.setExtend(mapExtend.north, mapExtend.west, mapExtend.east, mapExtend.south);
};

/**
 * Save the map extend on the server
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.prototype.saveMapExtend = function() {
	var self = this;
	var mapExtend = self.mapExtendPanel.getExtend();
	var wmsCapUrl = de.ingrid.mapclient.Configuration.getValue("wmsCapUrl");
	
	Ext.Ajax.request({
		url: de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(wmsCapUrl),
		method: 'GET',
		success: function(response, request) {
		    var format = new OpenLayers.Format.WMSCapabilities();
            var capabilities = format.read(response.responseText);
            if (capabilities.capability) {

                // set up store data
                var layers = capabilities.capability.layers;

                // get the selected layer names and base layer name from the configuration
            	var selectedLayers = de.ingrid.mapclient.Configuration.getValue("layers");
            	if(typeof selectedLayers == "string"){
            		selectedLayers = JSON.parse(de.ingrid.mapclient.Configuration.getValue("layers"));
            	}
            	var baseLayerName = '';
            	var layerCheckBBOX; 
                for (var i=0, count=selectedLayers.length; i<count; i++) {
                	var layer = selectedLayers[i];
                	if (layer.isBaseLayer == true) {
                		baseLayerName = layer.name;
                	}
                }
                
                if(layers){
                	for (var i=0, count=layers.length; i<count; i++) {
                		var layer = layers[i];
                		if(layer.title == baseLayerName){
                			layerCheckBBOX = layer;
                			break;
                		}
                	}
                }
                
                if(layerCheckBBOX.llbbox){
                	var checkBBOX = layerCheckBBOX.llbbox;
                	if(checkBBOX){
                		var checkBBOXWest = Math.round(parseFloat(checkBBOX[0]) * 10000) / 10000; // min y
                		var checkBBOXSouth = Math.round(parseFloat(checkBBOX[1]) * 10000) / 10000; // min x
                		var checkBBOXEast = Math.floor(parseFloat(checkBBOX[2]) * 10000) / 10000; // max y
                    	var checkBBOXNorth = Math.floor(parseFloat(checkBBOX[3])* 10000) / 10000; // max x

                    	if(mapExtend){
                    		// WEST (min y)
                    		if(mapExtend.west < checkBBOXWest){
                    			mapExtend.west = checkBBOXWest;
                    		}else if(mapExtend.west > checkBBOXEast){
	                	  		mapExtend.west = checkBBOXWest;
	                	  	}
                    		
                    		// SOUTH (min x)
	                    	if(mapExtend.south < checkBBOXSouth){
	                    		mapExtend.south = checkBBOXSouth;
	                	  	}else if(mapExtend.south > checkBBOXNorth){
	                	  		mapExtend.south = checkBBOXSouth;
	                	  	}
	                    	
	                    	// EAST (max y)
	                    	if(mapExtend.east > checkBBOXEast){
	                    		mapExtend.east = checkBBOXEast;
	                	  	}else if(mapExtend.east < checkBBOXWest){
	                	  		mapExtend.east = checkBBOXEast;
	                	  	}
	                    	
	                    	// NORTH (max x)
	                    	if(mapExtend.north > checkBBOXNorth){
	                    		mapExtend.north = checkBBOXNorth;
	                	  	}else if(mapExtend.north < checkBBOXSouth){
	                	  		mapExtend.north = checkBBOXNorth;
	                	  	}
                    	}
                	}
                }
                de.ingrid.mapclient.Configuration.setValue('mapExtend', Ext.encode(mapExtend), de.ingrid.mapclient.admin.DefaultSaveHandler);
                self.mapExtendPanel.setExtend(mapExtend.north, mapExtend.west, mapExtend.east, mapExtend.south);
            } else {
            	de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE);
            }
		},
		failure: function(response, request) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE);
		}
	});
};

/**
 * Save the settings list on the server
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.prototype.saveSettings = function() {
	var settings = [];
	settings.push(this.settingsStoreDefault);
	de.ingrid.mapclient.Configuration.setValue('settings', Ext.encode(settings), de.ingrid.mapclient.admin.DefaultSaveHandler);
};