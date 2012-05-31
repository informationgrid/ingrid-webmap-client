/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class ServiceCategoryPanel shows available services of a given category.
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel = Ext.extend(Ext.tree.TreePanel, {
    autoScroll: true,

    /**
     * @cfg serviceCategory Object with service category definition as provided by the configuration
     */
    mapServiceCategory: {},

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
	expandBtn: null,
	allExpanded: false
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.initComponent = function() {

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
	this.expandBtn = new Ext.Button({
		iconCls: 'iconExpand',
		tooltip: 'Alle auf/zuklappen',
		disabled: false,
		handler: function(btn) {
			if (self.allExpanded) {
				self.collapseAll();
				self.allExpanded = false;
			}else{
				self.expandAll();
				self.allExpanded = true;
			}
		}
	});
	// transform service category object into tree node structure
	var node = this.transform(this.mapServiceCategory);

	Ext.apply(this, {
		title: node.text,
        rootVisible: false,
		root: new Ext.tree.AsyncTreeNode({
			text: node.text,
	        children: node.children,
	        expanded: false
		}),
		tbar: items = [
   		    this.addBtn,
   		    this.metaDataBtn,
   		    this.expandBtn
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

	de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.superclass.initComponent.call(this);
};

/**
 * Transform the given service category into a tree node object. Children are supposed to
 * be either service objects or other service categories.
 * @param serviceCategory Object with properties name, serviceCategories, services
 * @return Object to be passed to Ext.tree.TreeLoader
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.transform = function(serviceCategory) {
	var children = [];
	var wmsServices = de.ingrid.mapclient.Configuration.getValue("wmsServices");
	// transform sub categories
	var subCategories = serviceCategory.mapServiceCategories;

		
	if(subCategories){
	
	//TODO not very performant ?!?
	for (var i=0, count=subCategories.length; i<count; i++) {
		var catId = subCategories[i].id;
		subCategories[i].services = [];
		for(var j = 0; j < wmsServices.length; j++){
			for(var k = 0;k < wmsServices[j].mapServiceCategories.length; k++)
			if(catId == wmsServices[j].mapServiceCategories[k].id){
			var tempService = new Object();
			tempService.name = wmsServices[j].name;
			tempService.capabilitiesUrl = wmsServices[j].capabilitiesUrl;
			subCategories[i].services.push(tempService);
			
			}
		}
		
		if(subCategories[i].services.length != 0){
		var childNode = this.transform(subCategories[i]);
		children.push(childNode);
		}
	}
	}

	// transform services
	var services = serviceCategory.services;
	if(services)
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
		text: serviceCategory.name,
		children: children,
		leaf: children.length == 0 ? true : false,
		expanded: false,
		expandable: true
	};
	return node;
};

/**
 * Activate the given service. The method does this by calling the addService method on the activeServicesPanel
 * after loading the service data.
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.activateService = function(service) {
	var callback = Ext.util.Functions.createDelegate(this.activeServicesPanel.addService, this.activeServicesPanel);
	var showFlash = true;
	de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback, showFlash);
};

/**
 * Open a window with meta info of a map layer
 * @param node Ext.tree.TreeNode instance
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.displayMetaData = function(node) {
	var service = node.attributes.service;
	if (service) {
		new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
			capabilitiesUrl: service.getCapabilitiesUrl(),
			layerName: node.layer
		}).show();
	}
};
