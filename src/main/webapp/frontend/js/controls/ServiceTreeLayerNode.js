/*
 * Copyright (c) 2012 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

Ext.define('de.ingrid.mapclient.frontend.controls.ServiceTreeLayerNode', {
	extend: 'GeoExt.tree.LayerNode',
	alias: 'plugin.gx_layer_ingrid',
	init: function(target) {

        this.target = target;
        var layer = target.get('layer');

        if(layer.params['LAYERS'].indexOf('INGRID-') > -1){
        	if(layer.getVisibility()){
        		layer.setVisibility(false);
        		target.set('checked', true);
        	}
        }else{
        	target.set('checked', layer.getVisibility());
        }
        if (!target.get('checkedGroup') && layer.isBaseLayer) {
            target.set('checkedGroup', 'gx_baselayer');
        }
        target.set('fixedText', !!target.text);

        target.set('leaf', target.leaf);

        if(!target.get('iconCls')) {
            target.set('iconCls', "gx-tree-layer-icon");
        }

        target.on('afteredit', this.onAfterEdit, this);
        layer.events.on({
            "visibilitychanged": this.onLayerVisibilityChanged,
            scope: this
        });
        this.enforceOneVisible();
    },
    onCheckChange: function() {
        var node = this.target,
            checked = this.target.get('checked');

        if(checked != node.get('layer').getVisibility()) {
            node._visibilityChanging = true;
            var layer = node.get('layer');
            if(checked && layer.isBaseLayer && layer.map) {
                layer.map.setBaseLayer(layer);
            } else if(!checked && layer.isBaseLayer && layer.map &&
                      layer.map.baseLayer && layer.id == layer.map.baseLayer.id) {
                // Must prevent the unchecking of radio buttons
                node.set('checked', layer.getVisibility());
            } else {
            	 if(layer.params['LAYERS'].indexOf('INGRID-') == -1){
            		 layer.setVisibility(checked);
            	 }
            }
            delete node._visibilityChanging;
        }
        
        node.eachChild(function(n) {
			if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection")){
    			// Selection of all childs
				n.set("checked", checked);
    		}else{
    			var layer = n.get('layer');
    			layer.setVisibility(false);
    			//n.set('checked', true);
    		}
	    });
        this.enforceOneVisible();
    },
});