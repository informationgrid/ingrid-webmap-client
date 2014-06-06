/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultServicePanel is used to select a default WMS server
 * and the default map layers provided by it.
 */
de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel = Ext.extend(Ext.Panel, {

	title: 'Hintergrundkarte',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,

	/**
	 * A simple ArrayStore for the map layer names of the current capabilities url
	 */
	layerStore: new Ext.data.ArrayStore({
		autoDestroy: true,
		fields: [{
			name: 'title',
			type: 'string'
		}]
	}),

	/**
	 * The grid that contains the layer names and is used to select the default map layers
	 */
	layerGrid: null,

	/**
	 * The field that contains the WMS capabilities url
	 */
	wmsCapUrlField: new Ext.form.TextField({
		fieldLabel: 'WMS Capabilities Url der Hintergrundkarte',
		allowBlank: false,
		anchor: '99%'
	}),

	/**
	 * The field that contains the base layer name
	 */
	baseLayerCombo: null,
	
	/**
	 * The copyright field
	 */
	baseLayerCopyrightTextField: null,
	
	featureInfoTextField: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.prototype.initComponent = function() {

	this.baseLayerCombo = new Ext.form.ComboBox({
		fieldLabel: 'Baselayer',
		triggerAction: 'all',
		mode: 'local',
		store: this.layerStore,
		valueField: 'title',
		displayField: 'title',
		editable: false,
		allowBlank: false
	});

	this.baseLayerCopyrightTextField = new Ext.form.TextField({
		fieldLabel: 'Auf der Karte eingeblendeter Copyrightvermerk',
		allowBlank: true,
		anchor: '99%'
	});
	
	this.featureInfoTextField = new Ext.form.TextField({
		fieldLabel: 'WMS f&uuml;r die FeatureInfo-Abfrage',
		allowBlank: true,
		anchor: '99%'
	});
	
	var selectionModel = new Ext.grid.CheckboxSelectionModel();
	this.layerGrid = new Ext.grid.GridPanel({
		store: this.layerStore,
		columns: [selectionModel, {
			header: 'Alle Layer',
			sortable: true,
			dataIndex: 'title'
		}],
		autoHeight: true,
		viewConfig: {
			autoFill: true,
			forceFit: true,
			columnsText: 'Spalten',
            sortAscText: 'A-Z sortieren',
            sortDescText: 'Z-A sortieren'
		},
		selModel: selectionModel
	});

	var self = this;
	Ext.apply(this, {
		items: [{
			xtype: 'container',
			layout: 'column',
			anchor: '100%',
			items: [{
				xtype: 'container',
				columnWidth: 1,
				layout: 'form',
				labelAlign: 'top',
				labelSeparator: '',
				height: 50,
				items: this.wmsCapUrlField
			}, {
				xtype: 'container',
				width: 100,
				layout: 'form',
				labelAlign: 'top',
				labelSeparator: '',
				height: 50,
				items: {
					xtype: 'button',
					text: 'Laden',
					fieldLabel: '&nbsp;',
					anchor: '100%',
					handler: function() {
						if (self.wmsCapUrlField.validate()) {
							self.loadCapUrl();
						}
					}
				}
			}]
		}, this.layerGrid, {
		    // spacer
			xtype: 'container',
			height: 20
	    }, this.baseLayerCombo
	    , this.baseLayerCopyrightTextField
	    , this.featureInfoTextField
	    , {
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
				width: 100,
				items: {
					xtype: 'button',
					id: 'featureInfoBtn',
					text: 'Speichern',
					anchor: '100%',
					style: {
		                paddingTop: '10px'
		            },
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
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.superclass.onRender.apply(this, arguments);

	// initialize the capUrl field and layer grid
	var capUrl = de.ingrid.mapclient.Configuration.getValue("wmsCapUrl");
	this.wmsCapUrlField.setValue(capUrl);
	this.loadLayers();
	var wmsCopyright = de.ingrid.mapclient.Configuration.getValue("wmsCopyright");
	this.baseLayerCopyrightTextField.setValue(wmsCopyright);
	var featureUrl = de.ingrid.mapclient.Configuration.getValue("featureUrl");
	this.featureInfoTextField.setValue(featureUrl);
};

/**
 * Get the configured capabilities url
 * @return String
 */
de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.prototype.getCapabilitiesUrl = function() {
	return this.wmsCapUrlField.getValue();
};

/**
 * Save the capabilities url on the server
 */
de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.prototype.loadCapUrl = function() {
	var capUrl = this.getCapabilitiesUrl();
	var self = this;
	self.loadLayers(function(success) {
		if (!success) {
			self.wmsCapUrlField.markInvalid();
		}
	});
};

de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.prototype.save = function() {
	var copyrightValue = this.baseLayerCopyrightTextField.getValue();
	var featureUrl = this.featureInfoTextField.getValue();
	var capUrl = this.getCapabilitiesUrl();
	
	var selectedLayerRecords = this.layerGrid.getSelectionModel().getSelections();

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
		this.layerGrid.getSelectionModel().selectRecords([baseLayerRecord], true);
	}
	
	var saveDefaultSettings = { 
			copyrightValue:copyrightValue, 
			featureUrl:featureUrl, 
			selectedLayers: selectedLayers,
			capUrl:capUrl
	};
	
	de.ingrid.mapclient.Configuration.setValue('saveDefaultSettings', Ext.encode(saveDefaultSettings), de.ingrid.mapclient.admin.DefaultSaveHandler);
};
	
/**
 * Load and display the layers contained in the configured capabilities url
 * @param callback Function to be called after the data are loaded. The callback is called with a boolean
 * value as parameter indicating the success or failure of the operation
 */
de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel.prototype.loadLayers = function(callback) {
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
                self.layerGrid.getSelectionModel().selectRows(selectedLayerIndexes);

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
};
