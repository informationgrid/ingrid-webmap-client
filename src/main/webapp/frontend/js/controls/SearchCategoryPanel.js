/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class SearchCategoryPanel shows available services of a given category.
 */
de.ingrid.mapclient.frontend.controls.SearchCategoryPanel = Ext.extend(Ext.tree.TreePanel, {
    autoScroll: true,

    /**
     * @cfg serviceCategory Object with service category definition as provided by the configuration
     */
    serviceCategory: {},

    /**
     * @cfg activeServicesPanel de.ingrid.mapclient.frontend.controls.ActiveServicesPanel instance
     */
    activeServicesPanel: null,

    /**
     * The currently selected node
     */
    activeNode: null,

	/**
	 * Toolbar buttons
	 */
	addBtn: null,
	metaDataBtn: null,
	searchDataBtn: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SearchCategoryPanel.prototype.initComponent = function() {

	var self = this;

	// create the toolbar buttons
	this.addBtn = new Ext.Button({
        iconCls: 'iconAdd',
        tooltip: 'Dienst hinzuf&uuml;gen',
        disabled: true,
        handler: function(btn) {
        	if (self.activeServicesPanel && self.activeNode) {
        		var service = self.activeNode.attributes.service;
        		self.activateService(service);
        		btn.disable();
        		// activate activeServicesPanel
           		self.activeServicesPanel.expand();
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
	this.searchDataBtn = new Ext.Button({
        iconCls: 'iconRemoveAll',
        tooltip: 'Suchergebnisse l&ouml;schen',
        disabled: false,
        handler: function(btn) {
			self.destroy();
        }
	});
	// transform service category object into tree node structure
	var node = this.transform(this.serviceCategory);

	Ext.apply(this, {
		title: 'Suchergebnisse',
        rootVisible: false,
		root: new Ext.tree.AsyncTreeNode({
			text: node.text,
	        children: node.children,
	        expanded: true
		}),
		tbar: items = [
   		    this.addBtn,
   		    this.metaDataBtn,
   		    this.searchDataBtn
   		]
	});

	this.getSelectionModel().on('selectionchange', function(selModel, node) {
		// default
		self.addBtn.disable();
		self.metaDataBtn.disable();

		if (node) {
			var service = node.attributes.service;
			if (service != undefined) {
				// a service node is selected
				if (!self.activeServicesPanel.containsService(service)) {
					self.addBtn.enable();
				}
				else {
					self.addBtn.disable();
				}
				self.metaDataBtn.enable();
			}
		}
		self.activeNode = node;
	});

	de.ingrid.mapclient.frontend.controls.SearchCategoryPanel.superclass.initComponent.call(this);
};

/**
 * Transform the given service category into a tree node object. Children are supposed to
 * be either service objects or other service categories.
 * @param serviceCategory Object with properties name, serviceCategories, services
 * @return Object to be passed to Ext.tree.TreeLoader
 */
de.ingrid.mapclient.frontend.controls.SearchCategoryPanel.prototype.transform = function(services) {
	var children = [];

	// transform sub categories
//	var subCategories = serviceCategory.serviceCategories;
//	for (var i=0, count=subCategories.length; i<count; i++) {
//		var childNode = this.transform(subCategories[i]);
//		children.push(childNode);
//	}

	// transform services
//	var services = serviceCategory.services;
	for (var i=0, count=services.length; i<count; i++) {
		var curService = services[i];
		var serviceInstance = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(curService.capabilitiesUrl);
		var childNode = {
			text: curService.name,
			service: serviceInstance,
			leaf: true,
			cls: 'x-tree-noicon'
		};
		children.push(childNode);
	}

	// transform serviceCategory
	var node = {
		text: 'Hallo',
		children: children,
		leaf: children.length == 0 ? true : false,
		expanded: true,
		expandable: true
	};
	return node;
};

/**
 * Activate the given service. The method does this by calling the addService method on the activeServicesPanel
 * after loading the service data.
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.SearchCategoryPanel.prototype.activateService = function(service) {
	var callback = Ext.util.Functions.createDelegate(this.activeServicesPanel.addService, this.activeServicesPanel);
	de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback);
};

/**
 * Open a window with meta info of a map layer
 * @param node Ext.tree.TreeNode instance
 */
de.ingrid.mapclient.frontend.controls.SearchCategoryPanel.prototype.displayMetaData = function(node) {
	var service = node.attributes.service;
	if (service) {
		new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
			capabilitiesUrl: service.getCapabilitiesUrl(),
			layerName: node.layer
		}).show();
	}
};
