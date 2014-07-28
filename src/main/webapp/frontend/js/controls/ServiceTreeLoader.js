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
            this.store.each(function(record) {
                this.addLayerNode(node, record);
            }, this);
            this.addStoreHandlers(node);

            this.fireEvent("load", this, node);
        }
    	/*
    	if (this.fireEvent("beforeload", this, node)) {
            this.removeStoreHandlers();
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }

            if (!this.store) {
                this.store = GeoExt.MapPanel.guess().layers;
            }
            
            var service = node.getData().container.service;
            if (!service) {
    			throw "Service attribute is expected on node: "+node.text;
    		}

            this.store.each(function(record) {
            	var layer = record.getLayer();
            	if(layer.options.isRootLayer){
            		this.addLayerNode(node, record);
            		if(layer.options.nestedLayers){
                		this.addNestedLayerNodes(node.firstChild, this.store, layer, service);
                	}
            	}
            }, this);
            
            this.addStoreHandlers(node);

            this.fireEvent("load", this, node);
        }
        */
    },
    addNestedLayerNodes: function(node, store, rootLayer, service) {
    	var self = this;
		if(node){
			if(rootLayer){
				var nestedLayers = rootLayer.options.nestedLayers;
				for(var i = 0; i < nestedLayers.length; i++){
					var nestedLayer = nestedLayers[i];
					var layer = service.getLayerByName(nestedLayer);
					store.each(function(record) {
	            		if (record.getLayer() == layer) {
	            			console.debug(nestedLayer);
	            			this.addLayerNode(node, record, i);
	            			if(layer.options.nestedLayers){
	            				this.addNestedLayerNodes(node.firstChild, store, layer, service);
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
            var child = this.createNode({
                plugins: [{
                    ptype: 'gx_layer'
                }],
                layer: layer,
                text: layer.name,
                listeners: {
                    move: this.onChildMove,
                    scope: this
                }
            });
            if (index !== undefined) {
                node.insertChild(index, child);
            } else {
                node.appendChild(child);
            }
            node.getChildAt(index).on("move", this.onChildMove, this);
        }
    }
});