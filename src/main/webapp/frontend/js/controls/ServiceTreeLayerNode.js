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
 * Copyright (c) 2012 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

Ext.define('de.ingrid.mapclient.frontend.controls.ServiceTreeLayerNode', {
    extend: 'GeoExt.tree.LayerNode',
    alias: 'plugin.gx_layer_ingrid',
    init: function(target) {

        this.target = target;
        var layer = target.get('layer');
        
        if(layer.params){
            if(layer.params['LAYERS'].indexOf('INGRID-') > -1){
                if(layer.getVisibility()){
                    layer.setVisibility(false);
                    target.set('checked', true);
                }
            }
        }else{
            if(target.get('checked')){
                if(layer.getVisibility() == false){
                    if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection")){
                        layer.setVisibility(true);
                    }else{
                        var isParentsSelect = this.isParentsSelect(target);
                        if(isParentsSelect){
                            if(target.get('leaf')){
                                layer.setVisibility(true);
                            }
                        }
                    }
                }
                if(target.get('leaf') == false){
                    if(layer.getVisibility()){
                        var cls = '';
                        if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
                            cls = 'x-tree-node-select';
                        }
                        if(target.get("expanded")){
                            cls = cls + ' ' + 'x-tree-expand';
                        }
                        target.set('cls', cls);
                    }
                }
            }else{
                target.set('checked', layer.getVisibility());
            }
        }
        if (!target.get('checkedGroup') && layer.isBaseLayer) {
            target.set('checkedGroup', 'gx_baselayer');
        }
        
        if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
            if(target.childNodes.length > 0 && target.get("cls").indexOf("x-tree-node-select") < 0){
                layer.setVisibility(false);
            }
        }
        
        target.set('fixedText', !!target.text);

        target.set('leaf', target.get("leaf"));

        if(!target.get('iconCls')) {
            target.set('iconCls', "gx-tree-layer-icon");
        }

        target.on('afteredit', this.onAfterEdit, this);
        /*
        layer.events.on({
            "visibilitychanged": this.onLayerVisibilityChanged,
            scope: this
        });
        */
        this.enforceOneVisible();
    },
    onLayerVisibilityChanged: function() {
        if(!this._visibilityChanging) {
            this.target.set('checked', this.target.get('layer').getVisibility());
        }
    },
    onCheckChange: function() {
        var self = this;
        var node = this.target,
            checked = this.target.get('checked');

        
        if(checked != node.get('layer').getVisibility() || de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false) {
            node._visibilityChanging = true;
            var layer = node.get('layer');
            if(checked && layer.isBaseLayer && layer.map) {
                layer.map.setBaseLayer(layer);
            } else if(!checked && layer.isBaseLayer && layer.map &&
                      layer.map.baseLayer && layer.id == layer.map.baseLayer.id) {
                // Must prevent the unchecking of radio buttons
                node.set('checked', layer.getVisibility());
            } else {
                if(layer.params){
                    if(layer.params['LAYERS'].indexOf('INGRID-') == -1){
                        if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection")){
                            layer.setVisibility(checked);
                        }else{
                            var isParentsSelect = this.isParentsSelect(node);
                            if(node.childNodes.length == 0){
                                if(isParentsSelect){
                                    layer.setVisibility(checked);
                                }
                            }else{
                                if(checked){
                                    if((node.get("cls").indexOf("x-tree-node-select") > - 1 || node.get("leaf") == true) && isParentsSelect){
                                        layer.setVisibility(checked);
                                    }
                                    this.checkboxSelection(node, true, isParentsSelect);
                                }else{
                                    layer.setVisibility(checked);
                                    this.checkboxSelection(node, false, isParentsSelect);
                                }
                            }
                        }
                    }
                }else{
                    layer.setVisibility(checked);
                }
            }
            delete node._visibilityChanging;
        }
        
        self.checkNodes(node, checked);
        this.enforceOneVisible();
    },
    checkNodes: function (node, checked){
        var self = this;
        node.eachChild(function(n) {
            if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection")){
                // Selection of all childs
                n.set('checked', checked);
            } else{
                var isParentsSelect = self.isParentsSelect(n);
                var layer = n.get('layer');
                var checkedLayer = n.get('checked');
                if(isParentsSelect){
                    if(checkedLayer){
                        if((n.get("cls").indexOf("x-tree-node-select") > - 1 || n.get("leaf") == true) && isParentsSelect){
                            layer.setVisibility(checkedLayer);
                        }
                    }
                }else{
                    if(!layer.isBaseLayer){
                        layer.setVisibility(false);
                    }
                }
            }
            self.checkNodes(n, checked);
        });
    },
    isParentsSelect: function(node) {
        var parentNode = node.parentNode;
        var isChecked = true;
        if(parentNode.get("layer")){
            if(parentNode.get("checked")){
                isChecked = this.isParentsSelect(parentNode);
            }else{
                isChecked = false;
            }
        }
        return isChecked;
    },
    checkboxSelection: function(node, select, isParentsSelect) {
        var childNodes = node.childNodes; 
        for (var i = 0, count = childNodes.length; i < count; i++) {
            var childNode = childNodes[i];
            var isParentSelectChildNode = this.isParentsSelect(childNode);
            if(childNode.get("checked")){
                var layer = childNode.get("layer");
                if(layer){
                    if(select){
                        if(((layer.getVisibility() == false) && (layer.options.nestedLayers.length == 0) && isParentSelectChildNode) == true){
                            layer.setVisibility(select);
                        }else if ((childNode.leaf == false) && (childNode.attributes.cls == "x-tree-node-select") && isParentSelectChildNode){
                            layer.setVisibility(select);
                        }
                    }else{
                        if(layer.getVisibility()){
                            layer.setVisibility(select);
                        }
                    }
                }
            }
            this.checkboxSelection(childNode, select, isParentSelectChildNode);
        }
    }
});
