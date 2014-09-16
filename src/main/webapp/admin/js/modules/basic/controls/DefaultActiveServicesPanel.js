/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultActiveServicesPanel is used to select a default WMS server
 * and the default map layers provided by it.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel', { 
	extend: 'Ext.form.Panel', 
	id: 'defaultActiveServicesPanel',
	title: 'Definition \'Aktive Dienste\'',
	layout: {
	    type: 'hbox',
	    pack: 'start',
	    align: 'stretch'
	},
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
            rowLines: false,
            lines: true,
            border: false,
            viewConfig: {
                plugins: {
                    ptype: 'treeviewdragdrop',
                    ddGroup: 'defaultActiveServicesPanel-ddgroup',
                    appendOnly: false,
                    sortOnDrop: false,
                    nodeHighlightOnDrop: false
                }
            }
            
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
            lines: true,
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
            }
        });
        
        var sliderService = Ext.create('Ext.slider.Single', {
            fieldLabel: 'Default',
            minValue: 0,
            maxValue: 100,
            id: 'slider_service',
            plugins: new Ext.slider.Tip({
                getText: function(thumb){
                return String(thumb.value) + '%';
                }
            }),
            hidden:false,
            listeners:{
            	change: function(slider, value, obj){
            		var node = self.treeActiveService.getSelectionModel().getSelection()[0];
            		if(node){
        				if(node.raw.opacity == undefined){
        					var sliderLayer = Ext.getCmp("slider_layer");
    	        			sliderLayer.setValue(value, false);
            			}
            		}
            		slider.labelEl.update('Default: ' + value + '%');
            	},
            	afterrender: function(slider){
            		slider.setValue(parseInt(de.ingrid.mapclient.Configuration.getValue('activeServicesDefaultOpacity')), false);
            	}
            }
        });
        
        var sliderLayer = Ext.create('Ext.slider.Single', {
            fieldLabel: 'Layer',
            minValue: 0,
            maxValue: 100,
            id: 'slider_layer',
            plugins: new Ext.slider.Tip({
                getText: function(thumb){
                	return String(thumb.value) + '%';
                }
            }),
            hidden:true,
            listeners:{
            	change: function(slider, value, obj){
            		var node = self.treeActiveService.getSelectionModel().getSelection()[0];
            		if(node){
            			if(obj.dragging){
            				node.raw.opacity = value;
            			}
            			if(node.raw.opacity){
            				slider.labelEl.update('Layer: ' + value + '%');
            			}else{
            				slider.labelEl.update('Layer: default');
            			}
            			slider.setValue(value, false);
            			
            		}
            	}
            }
        });
        
        var form = Ext.create('Ext.form.Panel', {
        	id:'defaultActiveServicesPanelFormVisibility',
            title: 'Sichtbarkeit',
            border: true,
            bodyStyle: 'padding: 5px;',
            fieldDefaults: {
            	labelAlign: 'top',
                anchor: '95%'
            },
            items: [sliderService,sliderLayer]
        });
            
		Ext.apply(this, {
			items: [{
                flex:.25,
                border: false,
                items:[form]
			},{
				flex:1,
                border: false,
                autoScroll: true,
                items:[self.treeActiveService]
			},{
				flex:1,
                border: false,
                autoScroll: true,
                items:[self.treeService]
			}],
			buttons:[{
		    	xtype: 'button',
		    	id: 'btnReloadDefaultActiveServicesPanel',
				text: 'Neuladen',
				handler: function() {
					var sliderLayer = Ext.getCmp("slider_layer");
        			sliderLayer.hide();

        			self.createActiveServiceTree();
					self.createServiceTree();
					self.treeService.fireEvent("afterrender");
				}
		      },{
				xtype: 'button',
				id: 'btnSaveDefaultActiveServicesPanel',
				text: 'Einstellungen speichern',
				handler: function() {
					self.save();
				}
		      }
			]
		});
		de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		var self = this;
		
		var sliderService = Ext.getCmp("slider_service");
		self.createActiveServiceTree();
	    self.createServiceTree();
       
        de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel.superclass.onRender.apply(this, arguments);
	},
	createServiceTree: function(){
		var self = this;
		
		self.services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
		var node = this.transform(false);
		
		self.treeService.getRootNode().removeAll();
		self.treeService.getRootNode().appendChild(node);
		
        self.treeService.on('afterrender', function(){
        	var moveServices = [];
        	if(self.usedServices == undefined){
        		self.usedServices = de.ingrid.mapclient.Configuration.getValue('wmsActiveServices');
        	}
        	if(self.usedServices){
        		for (var j = 0; j < self.usedServices.length; j++) {
    				var usedService = self.usedServices[j];
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
    	        		for (var i = 0; i < this.getStore().getRootNode().childNodes.length; i++) {
    	            		var childNode = this.getStore().getRootNode().childNodes[i];
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
			var layerConfig = layers[i];
			for (var j = 0; j < node.childNodes.length; j++) {
				var childNode = node.childNodes[j];

				if(layerConfig.layer == childNode.raw.name){
					childNode.set("checked", true);
					if(layerConfig.opacity != ""){
						childNode.raw.opacity = layerConfig.opacity;
					}
				}
				if(childNode.childNodes.length > 0){
					self.checkedChildNodes(childNode, layers);
				}
			}
		}
	},
	createActiveServiceTree: function(){
		var self = this;
        
		self.treeActiveService.getRootNode().removeAll();
		
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
        
        self.treeActiveService.getSelectionModel().on({
        	selectionchange: function (tree, node){
        		var sliderLayer = Ext.getCmp("slider_layer");
        		var tmpNode = node[0];
        		if(tmpNode){
        			if(tmpNode.data.checked != undefined){
            			sliderLayer.show();
            			if(tmpNode.raw.opacity){
            				sliderLayer.setValue(tmpNode.raw.opacity, false);
            			}else{
            				sliderLayer.setValue(Ext.getCmp("slider_service").getValue(), false);
            			}
            		}else{
            			sliderLayer.hide();
            		}
        		}else{
        			sliderLayer.hide();
        		}
        	}
        });
	},
	save: function() {
		var activeServices = [];
		this.getActiveServices(activeServices, this.storeActiveService.getRootNode().childNodes);
		
		de.ingrid.mapclient.Configuration.setValue('activeServices', Ext.encode({activeServicesDefaultOpacity: Ext.getCmp("slider_service").getValue(),activeServices: activeServices}), de.ingrid.mapclient.admin.DefaultSaveHandler);
	},
	getActiveServices: function(services, nodes){
		var service = [];
		this.usedServices = [];
		for (var i=0, count=nodes.length; i<count; i++) {
			var node = nodes[i];
			var serviceUrl; 
			var serviceLayers = [];
			if(node.raw.service){
				serviceUrl = node.raw.service.capabilitiesUrl;
			}
			
			this.getActiveServiceLayers(serviceLayers, node.childNodes);
			
			services.push({serviceUrl: serviceUrl, serviceLayers:serviceLayers });
			this.usedServices.push({capabilitiesUrl: serviceUrl, checkedLayers:serviceLayers });
		}
	},
	getActiveServiceLayers: function(serviceLayers, nodes){
		for (var i=0, count=nodes.length; i<count; i++) {
			var node = nodes[i];
			if(node.data.checked != undefined){
				serviceLayers.push({layer: node.raw.name, opacity: node.raw.opacity, checked: node.raw.checked});
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
						children: childChildren
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