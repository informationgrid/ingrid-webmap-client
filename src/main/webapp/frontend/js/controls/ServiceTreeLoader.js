/*
 * Copyright (c) 2012 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

Ext.define('de.ingrid.mapclient.frontend.controls.ServiceTreeLoader', {
	extend: 'GeoExt.tree.LayerLoader',
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
            
            if (!this.service) {
    			throw "Service attribute is expected on node: "+node.text;
    		}

            this.store.each(function(record) {
            	var layer = record.getLayer();
            	if(layer.options.isRootLayer){
            		this.addLayerNode(node, record);
            		if(layer.options.nestedLayers){
            			if(layer.options.nestedLayers.length > 0){
	            			var lastChild = node.lastChild;
	            			lastChild.set("allowDrag", false);
	            			lastChild.set("allowDrop", false);
	            			lastChild.set("leaf", false);
	                		this.addNestedLayerNodes(lastChild, this.store, layer, this.service);
            			}
                	}
            	}
            }, this);
            
            // Check nodes by admin configuration
            if(!this.initialAdd){
	            var wmsServices = de.ingrid.mapclient.Configuration.getValue("wmsServices");
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
            
            this.addStoreHandlers(node);

            this.fireEvent("load", this, node);
        }
        
    },
    addNestedLayerNodes: function(node, store, rootLayer, service) {
    	var self = this;
		if(node){
			if(rootLayer){
				var nestedLayers = rootLayer.options.nestedLayers;
				for(var i = 0; i < nestedLayers.length; i++){
					var nestedLayer = nestedLayers[i];
					var layer = this.service.getLayerByName(nestedLayer);
					store.each(function(record) {
	            		if (record.getLayer() == layer) {
	            			this.addLayerNode(node, record, i);
	            			if(layer.options.nestedLayers){
	            				if(layer.options.nestedLayers.length > 0){
	            					var lastChild = node.lastChild;
	            					lastChild.set("allowDrag", false);
	    	            			lastChild.set("allowDrop", false);
	    	            			lastChild.set("leaf", false);
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
            var child = this.createNode(Ext.create('GeoExt.tree.LayerNode', {
            	plugins: [{
                    ptype: 'gx_layer_ingrid'
                }],
                layer: layer,
                text: layer.name,
                leaf: false,
                checked: false,
                cls: layer.inRange ? "" : "x-tree-node-disabled",
                service: this.service,
                // Expand nodes
                expanded: de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection"),
                expandable: true,
                children: []
            }));
            
            node.set("allowDrop", false);
            
            if (index !== undefined) {
            	node.insertChild(index, child);
            } else {
                node.appendChild(child);
            }
        }
    },
    checkNodes: function(layerName, node){
    	var self = this;
		node.eachChild(function(n) {
			if (layerName == n.get("layer").params.LAYERS){
				n.get("layer").setVisibility(true);
			}
				
			if (n.hasChildNodes) {
				self.checkNodes(layerName, n);
			}
		});
    }
});