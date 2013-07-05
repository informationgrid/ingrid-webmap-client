/*
 * Copyright (c) 2012 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class ServiceTreeLoader asynchronously loads layers in a service.
 */
de.ingrid.mapclient.frontend.controls.ServiceTreeLoader = function() {
};

de.ingrid.mapclient.frontend.controls.ServiceTreeLoader = Ext.extend(GeoExt.tree.LayerLoader, {
	initComponent : function() {
		Ext.apply(this, {});
		de.ingrid.mapclient.frontend.controls.ServiceTreeLoader.superclass.initComponent
				.apply(this, arguments);
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
    }
});

/**
 * Load children of the given node. This method is overridden in order to take layer
 * hierarchies into account.
 * @param node Ext.tree.TreeNode to load the children for
 * @param callback A function to be called after load
 */
de.ingrid.mapclient.frontend.controls.ServiceTreeLoader.prototype.load = function(node, callback) {
	if (this.fireEvent("beforeload", this, node)) {
		this.removeStoreHandlers();
		while (node.firstChild) {
			node.removeChild(node.firstChild);
		}

		if (!this.uiProviders) {
			this.uiProviders = node.getOwnerTree().getLoader().uiProviders;
		}

		if (!this.store) {
			this.store = GeoExt.MapPanel.guess().layers;
		}

		// check if the current node is the service or a layer node
		var service = node.attributes.service;
		if (!service) {
			throw "Service attribute is expected on node: "+node.text;
		}
		// problem is that node.text is at first the service title
		// so we need a routine that checks what the node is i.e. layer/service
		// if its a service we null it and look for the rootlayer
		// otherwise its a layer and we have the info we need
		var layer = null;
		if(node.layer)
			layer = service.getLayerByName(node.layer.params.LAYERS);// layer = node.layer does NOT work!
		else if (node.text == service.getDefinition().title)
			layer = null; // it is a service so we look for the rootlayer
		else
			layer = service.getLayerByTitle("");//not yet implemented since id are made with unique names not titles		
		if (layer) {
			// the node represents a layer -> get child layers
			var nestedLayers = layer.options.nestedLayers;
			this.store.each(function(record) {
				if (this.filter(record) === true) {
					var recordLayer = record.getLayer();
					// NOTE: use params.LAYERS attribute instead of name for lookup,
					// because name might differ from the definition in nestedLayers attribute
					if (nestedLayers.indexOf(recordLayer.params.LAYERS) != -1) {
						this.addLayerNode(node, record);
					}
				}
			}, this);
		}
		else if (node.text == service.getDefinition().title) {
			// the node represents the service -> load root layers
			this.store.each(function(record) {
				if (this.filter(record) === true) {
					var layer = service.getLayerByName(record.getLayer().params.LAYERS);
					if (layer.options.isRootLayer) {
						this.addLayerNode(node, record);
					}
				}
			}, this);
		}

		this.addStoreHandlers(node);

		if (typeof callback == "function") {
			callback();
		}

		this.fireEvent("load", this, node);
	}
};

/**
 * Add a node representing the given record as child of the given node. This method is overridden
 * in order to add custom information to the nodes
 * @param node The node to add to
 * @param layerRecord The record describing the layer to add
 * @param index
 */
de.ingrid.mapclient.frontend.controls.ServiceTreeLoader.prototype.addLayerNode = function(node, layerRecord, index) {
	index = index || 0;
	var service = node.attributes.service;
	var layer = service.getLayerByName(layerRecord.data.layer.params.LAYERS);
	if (!layer) {
		// something went wrong...
		return;
	}
	var isLeaf = layer.options.nestedLayers.length == 0;
	var loader = isLeaf ? undefined : this;
	var child = this.createNode({
		nodeType: 'gx_layer',
		layer: layerRecord.getLayer(),
		layerStore: this.store,
		loader: loader,
		isLeaf: isLeaf,
		service: service,
		allowDrop:false,
		allowDrag:false 
	});
	
	if(child){
		node.allowChildren=false;
		node.appendChild(child);
	}
	
	child.on("move", this.onChildMove, this);
	//on checkchange(we check the service) we expand the nodes of the service and check all layers
	if (this.onCheckChangeCallback) {
		child.on('checkchange', this.onCheckChangeCallback);
	}
};


Ext.override(GeoExt.tree.LayerNodeUI, {
    onDblClick: function(e) {
        e.preventDefault();
        if(e.getTarget('.x-tree-node-cb', 1)) {
            this.toggleCheck(this.isChecked());
        } else {
            GeoExt.tree.LayerNodeUI.superclass.onClick.apply(this, arguments);
        }
    }
});