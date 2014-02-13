/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class SearchCategoryPanel shows available services of a given category.
 */
de.ingrid.mapclient.frontend.controls.SearchCategoryPanel = Ext.extend(Ext.Panel, {
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
	metadataWindowsCount: 0,
	metadataWindowStartX: 0,
	metadataWindowStartY: 0
	
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SearchCategoryPanel.prototype.initComponent = function() {

	var self = this;

	this.activeServicesPanel = Ext.getCmp("activeServices");

	// transform service category object into tree node structure
	var node = this.transform(this.serviceCategory);

	var hoverActions = new Ext.ux.HoverActions({
		actions: [ 
		new Ext.Button({
	        iconCls: 'iconMetadata',
	        tooltip: i18n('tFuerMetadatenErst'),
	        disabled: true,
	        handler: function(node) {
					self.displayMetaData(node);
	        }
		})]
	});
	
	var tree = new Ext.tree.TreePanel({
		title: i18n('tSuchergebnisse'),
        rootVisible: false,
		root: new Ext.tree.AsyncTreeNode({
			text: node.text,
	        children: node.children,
	        expanded: true
		}),
		plugins:[hoverActions],
		buttonSpanElStyle:'width:8px;',
		bodyCssClass: 'smaller-leaf-padding',
	    onlyServices: true,
		useArrows:true,
	    lines: false,
	    frame : false,
	    cls: 'x-tree-noicon',
		autoScroll: true,
		listeners: {
	        click: function(node,e) {
	        	if(node.hasChildNodes()){
	        		if(node.isExpanded()){
	        			node.collapse();
	        		}else{
	        			node.expand();
	        		}
	        	}else{
	        		if(node){
	        			if(node.attributes){
	        				if(node.attributes.service){
	        					var service = node.attributes.service;
	        	        		self.activateService(service);
	        	           		self.activeServicesPanel.expand();
	        				}
	        			}
	        		}
	        	}
	        }
	    }
	});
	
	Ext.apply(this, {
		items:[tree]
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


	for (var i=0, count=services.length; i<count; i++) {
		var curService = services[i];
		var url = services[i].capabilitiesUrl;
		if(url.indexOf("?") == -1){
			url = url+"?SERVICE=WMS&REQUEST=GetCapabilities";
		}else if(url.toLowerCase().indexOf("service=wms") == -1)
		 	url = url + "SERVICE=WMS&REQUEST=GetCapabilities";
		var serviceInstance = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(url);
		var childNode = {
			text: curService.name,
			service: serviceInstance,
			leaf: true,
			cls: 'x-tree-noicon x-tree-node-add'
		};
		children.push(childNode);
	}

	// transform serviceCategory
	var node = {
		text: '',
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
	var showFlash = true;
	de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback, showFlash, de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpandAddNode"), de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeZoomToExtend"));
};

/**
 * Open a window with meta info of a map layer
 * @param node Ext.tree.TreeNode instance
 */
de.ingrid.mapclient.frontend.controls.SearchCategoryPanel.prototype.displayMetaData = function(node) {
	var self = this;
	var service = node.attributes.service;
	if (service) {
		var window = Ext.getCmp(node.id + "-metadata");
		if(window){
			window.close();
		}else{
			if(self.metadataWindowStartX == 0){
				self.metadataWindowStartX = Ext.getCmp("centerPanel").x;
			}
			if(self.metadataWindowsCount % 10 == 0){
				self.metadataWindowStartX = Ext.getCmp("centerPanel").x + 50;
			}else{
				self.metadataWindowStartX = self.metadataWindowStartX + 50;
			}
			self.metadataWindowsCount = self.metadataWindowsCount + 1;
			var metadataWindow = new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
				id: node.id + "-metadata",
				capabilitiesUrl: service.getCapabilitiesUrl(),
				layerName: node.layer,
				x: self.metadataWindowStartX,
				y: Ext.getCmp("centerPanel").y + self.metadataWindowStartY
			});
			metadataWindow.show();
		}
	}
};
