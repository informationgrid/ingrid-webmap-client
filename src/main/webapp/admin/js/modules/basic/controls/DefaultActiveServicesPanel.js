/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultActiveServicesPanel is used to select a default WMS server
 * and the default map layers provided by it.
 */
de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel = Ext.extend(Ext.Panel, {

	title: '\'Aktive Dienste\'',
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
    			    },		      
    			      {
    					xtype: 'button',
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
		
		 // set the root node
        var root = new Ext.tree.AsyncTreeNode({
            text: 'Dienste', 
            draggable:false, // disable root node dragging
            expanded: true,
            children: node.children,
            cls: 'folder'
        });
        self.treeService.setRootNode(root);
        
        self.treeService.on('afterrender', function(tree){
        	var moveServices = [];
        	for (var i=0, count=self.services.length; i<count; i++) {
				var curService = self.services[i];
				var isInUsed = false;
				var usedServices = de.ingrid.mapclient.Configuration.getValue('wmsActiveServices');
				for (j = 0; j < usedServices.length; j++) {
					var usedService = usedServices[j];
					if(usedService.capabilitiesUrl == curService.capabilitiesUrl){
						moveServices.push(usedService);
					}
				}
			}
        	if(moveServices.length > 0){
        		for (i = 0; i < tree.root.childNodes.length; i++) {
            		var childNode = tree.root.childNodes[i];
            		if(childNode.attributes){
            			var curService = childNode.attributes.service;
                		
                		for (j = 0; j < moveServices.length; j++) {
                			var moveService = moveServices[j];
                			if(moveService.capabilitiesUrl == curService.capabilitiesUrl){
                				self.treeActiveService.root.appendChild(childNode);
                				self.checkedChildNodes(childNode, moveService.checkedLayers);
                        		break;
                			}
                		}
            		}
            	}
        	}
        });
	},
	checkedChildNodes: function(node, layers){
		var self = this;
		for (i = 0; i < layers.length; i++) {
			for (j = 0; j < node.childNodes.length; j++) {
				var childNode = node.childNodes[j];
				var layer = layers[i];
				if(layer == childNode.attributes.name){
					childNode.getUI().toggleCheck(true);
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
        
        self.treeActiveService.on('movenode', function(tree, node, root){
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
        });
        
        root2.expand(false, /*no anim*/ false);
	},
	save: function() {
		var activeServices = [];
		this.getActiveServices(activeServices, this.treeActiveService.root.childNodes);
		de.ingrid.mapclient.Configuration.setValue('activeServices', Ext.encode(activeServices), de.ingrid.mapclient.admin.DefaultSaveHandler);
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
			if(node.attributes.checked){
				serviceLayers.push(node.attributes.name);
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
		    		
		    		for (j = 0; j < layer.children.length; j++) {
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
		    		
		    		for (j = 0; j < child.children.length; j++) {
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