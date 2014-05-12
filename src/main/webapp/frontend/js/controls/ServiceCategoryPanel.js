/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class ServiceCategoryPanel shows available services of a given category.
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel = Ext.extend(Ext.Panel, {
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

	disabledButtons: [],
	metadataWindowsCount: 0,
	metadataWindowStartX: 0,
	metadataWindowStartY: 0,
	tree: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.initComponent = function() {
	var self = this;
	
	this.on("expand", function(){
		var childNodesCategories = self.tree.root.childNodes;
		for(var h=0; h<childNodesCategories.length; h++){
			var childNodesCategory = childNodesCategories[h];
			var childNodes = childNodesCategory.childNodes;
	        self.reloadTreeUI(childNodes);
		}
	});
	
	// transform service category object into tree node structure
	var node = this.transform(this.mapServiceCategory);

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
	
	self.tree = new Ext.tree.TreePanel({
		rootVisible: false,
		root: new Ext.tree.AsyncTreeNode({
			text: node.text,
	        children: node.children,
	        expanded: false
		}),
		plugins:[hoverActions],
		buttonSpanElStyle:'width:8px;',
	    onlyServices: true,
		useArrows:true,
	    lines: false,
	    frame : false,
	    cls: 'x-tree-noicon',
	    layout: 'fit',
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
	        					if(node.attributes.cls.indexOf("x-tree-node-disabled") == -1){
	        						var service = node.attributes.service;
	        						node.setCls("x-tree-node-disabled");
		        	        		self.activateService(service);
		        	           		self.activeServicesPanel.expand();
	        					}
	        				}
	        			}
	        		}
	        	}
	        }
	    }
	});
	
	
	
	Ext.apply(this, {
		title: i18n(node.text),
		layout: 'fit',
		bodyCssClass: 'background smaller-leaf-padding',
		items:[self.tree],
		autoScroll: false
    });

	this.activeServicesPanel.serviceCategoryPanel = self;
	de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.superclass.initComponent.call(this);
};

/**
 * Transform the given service category into a tree node object. Children are supposed to
 * be either service objects or other service categories.
 * @param serviceCategory Object with properties name, serviceCategories, services
 * @return Object to be passed to Ext.tree.TreeLoader
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.transform = function(serviceCategory) {
	var self = this;
	var children = [];
	var wmsServices = de.ingrid.mapclient.Configuration.getValue("wmsServices");
	// transform sub categories
	var subCategories = serviceCategory.mapServiceCategories;

		
	if(subCategories){
		function sortFunc(a,b){
			name1 = a.name.toLowerCase();
			name2 = b.name.toLowerCase();
			if(name1 == name2)
					return 0;
			return (name1 < name2) ? -1 : 1;
		}
		//TODO not very performant ?!?
		for (var i=0, count=subCategories.length; i<count; i++) {
			var catId = subCategories[i].idx;
			subCategories[i].services = [];
			for(var j = 0; j < wmsServices.length; j++){
				for(var k = 0;k < wmsServices[j].mapServiceCategories.length; k++){
					if(catId == wmsServices[j].mapServiceCategories[k].idx){
						var tempService = new Object();
						tempService.name = wmsServices[j].name;
						tempService.capabilitiesUrl = wmsServices[j].capabilitiesUrl;
						subCategories[i].services.push(tempService);
					}
				}
				subCategories[i].services.sort(sortFunc);
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
		expandable: true,
		listeners: {
		    expand: function(node, event){
		        var childNodes = node.childNodes;
		        self.reloadTreeUI(childNodes);
		    }
		}
	};
	return node;
};

de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.reloadTreeUI = function (childNodes){
	for(var i=0; i<childNodes.length; i++){
		var childNode = childNodes[i];
		childNode.getUI().removeClass("x-tree-node-disabled");
		childNode.setCls("x-tree-node-add");
		var activeServices = Ext.getCmp("activeServices").layerTree.root.childNodes;
	    for(var j=0; j<activeServices.length; j++){
			var activeService = activeServices[j];
			if(activeService.attributes.service && childNode.attributes.service){
				var activeServiceCap = activeService.attributes.service.capabilitiesUrl;
        		var searchServiceCap = childNode.attributes.service.capabilitiesUrl;
        		if(activeServiceCap && searchServiceCap){
        			activeServiceCap = activeServiceCap.replace("http://", "").replace("https://", "");
        			searchServiceCap = searchServiceCap.replace("http://", "").replace("https://", "");
        			if(activeServiceCap.split("?")[0] == searchServiceCap.split("?")[0]){
        				childNode.setCls("x-tree-node-disabled");
        				break;
        			}
				}
			}
		}
	}
};

/**
 * Activate the given service. The method does this by calling the addService method on the activeServicesPanel
 * after loading the service data.
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.activateService = function(service) {
	var callback = Ext.util.Functions.createDelegate(this.activeServicesPanel.addService, this.activeServicesPanel);
	var showFlash = true;
	de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback, showFlash, de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpandAddNode"), de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeZoomToExtend"));
};

/**
 * Open a window with meta info of a map layer
 * @param node Ext.tree.TreeNode instance
 */
de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel.prototype.displayMetaData = function(node) {
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
