/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultActiveServicesPanel is used to select a default WMS server
 * and the default map layers provided by it.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel', { 
	extend: 'Ext.panel.Panel', 
	id: 'defaultActiveServicesPanel',
	title: 'Definition \'Aktive Dienste\'',
	layout: 'column',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,
	bodyPadding: 10,
	
	treeService: null,
	services: null,
	storeService: null,
	treeActiveService: null,
	activeServices: null,
	storeActiveService: null,
	
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
		self.storeService = Ext.create('Ext.data.TreeStore', {
	    	model: 'DetailLayer',
            root: {
                text: 'Dienste',
                id: 'rootService',
                expanded: true,
                children: [],
                leaf: false
            }
	    });
		
		self.treeService = Ext.create('Ext.tree.Panel', {
			id:'treeService',
            animate:true,
            draggable:false,
            store: self.storeService,
            autoScroll:true,
            viewConfig: {
                plugins: {
                    ptype: 'treeviewdragdrop',
                    ddGroup: 'defaultActiveServicesPanel-ddgroup',
                    appendOnly: false,
                    sortOnDrop: false,
                    containerScroll: false,
                    nodeHighlightOnDrop: false
                }
            },
            rowLines: false,
            lines: true,
            containerScroll: false,
            border: false,
            height: 600
            
        });
        
       self.storeActiveService = Ext.create('Ext.data.TreeStore', {
	    	model: 'DetailLayer',
            root: {
                text: 'Aktive Dienste', 
                id: 'rootActiveService',
                expanded: true,
                children: [],
                leaf: false
            }
	    });
       
        self.treeActiveService = Ext.create('Ext.tree.Panel', {
        	id:'treeActiveService',
            draggable:false,
            store: self.storeActiveService,
            animate:true,
            layout:'fit',
            autoScroll:true,
            lines: true,
            containerScroll: false,
            border: false,
            viewConfig: {
                plugins: {
                    ptype: 'treeviewdragdrop',
                    ddGroup: 'defaultActiveServicesPanel-ddgroup',
                    appendOnly: false,
                    sortOnDrop: false,
                    containerScroll: false,
                    nodeHighlightOnDrop: false
                }
            },
            height: 600
        });
        
		Ext.apply(this, {
			items: [{
                columnWidth:.1,
                border: false,
                items:[{
    				xtype: 'button',
    				id: 'btnSaveDefaultActiveServicesPanel',
					text: 'Speichern',
    				handler: function() {
    					self.save();
    				},
    				width: 75
    		      },{
    				    // spacer
    					xtype: 'container',
    					height: 10
    			    },		      
    			      {
    			    	xtype: 'button',
    			    	id: 'btnReloadDefaultActiveServicesPanel',
    					text: 'Neuladen',
    					handler: function() {
    						self.createServiceTree();
    						self.treeService.doLayout();
    					},
        				width: 75
    			      }]
			},{
                columnWidth:.45,
                border: false,
                items:[self.treeActiveService]
			},{
                columnWidth:.45,
                border: false,
                items:[self.treeService]
			}],
			bbar:[
			]
		});
		de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		var self = this;
		self.createActiveServiceTree();
	    self.createServiceTree();
       
        de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel.superclass.onRender.apply(this, arguments);
	},
	createServiceTree: function(){
		var self = this;
		
		self.services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
		var node = this.transform(false);
		
		self.treeService.getRootNode().appendChild(node);
		
        self.treeService.on('afterrender', function(tree){
        	var moveServices = [];
        	var usedServices = de.ingrid.mapclient.Configuration.getValue('wmsActiveServices');
        	if(usedServices){
        		for (var j = 0; j < usedServices.length; j++) {
    				var usedService = usedServices[j];
    				if(self.services){
    					for (var i=0, count=self.services.length; i<count; i++) {
        					var curService = self.services[i];
        					var isInUsed = false;
        				
        					if(usedService.capabilitiesUrl == curService.capabilitiesUrl){
        						moveServices.push(usedService);
        					}
        				}    					
    				}
    			}
            	if(moveServices.length > 0){
            		for (var j = 0; j < moveServices.length; j++) {
            			var moveService = moveServices[j];
    	        		for (var i = 0; i < tree.getStore().getRootNode().childNodes.length; i++) {
    	            		var childNode = tree.getStore().getRootNode().childNodes[i];
    	            		if(childNode.raw){
    	            			var curService = childNode.raw.service;
                    			if(moveService.capabilitiesUrl == curService.capabilitiesUrl){
                    				self.treeActiveService.getStore().getRootNode().appendChild(childNode);
                    				self.checkedChildNodes(childNode, moveService.checkedLayers);
                            		break;
                    			}
                    		}
                		}
                	}
            	}
        	}
        });
	},
	checkedChildNodes: function(node, layers){
		var self = this;
		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			for (var j = 0; j < node.childNodes.length; j++) {
				var childNode = node.childNodes[j];
				if(layer == childNode.raw.name){
					childNode.set("checked", true);
				}
				if(childNode.childNodes.length > 0){
					self.checkedChildNodes(childNode, layers);
				}
			}
		}
	},
	createActiveServiceTree: function(){
		var self = this;
		var node2 = this.transform(true);
        
        // add the root node
        self.storeActiveService.on('move', function(node, oldParent, newParent, index, eOpts){
        	var service = node.raw.service;
        	if(service){
        		if(node.childNodes.length == 0){
        			node.set('leaf', false);
        			node.set('allowDrop', false);
        			
                	var url = service.capabilitiesUrl;
                	var xmlDoc = self.loadDoc(url);
                	var layers = xmlDoc.getElementsByTagName("Layer");
                	if(layers.length > 0){
                		self.createChildNodes(node, layers[0], true);
                	}
                	node.on("move", function(thisNode, oldParent, newParent, index, nextNode) {
                		if(newParent.data.id == "rootService"){
                			thisNode.removeAll();
                		}
                	});
            	}
        	}
        });
	},
	save: function() {
		var activeServices = [];
		this.getActiveServices(activeServices, this.storeActiveService.getRootNode().childNodes);
		de.ingrid.mapclient.Configuration.setValue('activeServices', Ext.encode(activeServices), de.ingrid.mapclient.admin.DefaultSaveHandler);
	},
	getActiveServices: function(services, nodes){
		var service = [];
		for (var i=0, count=nodes.length; i<count; i++) {
			var node = nodes[i];
			var serviceUrl; 
			var serviceLayers = [];
			if(node.raw.service){
				serviceUrl = node.raw.service.capabilitiesUrl;
			}
			
			this.getActiveServiceLayers(serviceLayers, node.childNodes);
			
			services.push({serviceUrl: serviceUrl, serviceLayers:serviceLayers });
		}
	},
	getActiveServiceLayers: function(serviceLayers, nodes){
		for (var i=0, count=nodes.length; i<count; i++) {
			var node = nodes[i];
			if(node.data.checked){
				serviceLayers.push(node.raw.name);
			}
			this.getActiveServiceLayers(serviceLayers, node.childNodes);
		}
	},
	transform: function(loadChilds) {
		var children = [];
		if(!loadChilds){
			if(this.services){
				for (var i=0, count=this.services.length; i<count; i++) {
					var curService = this.services[i];
					var isInUsed = false;
					var childNode = {
						text: curService.name,
						service: curService,
						leaf: true,
						iconCls: 'iconNone',
						
					};
					children.push(childNode);
				}
			}
		}
		return children;
	},
	loadDoc: function(url) {
	    var xmlhttp = null;
	    if (window.XMLHttpRequest) {
	        xmlhttp = new XMLHttpRequest();
	    } else {
	        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	    }
	    xmlhttp.open("GET", url, false);
	    xmlhttp.send();
	    return xmlhttp.responseXML;
	},
	createChildNodes: function (node, layer, createFirstNode) {
		var self = this;
		var firstNode; 
		if(createFirstNode){
			if(layer.nodeName){
				var tagName = layer.nodeName;
				if(tagName == "Layer"){
					var name = "";
		    		var title = "";
		    		
		    		for (var j = 0; j < layer.children.length; j++) {
		    			var tmpchildren = layer.children[j];
		    			if(tmpchildren.tagName == "Title"){
		    				if(tmpchildren.textContent){
		    					title = tmpchildren.textContent;
		    				}else{
		    					title = tmpchildren.text;
		    				}
		    				
		    			}else if(tmpchildren.tagName == "Name"){
		    				if(tmpchildren.textContent){
		    					name = tmpchildren.textContent;
		    				}else{
		    					name = tmpchildren.text;
		    				}
		    			}
		    		}
					
		    		var children = [];
		    		self.getChildren(children, layer);
		    		
					firstNode = {
						name: name,
						text: title,
						leaf: self.hasChildNodes(layer) ? false : true,
						iconCls: 'iconNone',
						checked: false,
						expanded: true,
						allowDrop:false,
						allowDrag:false,
						allowChildren:false,
						children: children
					};
					node.appendChild(firstNode);
					node.expand();
				}
			}
		}
	},
	getChildren: function(children, layer){
		var self = this;
		var childrenLayer = layer.children;
		for (var i=0, count=childrenLayer.length; i<count; i++) {
			var child = childrenLayer[i];
			if(child.nodeName){
				var tagName = child.nodeName;
				if(tagName == "Layer"){
					var name = "";
		    		var title = "";
		    		
		    		for (var j = 0; j < child.children.length; j++) {
		    			var tmpchildren = child.children[j];
		    			if(tmpchildren.tagName == "Title"){
		    				if(tmpchildren.textContent){
		    					title = tmpchildren.textContent;
		    				}else{
		    					title = tmpchildren.text;
		    				}
		    				
		    			}else if(tmpchildren.tagName == "Name"){
		    				if(tmpchildren.textContent){
		    					name = tmpchildren.textContent;
		    				}else{
		    					name = tmpchildren.text;
		    				}
		    			}
		    		}
					var childChildren = [];
		    		self.getChildren(childChildren, child);
		    		
		    		children.push({
						name: name,
						text: title,
						leaf: self.hasChildNodes(child) ? false : true,
						iconCls: 'iconNone',
						checked: false,
						expanded: true,
						allowDrop:false,
						allowDrag:false,
						allowChildren:false,
						children: []
					});
				}
			}
		}
	},
	hasChildNodes: function (child){
		var children = child.children;
		for (var i=0, count=children.length; i<count; i++) {
			var child = children[i];
			if(child.nodeName){
				var tagName = child.nodeName;
				if(tagName == "Layer"){
					return true; 
				}
			}
		}
		return false;
	}
});