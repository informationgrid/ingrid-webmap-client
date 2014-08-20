/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultActiveServicesPanel is used to select a default WMS server
 * and the default map layers provided by it.
 */
de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel = Ext.extend(Ext.Panel, {

	title: 'Definition \'Aktive Dienste\'',
	layout: 'column',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,
	
	treeService: null,
	services: null,
	treeActiveService: null,
	activeServices: null,
	
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
		self.treeService = new Ext.tree.TreePanel({
			id:'treeService',
            animate:true,
            layout:'fit',
            autoScroll:true,
            enableDD:true,
            lines: false,
            containerScroll: false,
            border: false,
            height: 600
        });
        
       
        self.treeActiveService = new Ext.tree.TreePanel({
        	id:'treeActiveService',
            animate:true,
            layout:'fit',
            autoScroll:true,
            lines: false,
            containerScroll: false,
            border: false,
            enableDD:true,
            height: 600
        });
        
        var sliderService = new Ext.Slider({
            fieldLabel: 'Allgemeine Sichtbarkeit',
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
            		var node = self.treeActiveService.getSelectionModel().getSelectedNode();
            		if(node){
        				if(node.attributes.opacity == undefined){
        					var sliderLayer = Ext.getCmp("slider_layer");
    	        			sliderLayer.setValue(value, false);
            			}
            		}
            	}
            }
        });
        
        var sliderLayer = new Ext.Slider({
            fieldLabel: 'Layer Sichtbarkeit',
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
            		var node = self.treeActiveService.getSelectionModel().getSelectedNode();
            		if(node){
            			if(obj.dragging){
            				node.attributes.opacity = value;
            			}
            			slider.setValue(value, false);
            		}
            	}
            }
        });
        
        var form = new Ext.form.FormPanel({
            width : 150,
            height: 160,
            border: false,
            labelAlign: 'top',
            defaults: {
                anchor: '95%'
            },
            items: [sliderService,sliderLayer]
        });
            
		Ext.apply(this, {
			items: [{
                columnWidth:.1,
                border: false,
                items:[{
    				xtype: 'button',
    				text: 'Speichern',
    				handler: function() {
    					self.save();
    				},
    				width: 75
    		      },{
    				    // spacer
    					xtype: 'container',
    					height: 10
    		      },{
    		    	xtype: 'button',
					text: 'Neuladen',
					handler: function() {
						var sliderLayer = Ext.getCmp("slider_layer");
	        			sliderLayer.hide();

	        			self.createActiveServiceTree();
						self.treeActiveService.doLayout();
						self.createServiceTree();
						self.treeService.doLayout();
					},
    				width: 75
			      },{
  				    // spacer
  					xtype: 'container',
  					height: 10
			      },
			      form]
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
		
		var sliderService = Ext.getCmp("slider_service");
		sliderService.setValue(parseInt(de.ingrid.mapclient.Configuration.getValue('activeServicesDefaultOpacity')), false);
		
		self.createActiveServiceTree();
	    self.createServiceTree();
       
        de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel.superclass.onRender.apply(this, arguments);
	},
	createServiceTree: function(){
		var self = this;
		self.services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
		var node = this.transform(false);
		
		 // set the root node
        var root = new Ext.tree.AsyncTreeNode({
            text: 'Dienste', 
            draggable:false, // disable root node dragging
            expanded: true,
            children: node.children,
            cls: 'folder'
        });
        self.treeService.setRootNode(root);
        
        self.treeService.on({
        	afterlayout: function(tree){
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
	    	        		for (var i = 0; i < tree.root.childNodes.length; i++) {
	    	            		var childNode = tree.root.childNodes[i];
	    	            		if(childNode.attributes){
	    	            			var curService = childNode.attributes.service;
	                    			if(moveService.capabilitiesUrl == curService.capabilitiesUrl){
	                    				self.treeActiveService.root.appendChild(childNode);
	                    				self.checkedChildNodes(childNode, moveService.checkedLayers);
	                            		break;
	                    			}
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
				if(layerConfig.layer == childNode.attributes.name){
					childNode.getUI().toggleCheck(layerConfig.checked);
					if(layerConfig.opacity != ""){
						childNode.attributes.opacity = layerConfig.opacity;
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
		
		var node2 = this.transform(true);
        
        // add the root node
        var root2 = new Ext.tree.AsyncTreeNode({
            text: 'Aktive Dienste', 
            draggable:false,
            expanded: true,
            children: node2.children,
            leaf: false
        });
        self.treeActiveService.setRootNode(root2);
        
        self.treeActiveService.on({
        	movenode: function(tree, node, root){
	        	if(node.childNodes.length == 0){
	        		node.leaf = false;
	            	
	            	var service = node.attributes.service;
	            	var url = service.capabilitiesUrl;
	            	var xmlDoc = self.loadDoc(url);
	            	var layers = xmlDoc.getElementsByTagName("Layer");
	            	if(layers.length > 0){
	            		self.createChildNodes(node, layers[0], true);
	            	}
	            	node.on("move", function(tree, thisNode, oldParent, newParent, index, nextNode) {
	            		if(tree.id == "treeService"){
	            			thisNode.removeAll();
	            		}
	            	});
	            	root.expand(false, /*no anim*/ false);
	        	}
        	}
        });
        
        self.treeActiveService.getSelectionModel().on({
        	selectionchange: function (tree, node){
        		var sliderLayer = Ext.getCmp("slider_layer");
        		if(node){
        			if(node.attributes.checked != undefined){
            			sliderLayer.show();
            			if(node.attributes.opacity){
            				sliderLayer.setValue(node.attributes.opacity, false);
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
        root2.expand(false, /*no anim*/ false);
	},
	save: function() {
		var activeServices = [];
		this.getActiveServices(activeServices, this.treeActiveService.root.childNodes);
		
		de.ingrid.mapclient.Configuration.setValue('activeServices', Ext.encode({activeServicesDefaultOpacity: Ext.getCmp("slider_service").getValue(),activeServices: activeServices}), de.ingrid.mapclient.admin.DefaultSaveHandler);
	},
	getActiveServices: function(services, nodes){
		var service = [];
		for (var i=0, count=nodes.length; i<count; i++) {
			var node = nodes[i];
			var serviceUrl; 
			var serviceLayers = [];
			if(node.attributes.service){
				serviceUrl = node.attributes.service.capabilitiesUrl;
			}
			
			this.getActiveServiceLayers(serviceLayers, node.childNodes);
			
			services.push({serviceUrl: serviceUrl, serviceLayers:serviceLayers });
		}
	},
	getActiveServiceLayers: function(serviceLayers, nodes){
		for (var i=0, count=nodes.length; i<count; i++) {
			var node = nodes[i];
			if(node.attributes.checked != undefined){
				serviceLayers.push({layer: node.attributes.name, opacity: node.attributes.opacity, checked: node.attributes.checked});
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
						cls: 'x-tree-noicon'
					};
					children.push(childNode);
				}
			}
		}
		var node = {
			text: '',
			children: children,
			leaf: children.length == 0 ? true : false,
			expanded: true,
			expandable: true
		};
		return node;
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
		node.allowChildren = false;
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
					
					firstNode = new Ext.tree.TreeNode({
						name: name,
						text: title,
						leaf: self.hasChildNodes(layer) ? false : true,
						cls: 'x-tree-noicon',
						checked: false,
						expanded: true,
						allowDrop:false,
						allowDrag:false,
						allowChildren:false
					});
					
					node.appendChild(firstNode);
					node.expand();
				}
			}
		}
		
		var children = layer.children;
		for (var i=0, count=children.length; i<count; i++) {
			var child = children[i];
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
					
					var childNode = new Ext.tree.TreeNode({
						name: name,
						text: title,
						leaf: self.hasChildNodes(child) ? false : true,
						cls: 'x-tree-noicon',
						checked: false,
						expanded: true,
						allowDrop:false,
						allowDrag:false,
						allowChildren:false
					});
					
					if(firstNode){
						firstNode.appendChild(childNode);
						firstNode.expand();
					}else{
						node.appendChild(childNode);
						node.expand();
					}
					self.createChildNodes(childNode, child, false);
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