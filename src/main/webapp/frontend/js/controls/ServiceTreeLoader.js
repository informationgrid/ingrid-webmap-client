/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
 * Copyright (c) 2012 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

Ext.define('de.ingrid.mapclient.frontend.controls.ServiceTreeLoader', {
	extend: 'GeoExt.tree.LayerLoader',
	requires: [
       'GeoExt.tree.LayerNode'
    ],
	initComponent : function() {
		Ext.apply(this, {});
		this.superclass.initComponent.apply(this, arguments);
	},
	
	/** 
	* Override this method of LayerLoader to prevent duplicate adding of 
	* nodes, since this method is triggered by the store-event
	*/
	onStoreAdd: function(store, records, index, node) {
		// skip event handling of store
		return;
	},
	
	/** 
	* Override this method of LayerLoader to prevent duplicate remove handling of 
	* nodes, since this method is triggered by the store-event
	*/
    onStoreRemove: function(store, record, index, node) {
		// skip event handling of store
		return;
    },
    /**
     * @param {GeoExt.data.LayerTreeModel} node The node to add children to.
     * @private
     */
    load: function(node) {
    	if (this.fireEvent("beforeload", this, node)) {
            this.removeStoreHandlers();
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }

            if (!this.store) {
                this.store = GeoExt.MapPanel.guess().layers;
            }
            
            this.store.each(function(record) {
            	var layer = record.getLayer();
            	if (this.filter(record) === true) {
            		if (this.service) {
	            		var serviceLayer = this.service.getLayerByName(layer.params.LAYERS);
	            		if(serviceLayer.options.isRootLayer){
	            			if(serviceLayer.options.nestedLayers){
	                			if(serviceLayer.options.nestedLayers.length > 0){
	                				this.addLayerNode(node, record);
	                    			var lastChild = node.lastChild;
	                    			lastChild.set("allowDrag", false);
	                    			lastChild.set("allowDrop", false);
	                        		this.addNestedLayerNodes(lastChild, this.store, layer, this.service);
	                			}else{
	                				this.addLayerNode(node, record);
	                			}
	                    	}
	            		}
            		} else {
            			this.addLayerNode(node, record);
            		}
            	}
            }, this);
            
            if(!this.initialAdd){
            	// Check nodes by admin configuration
            	if(this.checkedLayers == undefined){
            		this.checkNodeByAddService(node);            		
            	}else{
					for (var j = 0; j < this.checkedLayers.length; j++) {
						var checkedLayer = this.checkedLayers[j];
						this.checkNodes(checkedLayer, node);
					}
            	}
            }
            
            if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpand")){
            	// Expand nodes by default
                this.expandNodeByDefault(node);
            } else if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState")){
            	// Expand nodes by state
            	if(this.initialAdd){
            		this.expandNodeByState(node);
            	}
    		}
            
            if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
            	if(this.layersByURLService){
                	if(node.childNodes){
                		this.checkSelectParentNode(node.childNodes);
                	}
                }
            }
            
            var serviceNodes = this.layerTree.getRootNode().childNodes;
			var layers = [];
			for (var i = 0, countI = serviceNodes.length; i < countI; i++) {
			 	var serviceNode = serviceNodes[i];
			 	this.panel.getLayersFromTree(serviceNode, layers);
			}
		
			// Change layer order on map
			if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceAddReversal") == false){
				for (var j = 0, count = layers.length; j < count; j++) {
					var layer = layers[j];
					this.map.raiseLayer(layer, layers.length);
				}
			}
            this.addStoreHandlers(node);

            this.fireEvent("load", this, node);
        }
        
    },
    checkSelectParentNode: function (nodes){
    	for(var j = 0; j < nodes.length; j++){
    		var node = nodes[j];
    		var layer = node.get("layer");
    		if(layer){
    			if(layer.params){
    				var id = layer.params.LAYERS;
    				var capabilitiesUrl = node.raw.service.capabilitiesUrl;
    				
        			if(layer.options.isRootLayer == false){
        				for (var i = 0, count = this.layersByURLService.length; i < count; i++) {
        					var urlLayer = this.layersByURLService[i];
        					var urlLayerId = urlLayer.params.LAYERS;
        					if(urlLayer.visibility){
        						if(id == urlLayerId){
        							var parent = node.parentNode;
        							if(parent){
        								if(parent.get("checked") != true){
        									parent.set("checked", true);
        								}
        							}
        							break;
        						}
        					}
        				}
        			}
    			}
    		}
    		if(node.hasChildNodes()){
        		this.checkSelectParentNode(node.childNodes);
    		}
    	}
    },
    checkNodeByAddService: function (node){
        var wmsServices = de.ingrid.mapclient.Configuration.getValue("wmsServices");
        if(this.service){
        	for(var i = 0; i < wmsServices.length; i++){
    			if(this.service.capabilitiesUrl == wmsServices[i].capabilitiesUrl){
    				var cl = wmsServices[i].checkedLayers;
    				if(cl){
    					for(var j = 0; j < cl.length; j++){
    						var k = 0;
    						this.checkNodes(cl[j],node);
    					}
    				}
    				break;
    			}
    		}
        }
    },
    checkNodes: function(layerName, node){
    	var self = this;
		node.eachChild(function(n) {
			var layer = n.get("layer");
			if(layerName.layer){
				if(layerName.layer == layer.params.LAYERS){
					if(layerName.checked != undefined){
						n.set('checked', layerName.checked);
						layer.setVisibility(layerName.checked);
					}else{
						n.set('checked', true);
						layer.setVisibility(true);
					}
					if(layerName.opacity != ""){
						layer.setOpacity(parseInt(layerName.opacity)/100);
					}else{
						if(de.ingrid.mapclient.Configuration.getValue('activeServicesDefaultOpacity')){
							layer.setOpacity(parseInt(de.ingrid.mapclient.Configuration.getValue('activeServicesDefaultOpacity'))/100);
						}
					}
				}
			}else{
				if (layerName == layer.params.LAYERS){
					n.set('checked', true);
					layer.setVisibility(true);
				}
			}
				
			if (n.hasChildNodes()) {
				self.checkNodes(layerName, n);
			}
		});
    },
    expandNodeByDefault: function(node){
    	node.expand(true);
    },
    expandNodeByState: function(node){
    	for (var i = 0, count = this.treeState.length; i < count; i++) {
			var state = this.treeState[i];
			var name = node.get("text");
			if(this.service){
				var capabilitiesUrl = this.service.capabilitiesUrl;
				var isService = node.get("layer") ? "false" : "true";
				var layer = node.get("layer") ? node.get("layer").params.LAYERS : "";
				
				if(name == state.name && capabilitiesUrl == state.capabilitiesUrl && isService + "" == state.isService && layer == state.layer){
					node.expand(false);
					break;
				}
			}
		}
		if(node.hasChildNodes()){
			for (var j = 0, count = node.childNodes.length; j < count; j++) {
				var childNode = node.childNodes[j];
				this.expandNodeByState(childNode, true);
			}
		}
    },
    addNestedLayerNodes: function(node, store, rootLayer, service) {
    	var self = this;
		if(node){
			if(rootLayer){
				var serviceLayer = service.getLayerByName(rootLayer.params.LAYERS);
        		var nestedLayers = serviceLayer.options.nestedLayers;
				for(var i = 0; i < nestedLayers.length; i++){
					var nestedLayer = nestedLayers[i];
					var layer = this.service.getLayerByName(nestedLayer);
					store.each(function(record) {
	            		if (de.ingrid.mapclient.frontend.data.Service.compareLayers(record.getLayer(), layer)) {
	            			this.addLayerNode(node, record, i);
	            			if(layer.options.nestedLayers){
	            				if(layer.options.nestedLayers.length > 0){
	            					var lastChild = node.lastChild;
	            					lastChild.set("allowDrag", false);
	    	            			lastChild.set("allowDrop", false);
	    	            			lastChild.set("expandable", true);
	    	                		this.addNestedLayerNodes(lastChild, store, layer, this.service);
	            				}
		                	}
	            		}
		            }, this);
				}
			}
		}
    },
    /**
     * Adds a child node representing a layer of the map
     *
     * @param {GeoExt.data.LayerTreeModel} node The node that the layer node
     *     will be added to as child.
     * @param {GeoExt.data.LayerModel} layerRecord The layer record containing
     *     the layer to be added.
     * @param {Integer} index Optional index for the new layer.  Default is 0.
     * @private
     */
    addLayerNode: function(node, layerRecord, index) {
    	index = index || 0;
    	if (this.filter(layerRecord) === true) {
            var layer = layerRecord.getLayer();
            var checked = false;
            var isLayerVisible = false;
            if(layer){
            	// Checked layer from session
                if(layer.params){
    	            for (var i = 0; i < this.selectedLayersByService.length; i++) {
    					var selectedLayer = this.selectedLayersByService[i];
    					if(selectedLayer.id == layer.params.LAYERS){
    						checked = true;
    						break;
    					}
    				}
                }
                if(layer.getVisibility()){
                	checked = layer.getVisibility();
                	isLayerVisible = layer.getVisibility();
                }
                
                var child = this.createNode({
                	plugins: [{
                        ptype: 'gx_layer_ingrid'
                    }],
                    layer: layer,
                    text: layer.name,
                    allowDrop: false,
                    allowDrag: false,
                    leaf: layer.options.nestedLayers ? (layer.options.nestedLayers.length > 0 ? false : true) : true,
                    checked: checked,
                    cls: layer.inRange ? "" : "x-tree-node-disabled",
                    service: this.service,
                    // Expand nodes
                    expanded: false,
                    expandable: layer.options.nestedLayers ? (layer.options.nestedLayers.length > 0 ? true : false) : false,
                    children: []
                });
                
                node.set("allowDrop", false);

                if (index !== undefined) {
                	node.insertChild(index, child);
                } else {
                    node.appendChild(child);
                }
                
                if(isLayerVisible){
                	if(node.get("layer")){
                		node.set("checked", true);
                	}
                }
            }
        }
    }
});
