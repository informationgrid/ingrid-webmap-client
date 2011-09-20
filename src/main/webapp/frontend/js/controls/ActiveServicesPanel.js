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
        disabled: false,
        handler: function(btn) {
        	new de.ingrid.mapclient.frontend.controls.NewServiceDialog({
        		activeServicesPanel: self
        	}).show();
        }
	});
	this.removeBtn = new Ext.Button({
        iconCls: 'iconRemove',
        disabled: true,
        handler: function(btn) {
        	if (self.activeNode) {
            	self.removeService(self.activeNode.attributes.service);
        	}
        }
	});
	this.transparencyBtn = new Ext.Button({
        iconCls: 'iconTransparency',
        disabled: true,
        handler: function(btn) {
        	if (self.activeNode) {
            	self.displayOpacitySlider(self.activeNode.layer);
        	}
        }
	});
	this.metaDataBtn = new Ext.Button({
        iconCls: 'iconMetadata',
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
			}
			else {
				self.transparencyBtn.disable();
				self.removeBtn.enable();
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
