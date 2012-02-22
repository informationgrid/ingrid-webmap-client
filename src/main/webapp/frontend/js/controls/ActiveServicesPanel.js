/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class ActiveServicesPanel shows the activated services.
 * The panels fires a 'datachanged' event, if the list of services changed.
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel = Ext.extend(Ext.Panel, {
	title: "Aktive Dienste",
	autoScroll: true,

	/**
	 * @cfg OpenLayers.Map instance to sync the internal store with
	 */
	map: null,

	/**
	 * The currently selected node
	 */
	activeNode: null,

	/**
	 * Ext.util.MixedCollection containing the de.ingrid.mapclient.frontend.data.Service instances
	 */
	services: new Ext.util.MixedCollection(),

	/**
	 * GeoExt.data.LayerStore instance
	 */
	layerStore: null,

	/**
	 * Ext.tree.TreePanel instance
	 */
	layerTree: null,

	/**
	 * Toolbar buttons
	 */
	addBtn: null,
	removeBtn: null,
	transparencyBtn: null,
	metaDataBtn: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.initComponent = function() {

	var self = this;

	// add the datachanged event
	this.addEvents({
		datachanged: true
	});

	// create the layer store
	this.layerStore = new GeoExt.data.LayerStore({
		map: this.map,
		initDir: GeoExt.data.LayerStore.MAP_TO_STORE
	});

	// create the toolbar buttons
	this.addBtn = new Ext.Button({
		iconCls: 'iconAdd',
		tooltip: 'Dienst hinzuf�gen',
		disabled: false,
		handler: function(btn) {
			new de.ingrid.mapclient.frontend.controls.NewServiceDialog({
				activeServicesPanel: self
			}).show();
		}
	});
	this.removeBtn = new Ext.Button({
		iconCls: 'iconRemove',
		tooltip: 'Dienst entfernen',
		disabled: true,
		handler: function(btn) {
			if (self.activeNode) {
				self.removeService(self.activeNode.attributes.service);
			}
		}
	});
	this.transparencyBtn = new Ext.Button({
		iconCls: 'iconTransparency',
		tooltip: 'Layer-Transparenz',
		disabled: true,
		handler: function(btn) {
			if (self.activeNode) {
				self.displayOpacitySlider(self.activeNode.layer);
			}
		}
	});
	this.metaDataBtn = new Ext.Button({
		iconCls: 'iconMetadata',
		tooltip: 'Metadaten',
		disabled: true,
		handler: function(btn) {
			if (self.activeNode) {
				self.displayMetaData(self.activeNode);
			}
		}
	});

	// the layer tree
	this.layerTree = new Ext.tree.TreePanel({
		root: {
			nodeType: 'async',
			text: 'Layers',
			expanded: true,
			children: []
		},
		rootVisible: false,
		enableDD: true,
		border: false
	});

	var self = this;
	this.layerTree.getSelectionModel().on('selectionchange', function(selModel, node) {
		// default
		self.addBtn.enable();
		self.removeBtn.enable();
		self.transparencyBtn.disable();
		self.metaDataBtn.enable();

		if (node) {
			if (node.layer) {
				self.transparencyBtn.enable();
				self.updateOpacitySlider(node.layer);
				self.removeBtn.disable();
			}else {
				if(node.attributes.service){
					self.transparencyBtn.disable();
					self.removeBtn.enable();	
				}else{
					// For layer folder "Zeige Punktkoordinaten"
					self.transparencyBtn.disable();
					self.removeBtn.disable();
					self.metaDataBtn.disable();
				}
			}
		}
		self.activeNode = node;
	});

	Ext.apply(this, {
		items: this.layerTree,
		tbar: items = [
			this.addBtn,
			this.removeBtn,
			this.transparencyBtn,
			this.metaDataBtn
		]
	});
	de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.superclass.initComponent.call(this);
};

/**
 * Get the layer store
 * @return GeoExt.data.LayerStore instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.getLayerStore = function() {
	return this.layerStore;
};

/**
 * Check if a service is already contained in this panel
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 * @return Boolean
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.containsService = function(service) {
	return this.services.containsKey(service.getCapabilitiesUrl());
};

/**
 * Add a service to the panel
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.addService = function(service) {
	if(service != undefined){
		if (this.containsService(service)) {
			return;
		}
	
		
		var serviceLayers = service.getLayers();
		var serviceRecords = this.layerStore.reader.readRecords(serviceLayers).records;
	
		// add service layers to the store, if they are not already contained
		for (var i=0, count=serviceRecords.length; i<count; i++) {
			var serviceRecord = serviceRecords[i];
			var index = this.layerStore.findBy(function(record) {
				var serviceLayer = serviceRecord.get('layer');
				var layer = record.get('layer');
				return de.ingrid.mapclient.frontend.data.Service.compareLayers(serviceLayer, layer);
			});
			if (index == -1) {
				this.layerStore.add([serviceRecord]);
			}
		}
	
		// add service node to the tree
		var node = new GeoExt.tree.LayerContainer({
			text: service.getDefinition().title,
			layerStore: this.layerStore,
			leaf: false,
			expanded: true,
			service: service,
			loader: {
				filter: function(record) {
					var layer = record.get("layer");
					var layerBelongsToService = service.contains(layer);
					return layerBelongsToService;
				}
			}
		});
		this.layerTree.root.appendChild(node);
	
		this.services.add(service.getCapabilitiesUrl(), service);
		this.fireEvent('datachanged');
	}
	
};

/**
 * Remove a service from the panel
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removeService = function(service) {

	if (!this.containsService(service)) {
		return;
	}

	// remove service layers from the store
	var recordsToRemove = [];
	this.layerStore.each(function(record) {
		if (service.contains(record.get("layer"))) {
			recordsToRemove.push(record);
		}
	});
	this.layerStore.remove(recordsToRemove);

	// remove service node from the tree
	var node = this.layerTree.root.findChildBy(function(child) {
		var isServiceNode = false;
		var curService = child.attributes.service;
		if (curService != undefined) {
			isServiceNode = (curService.getCapabilitiesUrl() == service.getCapabilitiesUrl());
		}
		return isServiceNode;
	}, this, true);
	if (node) {
		node.remove(true);
	}

	this.services.removeKey(service.getCapabilitiesUrl());
	this.fireEvent('datachanged');
};

/**
 * Remove all services from the panel
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removeAll = function() {
	var self = this;
	this.services.each(function(service) {
		self.removeService(service);
	});
};

/**
 * Get the list of activated services
 * @return Array of de.ingrid.mapclient.frontend.data.Service instances
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.getServiceList = function() {
	return this.services.getRange();
};

/**
 * Open a window with meta info of a map layer
 * @param node Ext.tree.TreeNode instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.displayMetaData = function(node) {
	var layer = node.attributes.layer;
	var service = de.ingrid.mapclient.frontend.data.Service.findByLayer(layer);
	if (service) {
		new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
			capabilitiesUrl: service.getCapabilitiesUrl(),
			layer: layer
		}).show();
	}else{
		service = node.attributes.service;
		if(service){
			new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
				capabilitiesUrl: service.getCapabilitiesUrl(),
				layer: layer
			}).show();
		}
	}
};

/**
 * Display a opacity slider for the selected layer
 * @param layer The layer, for which to set the opacity
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.displayOpacitySlider = function(layer) {
	this.opacityDialog = new de.ingrid.mapclient.frontend.controls.OpacityDialog({
		layer: layer
	});
	this.opacityDialog.show();
};

/**
 * Check if a opacity slider dialog is currently opened and update it with the given layer
 * @param layer The layer, for which to set the opacity
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.updateOpacitySlider = function(layer) {
	if (this.opacityDialog && !this.opacityDialog.isDestroyed) {
		this.opacityDialog.close();
		this.displayOpacitySlider(layer);
	}
};

/**
 * Add KML to active service panel
 * @param title of KML
 * @param url of KML file
 */

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.addKml = function(kmlArray) {
	var layers = new Array();
	var styleMap = new OpenLayers.StyleMap({
		'default':{
			 label : "${name}",
			 fontColor: "${fontColor}",
			 fontSize: "11px",
			 labelAlign: "${labelAlign}",
			 strokeColor: "${strokeColor}",
             fillColor: "${fillColor}",
			 pointRadius: 3,
			 labelXOffset : "${labelX}",
			 labelYOffset : "${labelY}"
		}});

	for ( var i = 0, count = kmlArray.length; i < count; i++) {
		var addedKml = kmlArray[i];
		var kmlTitle = addedKml.title;
		var kmlUrl = addedKml.url;
		if(kmlTitle == undefined){
			var addedKmlTitle = addedKml[0];
			if(addedKmlTitle != undefined){
				var addedKmlTitleValue = addedKmlTitle[1];
				if(addedKmlTitleValue != undefined){
					kmlTitle = addedKmlTitleValue;
				}
			}
		}
		
		if(kmlUrl == undefined){
			var addedKmlUrl = addedKml[1];
			if(addedKmlUrl != undefined){
				var addedKmlUrlValue = addedKmlUrl[1];
				if(addedKmlUrlValue != undefined){
					kmlUrl = addedKmlUrlValue;
				}
			}
		}
		if(kmlTitle != undefined && kmlUrl != undefined){
			var layer = new OpenLayers.Layer.GML(kmlTitle, kmlUrl, {
				   format: OpenLayers.Format.KML,
				   formatOptions: {
					 extractStyles: true,
				     extractAttributes: true,
				     maxDepth: 2},
				     styleMap: styleMap
				     },
				     displayOutsideMaxExtent = false
				);
			
			var selectCtrl = new OpenLayers.Control.SelectFeature(layer);
			function createPopup(feature) {
				popup = new GeoExt.Popup({
			        title: feature.data.name,
			        location: feature,
			        unpinnable:false,
			        width:400,
			        html: feature.data.description,
			    });
			    // unselect feature when the popup
			    // is closed
			    popup.on({
			        close: function() {
			            if(OpenLayers.Util.indexOf(layer.selectedFeatures,
			                                       this.feature) > -1) {
			                selectCtrl.unselect(this.feature);
			            }
			        }
			    });
			    popup.show();
			}
			layer.events.on({
				featureselected: function(e) {
		            createPopup(e.feature);
		        }
			});

			
			this.map.addControl(selectCtrl);
		    selectCtrl.activate();

			layers.push(layer);
			this.map.addLayer(layer);
		}
	}
	
	var store = new GeoExt.data.LayerStore({
	    layers: layers
	});

	var overlayLayerNode = new GeoExt.tree.OverlayLayerContainer({
		text: 'Zeige Punktkoordinaten',
		initDir:0,
	    layerStore: store,
	    leaf: false,
	    expanded: true

	});
	
	if(this.layerTree != null){
		this.layerTree.getRootNode().appendChild(overlayLayerNode);	
	}
	
};


