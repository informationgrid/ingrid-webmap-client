/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class ServiceCategoryPanel shows available services of a given category.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel', {
	extend: 'Ext.Panel',
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
	tree: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
		this.on("expand", function(){
			var childNodesCategories = self.tree.store.tree.root.childNodes;
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
			Ext.create('Ext.Button', {
		        iconCls: 'iconMetadata',
		        tooltip: i18n('tFuerMetadatenErst'),
		        disabled: true,
		        handler: function(node) {
						self.displayMetaData(node);
		        }
			})]
		});

		self.tree = Ext.create('Ext.tree.Panel', {
			viewType: 'gx_custom_treeview',
			rootVisible: false,
			root: {
				text: node.text,
		        children: node.children,
		        expanded: false
			},
			plugins:[hoverActions],
			buttonSpanElStyle: 'width:25px;',
			allowNodeOver: true,
			onlyServices: true,
			useArrows:true,
		    lines: false,
		    frame : false,
		    cls: 'x-tree-noicon',
		    layout: 'fit',
		    autoScroll: true,
		    listeners: {
		        itemclick: function( view, record, item, index, e, eOpts) {
		        	var service = record.raw.service;
		        	if(service){
		        		var activeServices = Ext.getCmp("activeServices").layerTree.store.tree.root.childNodes;
			        	var exist = false;
				        for(var j=0; j<activeServices.length; j++){
				    		var activeService = activeServices[j];
				    		if(activeService.raw.service && service){
				    			var activeServiceCap = activeService.raw.service.capabilitiesUrl;
				        		var searchServiceCap = service.capabilitiesUrl;
				        		if(activeServiceCap && searchServiceCap){
				        			activeServiceCap = activeServiceCap.replace("http://","").replace("https://","").toLowerCase().replace("version=", "").replace("service=wms", "").replace("request=getcapabilities", "");
				        			searchServiceCap = searchServiceCap.replace("http://","").replace("https://","").toLowerCase().replace("version=", "").replace("service=wms", "").replace("request=getcapabilities", "");
									
				        			if(activeServiceCap == searchServiceCap){
				        				exist = true;
				            			break;
				            		}
				        		}
				    		}
				    	}
				        if(!exist){
				        	self.activateService(service);
			           		self.activeServicesPanel.expand();
				        }
		        	}
		        }
		    }
		});
		
		self.tree.store.on({
			expand: function(node) {
				node.set("cls", "x-tree-node-service x-tree-expand");
				var childNodes = node.childNodes;
		        self.reloadTreeUI(childNodes);
			},
			collapse: function(node){
				node.set("cls", "x-tree-node-service");
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
		this.superclass.initComponent.call(this);
	},
	/**
	 * Transform the given service category into a tree node object. Children are supposed to
	 * be either service objects or other service categories.
	 * @param serviceCategory Object with properties name, serviceCategories, services
	 * @return Object to be passed to Ext.tree.TreeLoader
	 */
	transform: function(serviceCategory) {
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
				cls: 'x-tree-node-add'
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
			cls: 'x-tree-node-service'
		};
		return node;
	},
	reloadTreeUI: function (childNodes){
		for(var i=0; i<childNodes.length; i++){
			var childNode = childNodes[i];
			childNode.set("cls", "");
			var activeServices = Ext.getCmp("activeServices").layerTree.store.tree.root.childNodes;
		    for(var j=0; j<activeServices.length; j++){
				var activeService = activeServices[j];
				if(activeService.raw.service && childNode.raw.service){
					var activeServiceCap = activeService.raw.service.capabilitiesUrl;
	        		var searchServiceCap = childNode.raw.service.capabilitiesUrl;
	        		if(activeServiceCap && searchServiceCap){
	        			activeServiceCap = activeServiceCap.replace("http://","").replace("https://","").toLowerCase().replace("version=", "").replace("service=wms", "").replace("request=getcapabilities", "");
	        			searchServiceCap = searchServiceCap.replace("http://","").replace("https://","").toLowerCase().replace("version=", "").replace("service=wms", "").replace("request=getcapabilities", "");
						if(activeServiceCap == searchServiceCap){
	        				childNode.set("cls", "x-tree-node-disabled");
	        				break;
	        			}
					}
				}
			}
		}
	},
	/**
	 * Activate the given service. The method does this by calling the addService method on the activeServicesPanel
	 * after loading the service data.
	 * @param service de.ingrid.mapclient.frontend.data.Service instance
	 */
	activateService: function(service) {
		var callback = Ext.Function.bind(this.activeServicesPanel.addService, this.activeServicesPanel);
		var showFlash = true;
		de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback, showFlash, de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpandAddNode"), de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeZoomToExtend"));
	},
	/**
	 * Open a window with meta info of a map layer
	 * @param node Ext.tree.TreeNode instance
	 */
	displayMetaData: function(node) {
		var self = this;
		var service = node.raw.service;
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
				var metadataWindow = Ext.create('de.ingrid.mapclient.frontend.controls.MetaDataDialog', {
					id: node.id + "-metadata",
					capabilitiesUrl: service.getCapabilitiesUrl(),
					layerName: node.layer,
					x: self.metadataWindowStartX,
					y: Ext.getCmp("centerPanel").y + self.metadataWindowStartY
				});
				metadataWindow.show();
			}
		}
	}
});
