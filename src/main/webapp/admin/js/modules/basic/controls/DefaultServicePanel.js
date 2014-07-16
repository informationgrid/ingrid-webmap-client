/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultServicePanel is used to select a default WMS server
 * and the default map layers provided by it.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel', { 
	extend: 'Ext.panel.Panel', 
	id: 'defaultServicePanel',
	title: 'Hintergrundkarte',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,
	autoScroll: true,
	bodyPadding: 10,
	/**
	 * A simple ArrayStore for the map layer names of the current capabilities url
	 */
	layerStore: null,

	/**
	 * The grid that contains the layer names and is used to select the default map layers
	 */
	layerGrid: null,

	/**
	 * The field that contains the WMS capabilities url
	 */
	wmsCapUrlField: null,

	baseLayerCombo: null,
	
	/**
	 * The copyright field
	 */
	baseLayerCopyrightTextField: null,
	
	featureInfoTextField: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		this.wmsCapUrlField = Ext.create('Ext.form.field.Text', {
			id: 'defaultServiceWmsCapUrlField',
			fieldLabel: 'WMS Capabilities Url der Hintergrundkarte',
			vtype: 'url',
			labelAlign: 'top',
			labelSeparator: '',
			listeners:{
				afterRender: function(){
					var capUrl = de.ingrid.mapclient.Configuration.getValue("wmsCapUrl");
					this.setValue(capUrl);
					self.loadLayers();
				}
			}
		});
		
		this.layerStore = Ext.create('Ext.data.ArrayStore', {
			autoDestroy: true,
			fields: [{
				name: 'title',
				type: 'string'
			}]
		});
		
		this.baseLayerCombo = Ext.create('Ext.form.field.ComboBox', {
			id: 'defaultServiceBaseLayerCombo',
			width: 135,
			fieldLabel: 'Baselayer',
			typeAhead: true,
		    triggerAction: 'all',
		    lazyRender:true,
		    queryMode: 'local',
		    store: this.layerStore,
			valueField: 'title',
			displayField: 'title',
			labelAlign: 'top'
		});

		this.baseLayerCopyrightTextField = Ext.create('Ext.form.field.Text', {
			id: 'defaultServiceBaseLayerCopyrightTextField',
			fieldLabel: 'Auf der Karte eingeblendeter Copyrightvermerk',
			allowBlank: true,
			labelAlign: 'top',
			labelSeparator: '',
			listeners:{
				afterRender: function(){
					var wmsCopyright = de.ingrid.mapclient.Configuration.getValue("wmsCopyright");
					this.setValue(wmsCopyright);
				}
			}
		});
		
		this.featureInfoTextField = Ext.create('Ext.form.field.Text', {
			id: 'defaultServiceFeatureInfoTextField',
			fieldLabel: 'WMS f&uuml;r die FeatureInfo-Abfrage',
			allowBlank: true,
			labelAlign: 'top',
			labelSeparator: '',
			listeners:{
				afterRender: function(){
					var featureUrl = de.ingrid.mapclient.Configuration.getValue("featureUrl");
					this.setValue(featureUrl);
				}
			}
		});
		
		this.layerGrid = Ext.create('Ext.grid.Panel', {
			id: 'defaultServiceLayerGrid',
			store: this.layerStore,
			forceFit: true,
		    columns: {
		        items:{
					header: 'Alle Layer',
					sortable: true,
					dataIndex: 'title'
		        },
		        columnsText: 'Spalten',
	            sortAscText: 'A-Z sortieren',
	            sortDescText: 'Z-A sortieren'
		    },
			autoHeight: true,
			viewConfig: {
				autoFill: true,
				forceFit: true,
				columnsText: 'Spalten',
	            sortAscText: 'A-Z sortieren',
	            sortDescText: 'Z-A sortieren'
			},
			selModel: Ext.create('Ext.selection.CheckboxModel', { mode:'SIMPLE' })
		});

		var self = this;
		Ext.apply(this, {
			items: [
			this.wmsCapUrlField,
			{
				xtype: 'container',
				layout: 'column',
				anchor: '100%',
			    items: [{
					xtype: 'container',
					columnWidth: 1
				}, {
					xtype: 'container',
					layout: 'form',
					width: 100,
					items: {
						xtype: 'button',
						text: 'Laden',
						fieldLabel: '&nbsp;',
						handler: function() {
							if (self.wmsCapUrlField.validate()) {
								self.loadCapUrl();
							}
						}
					}
				}]
		    },
			this.layerGrid, {
			    // spacer
				xtype: 'container',
				height: 20
		    }, 
		    this.baseLayerCombo,
		    this.baseLayerCopyrightTextField,
		    this.featureInfoTextField, 
		    {
				xtype: 'container',
				layout: 'column',
				anchor: '100%',
			    items: [{
					xtype: 'container',
					columnWidth: 1
				}, {
					xtype: 'container',
					layout: 'form',
					width: 100,
					items: {
						xtype: 'button',
						id: 'featureInfoBtn',
						text: 'Speichern',
						anchor: '100%',
						handler: function() {
							if (self.baseLayerCombo.validate() && self.baseLayerCopyrightTextField.validate() && self.featureInfoTextField.validate() && self.wmsCapUrlField.validate()) {
								self.save();
							}
						}
					}
				}]
		    }]
		});
		de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		// initialize the capUrl field and layer grid
		de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.superclass.onRender.apply(this, arguments);
	},
	/**
	 * Get the configured capabilities url
	 * @return String
	 */
	getCapabilitiesUrl: function() {
		return this.wmsCapUrlField.getValue();
	},
	/**
	 * Save the capabilities url on the server
	 */
	loadCapUrl: function() {
		var capUrl = this.getCapabilitiesUrl();
		var self = this;
		self.loadLayers(function(success) {
			if (!success) {
				self.wmsCapUrlField.markInvalid();
			}
		});
	},
	save: function() {
		var copyrightValue = this.baseLayerCopyrightTextField.getValue();
		var featureUrl = this.featureInfoTextField.getValue();
		var capUrl = this.getCapabilitiesUrl();
		
		var selectedLayerRecords = this.layerGrid.getSelectionModel().getSelection();

		// aggregate layer configuration
		var selectedLayers = [];
		var baseLayerName = this.baseLayerCombo.getValue();
		var baseLayerIncluded = false;
		for (var i=0, count=selectedLayerRecords.length; i<count; i++) {
			var title = selectedLayerRecords[i].get('title');
			var isBaseLayer = (baseLayerName == title) ? true : false;
			var layer = {
				name: title,
				isBaseLayer: isBaseLayer
			};
			if (isBaseLayer) {
				baseLayerIncluded = true;
			}
			selectedLayers.push(layer);
		}

		// make sure that the selected baselayer is contained in the selection
		if (!baseLayerIncluded) {
			// find the layer in the store (this is not necessary at the moment, but if we need more
			// data from the record. it will be)
			var baseLayerIndex = this.layerStore.findExact('title', baseLayerName);
			var baseLayerRecord = this.layerStore.getAt(baseLayerIndex);
			var baseLayer = {
				name: baseLayerName,
				isBaseLayer: true
			};
			selectedLayers.push(baseLayer);
			// select the layer in the grid
			this.layerGrid.getSelectionModel().select([baseLayerRecord], true);
		}
		
		var saveDefaultSettings = { 
				copyrightValue:copyrightValue, 
				featureUrl:featureUrl, 
				selectedLayers: selectedLayers,
				capUrl:capUrl
		};
		
		de.ingrid.mapclient.Configuration.setValue('saveDefaultSettings', Ext.encode(saveDefaultSettings), de.ingrid.mapclient.admin.DefaultSaveHandler);
	},
	/**
	 * Load and display the layers contained in the configured capabilities url
	 * @param callback Function to be called after the data are loaded. The callback is called with a boolean
	 * value as parameter indicating the success or failure of the operation
	 */
	loadLayers: function(callback) {
		// clear the store and show the loading mask
	    this.layerStore.removeAll();
	    this.getEl().mask('Layer werden geladen ...', 'x-mask-loading');
		
	    // load the capabilities document to get the layer names
		var capUrl = this.getCapabilitiesUrl();
		var self = this;
		Ext.Ajax.request({
			url: de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(capUrl),
			method: 'GET',
			success: function(response, request) {
			    var format = new OpenLayers.Format.WMSCapabilities();
	            var capabilities = format.read(response.responseText);
	            if (capabilities.capability) {

	                // set up store data
	                var layers = capabilities.capability.layers;
	            	de.ingrid.mapclient.data.StoreHelper.load(self.layerStore, layers, ['title'], false);

	            	// get the selected layer names and base layer name from the configuration
	            	var selectedLayers = de.ingrid.mapclient.Configuration.getValue("layers");
	            	var selectedLayerNames = [];
	            	var baseLayerName = '';
	                for (var i=0, count=selectedLayers.length; i<count; i++) {
	                	var layer = selectedLayers[i];
	                	selectedLayerNames.push(layer.name);
	                	if (layer.isBaseLayer == true) {
	                		baseLayerName = layer.name;
	                	}
	                }

	                // find indexes of selected layers
	                var selectedLayerIndexes = [];
	                for (var i=0, count=layers.length; i<count; i++) {
	                	var layer = layers[i];
	                	if (selectedLayerNames.indexOf(layer.title) != -1) {
	                		selectedLayerIndexes.push(i);
	                	}
	                }

	             // set grid selection
	                var selectionRecords = [];
	                for(var i=0; i<selectedLayerIndexes.length;i++){
	                	if(self.layerGrid.getStore()){
	                		selectionRecords.push(self.layerGrid.getStore().getAt(selectedLayerIndexes[i]));
	                	}
	                }
	                self.layerGrid.getSelectionModel().select(selectionRecords);
	                
	                // set the base layer
	                if (self.layerStore.findExact('title', baseLayerName) != -1) {
	                	self.baseLayerCombo.setValue(baseLayerName);
	                }
	                self.getEl().unmask();
	            	if (callback instanceof Function) {
	            		callback(true);
	            	}
	            }
	            else {
	            	de.ingrid.mapclient.Message.showError('Das Laden des Capabilities Dokuments ist fehlgeschlagen.');
	            	self.getEl().unmask();
	            	if (callback instanceof Function) {
	            		callback(false);
	            	}
	            }
			},
			failure: function(response, request) {
				de.ingrid.mapclient.Message.showError('Das Laden des Capabilities Dokuments ist fehlgeschlagen.');
				self.getEl().unmask();
	        	if (callback instanceof Function) {
	        		callback(false);
	        	}
			}
		});
	}
});