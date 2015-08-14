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
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class ActiveServicesPanel shows the activated services.
 * The panels fires a 'datachanged' event, if the list of services changed.
 */


Ext.define('de.ingrid.mapclient.frontend.controls.ActiveServicesPanel', {
    extend: 'Ext.Panel',
    requires: [
        'Ext.layout.container.Border',
        'Ext.tree.plugin.TreeViewDragDrop',
        'Ext.data.TreeStore',
        'GeoExt.tree.Panel',
        'GeoExt.panel.Map',
        'GeoExt.tree.OverlayLayerContainer',
        'GeoExt.tree.BaseLayerContainer',
        'GeoExt.data.LayerTreeModel',
        'GeoExt.tree.View',
        'GeoExt.tree.Column',
        'GeoExt.data.LayerTreeModel',
        'GeoExt.data.LayerStore',
        'GeoExt.tree.LayerLoader',
        'GeoExt.tree.LayerContainer',
        'GeoExt.container.WmsLegend',
        'GeoExt.container.UrlLegend',
        'GeoExt.container.VectorLegend',
        'GeoExt.panel.Legend'
    ],
    id: 'activeServices',
    title: i18n('tAktiveDienste'),
    layout: 'fit',
    /**
     * @cfg OpenLayers.Map instance to sync the internal store with
     */
    map: null,

    /**
     * The currently selected node
     */
    activeNode: null,

    /**
     * Ext.util.MixedCollection containing the de.ingrid.mapclient.frontend.data.Service instances
     */
    services: new Ext.util.MixedCollection(),

    /**
     * GeoExt.data.LayerStore instance
     */
    layerStore: null,
    treeStore: null,

    /**
     * Ext.tree.TreePanel instance
     */
    layerTree: null,

    ctrls:null,
    kmlArray: [],
    serviceCategoryPanel:null,
    parentCheckChangeActive:false,
    isCheckedByCheckedLayers:false,
    selectedLayersByService: [],
    state: null,
    layersByURLService:[],
    menuGroupLayer: null,
    menuLayer: null,
    menuService: null,
    menuNodeId:  "",
    treeState: [],
    metadataWindowsCount: 0,
    metadataWindowStart: 0,
    /**
     * Initialize the component (called by Ext)
     */
    initComponent: function() {

        var self = this;
        
        // add the datachanged event
        this.addEvents({
            datachanged: false
        });

        // zoom to layer extent
        var bbox = null;
        
        var deleteAction = {
            text: i18n('tLoeschen'),
            iconCls: 'iconRemove',
            tooltip: i18n('tZumEntfernenErstEinenDienstMarkieren'),
            handler: function(){
                var node = self.activeNode;
                var service = node.getData().container.service;
                if (node) {
                    if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState")){
                        // Remove tree state from session
                        if(node.raw.service){
                            for(var i = 0; i < self.treeState.length; i++){
                                var state = self.treeState[i];
                                if(state.capabilitiesUrl  == node.raw.service.capabilitiesUrl ){
                                    var index = self.treeState.indexOf(state);
                                    if (index > -1) {
                                        self.treeState.splice(index, 1);
                                        if(self.treeState.length > 0){
                                            i--;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Remove selected Layers
                    if(node.raw.service){
                        for(var i = 0; i < self.selectedLayersByService.length; i++){
                            var layer = self.selectedLayersByService[i];
                            if(layer.capabilitiesUrl == node.raw.service.capabilitiesUrl){
                                var index = self.selectedLayersByService.indexOf(layer);
                                if (index > -1) {
                                    self.selectedLayersByService.splice(index, 1);
                                    if(self.selectedLayersByService.length > 0){
                                        i--;
                                    }
                                }
                                
                            }
                        }
                    }
                    
                    if(service != undefined){
                        self.removeService(service, null, node);
                    }else{
                        // Remove "Zeige Punktkoordinaten" service
                        self.removePointCoordinatesService(node);
                    }

                }
                self.menuNodeId = "";
            },
            cls: 'font-menu'
        };
        
        var metadataAction = {
            text: i18n('tInformation'),
            iconCls: 'iconMetadata',
            tooltip: i18n('tFuerMetadatenErst'),
            handler: function() {
                self.displayMetaData(self.activeNode);
                self.menuNodeId = "";
            },
            cls: 'font-menu'
        };
        
        var zoomToExtendAction = {
            text: i18n('tZoomToLayerExtent'),
            iconCls: 'iconZoomLayerExtent',
            tooltip: i18n('tZoomeAufServiceOderLayer'),
            handler: function() {
                var bounds   = null;
                var minScale = null;
                var node = self.activeNode;
                if (node) {
                    var layer = node.get("layer");
                    if(layer){
                        bounds = self.bboxOfLayerExtent(layer)
                        // every layer has a minScale, even if not found in getCapabilities-Document
                        // in that case the minScale is calculated by the resolution of the map (see Layer.js:940) 
                        minScale = layer.minScale;
                    }else{
                        var service = node.getData().container.service;
                        bounds = self.bboxOfServiceExtent(service)
                        //minScale = self.activeNode.layer.minScale;
                        if (!bounds) bounds = self.getBoundsFromSubLayers(service, node);
                        minScale = self.getMinScaleFromSubLayers(service, node);
                    }
                    
                    self.map.zoomToExtent(bounds);
                    // zoom in if the content cannot be shown at this level
                    if(minScale) {
                        var minResolution = OpenLayers.Util.getResolutionFromScale(minScale, self.map.baseLayer.units);
                        if (minResolution < self.map.resolution) {
                            // probably due to a not so exact conversion of the scale
                            // we have to decrease the scale, so that the layer is actually seen (INGRID-2235)
                            self.map.zoomToScale(minScale * 0.9);
                        }
                    }
                    this.fireEvent('datachanged');
                }
                self.menuNodeId = "";
            },
            cls: 'font-menu'
        };
        
        var groupLayerAction = {
            iconCls: 'iconLayer',
            text: i18n('tGruppenLayerAnzeigen'),
            hidden: de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection"),
            tooltip: i18n('tGruppenLayerAnzeigen'),
            handler: function(a, b, c) {
                var node = self.activeNode;
                var layer = node.get("layer");
                if(node.get("cls").indexOf("x-tree-node-select") > -1){
                    layer.setVisibility(false);
                    var cls = '';
                    if(node.get("expanded")){
                        cls = cls + ' ' + 'x-tree-expand';
                    }
                    node.set('cls', cls);
                }else{
                    var isParentsSelect = self.isParentsSelect(node);
                    var cls = 'x-tree-node-select';
                    if(node.get("expanded")){
                        cls = cls + ' ' + 'x-tree-expand';
                    }
                    node.set('cls', cls);
                    node.set('checked', true);
                }
            },
            cls: 'font-menu'
        };
        
        self.menuService = Ext.create('Ext.menu.Menu', {
            showSeparator: false,
            items: [
                deleteAction,
                metadataAction,
                zoomToExtendAction
            ]
        });
        
        self.menuGroupLayer = Ext.create('Ext.menu.Menu', {
            showSeparator: false,
            items: [
                 metadataAction,
                 zoomToExtendAction,
                 groupLayerAction,
                 {
                     xtype: 'menuseparator'
                 },{
                    text: i18n('tTransparenz'),
                    iconCls: 'iconTransparency',
                    id:'groupLayerTransparentLabel',
                    border: false,
                    canActivate:false,
                    cls: 'font-menu'
                },
                Ext.create('GeoExt.slider.LayerOpacity', {
                    id:'groupLayerTransparentSlider',
                    iconCls:' ',
                    animate: false,
                    aggressive: false,
                    autoWidth: true,
                    autoHeight: true,
                    minValue: 0,
                    maxValue: 100,
                    listeners:{
                        change: function(slider, value, obj){
                            var layerMenuTextField = Ext.getCmp('groupLayerTransparentLabel');
                            layerMenuTextField.setText(i18n('tTransparenz') + ": " + value + "%");
                        }
                    }
                })
            ]
        });
        
        self.menuLayer = Ext.create('Ext.menu.Menu', {
            showSeparator: false,
            items: [
                 metadataAction,
                 zoomToExtendAction,
                 {
                    text: i18n('tTransparenz'),
                    iconCls: 'iconTransparency',
                    id:'layerTransparentLabel',
                    border: false,
                    canActivate:false,
                    cls: 'font-menu'
                },
                Ext.create('GeoExt.slider.LayerOpacity', {
                    id:'layerTransparentSlider',
                    iconCls:' ',
                    animate: false,
                    aggressive: false,
                    autoWidth: true,
                    autoHeight: true,
                    minValue: 0,
                    maxValue: 100,
                    listeners:{
                        change: function(slider, value, obj){
                            var layerMenuTextField = Ext.getCmp('layerTransparentLabel');
                            layerMenuTextField.setText(i18n('tTransparenz') + ": " + value + "%");
                        }
                    }
                })
            ]
        });
        
        var hoverActions = Ext.create('Ext.ux.HoverActions', {
            actions: [
              Ext.create('Ext.Button', {
                iconCls: 'iconMenu',
                tooltip: i18n('tOptionen'),
                disabled: true,
                handler: function(record,e) {
                    self.activeNode = record;
                    
                    if(self.menuNodeId == record.id){
                        self.menuNodeId = "";
                    }else{
                        self.menuNodeId = record.id;
                        if(record.get("layer")){
                            var layerMenuSlider;
                            // Layer menu
                            if(record.childNodes.length == 0){
                                layerMenuSlider = Ext.getCmp('layerTransparentSlider');
                                self.menuLayer.showAt([e.getTarget().offsetLeft ,e.getXY()[1] + e.getTarget().offsetHeight]);
                            }else{
                                layerMenuSlider = Ext.getCmp('groupLayerTransparentSlider');
                                self.menuGroupLayer.showAt([e.getTarget().offsetLeft ,e.getXY()[1] + e.getTarget().offsetHeight]);
                            }
                            
                            // Update slider
                            layerMenuSlider.setLayer(record.get("layer"));
                            var opacity = 1;
                            if(record.get("layer").opacity){
                                opacity = record.get("layer").opacity;
                            }
                            layerMenuSlider.setValue(0, opacity * 100);
                        }else{
                            // Service menu
                            self.menuService.showAt([e.getTarget().offsetLeft ,e.getXY()[1] + e.getTarget().offsetHeight]);
                        }
                    }
                }
            })]
        });

        
        // create the layer store
        this.layerStore = Ext.create('GeoExt.data.LayerStore', {
            map: this.map,
            initDir: GeoExt.data.LayerStore.MAP_TO_STORE
        });
        
        this.treeStore = Ext.create('Ext.data.TreeStore', {
              model: 'GeoExt.data.LayerTreeModel',
              root: {
                  text: i18n('tLayers'),
                  expanded: true
              },
              listeners: {
                    update: function(store, node, operation, modifiedFieldNames, eOpts ){
                            if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState") == true){
                                if(node.get("layer")){
                                    if(node.get("layer").params){
                                        var id = node.get("layer").params.LAYERS;
                                        var capabilitiesUrl = node.raw.service.capabilitiesUrl;
                                        
                                        // Save selected tree nodes to session
                                        for (var j = 0, count = self.selectedLayersByService.length; j < count; j++) {
                                            var selectedLayer = self.selectedLayersByService[j];
                                            if(id == selectedLayer.id && capabilitiesUrl == selectedLayer.capabilitiesUrl){
                                                var index = self.selectedLayersByService.indexOf(selectedLayer);
                                                if (index > -1) {
                                                    self.selectedLayersByService.splice(index, 1);
                                                }
                                                break;
                                            }
                                        }
                                        if(node.get("checked")){
                                            self.selectedLayersByService.push({
                                                id:id,
                                                capabilitiesUrl:capabilitiesUrl,
                                                checked:node.get("checked"),
                                                cls: node.get("cls") ? node.get("cls") : "x-tree-node-anchor",
                                                leaf:node.get("leaf")
                                                
                                            });
                                        }
                                    }
                                }
                            }
                            self.fireEvent('datachanged');
                    },
                    collapse: function(node){
                        var cls = '';
                        if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
                            if(node.get("layer")){
                                if(node.get("layer").getVisibility()){
                                    cls = cls + ' ' + 'x-tree-node-select';
                                }
                            }
                        }
                        
                        if(node.get("layer") == "" && node.get("checked") == null){
                            cls = cls + ' ' + 'x-tree-node-service';
                        }
                        
                        node.set('cls', cls);
                        // Save tree state by collapse node
                        if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState")){
                            if(node.isRoot() == undefined || node.isRoot() == false ){
                                var name = node.get("text");
                                if(node.raw.service){
                                    var capabilitiesUrl = node.raw.service.capabilitiesUrl;
                                    var isService = node.get("layer") ? false : true;
                                    var layer = node.get("layer") ? node.get("layer").params.LAYERS : "";
                                    
                                    for(var i = 0; i < self.treeState.length; i++){
                                        var state = self.treeState[i];
                                        if(name == state.name && capabilitiesUrl == state.capabilitiesUrl && isService + "" == state.isService && layer == state.layer){
                                            var index = self.treeState.indexOf(state);
                                            if (index > -1) {
                                                self.treeState.splice(index, 1);
                                            }
                                        }
                                    }
                                    
                                    if(node.hasChildNodes()){
                                        self.removeCollapseChildNodeEntry(node);
                                    }
                                    self.fireEvent('datachanged');
                                }
                            }
                        }
                    },
                    expand: function(node){
                        var cls = 'x-tree-expand';
                        if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
                            if(node.get("layer")){
                                if(node.get("layer").getVisibility()){
                                    cls = cls + ' ' + 'x-tree-node-select';
                                }
                            }
                        }
                        
                        if(node.get("layer") == "" && node.get("checked") == null){
                            cls = cls + ' ' + 'x-tree-node-service';
                        }
                        
                        node.set('cls', cls);
                        // Save tree state by expand node
                        if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState")){
                            if(node.isRoot() == undefined || node.isRoot() == false ){
                                if(node.raw.service){
                                    var name = node.get("text");
                                    var capabilitiesUrl = node.raw.service.capabilitiesUrl;
                                    var isService = node.get("layer") ? "false" : "true";
                                    var layer = node.get("layer") ? node.get("layer").params.LAYERS : "";
                                    
                                    var exist = false;
                                    
                                    for (var j = 0, count = self.treeState.length; j < count; j++) {
                                        var state = self.treeState[j];
                                        if(name == state.name && capabilitiesUrl == state.capabilitiesUrl && isService + "" == state.isService && layer == state.layer){
                                            exist = true;
                                            break;
                                        }
                                    }
                                    if(exist == false){
                                        self.treeState.push({
                                            name:name,
                                            capabilitiesUrl:capabilitiesUrl, 
                                            isService: isService, 
                                            layer: layer
                                        });
                                        self.fireEvent('datachanged');
                                    }
                                }
                            }
                        }
                    },
                    move: function(node, oldParent, newParent, index, nextNode) {
                        // Change layer order by drag and drop
                        if (oldParent == newParent) {
                            var serviceNodes = oldParent.childNodes;
                            var layers = [];
                            for (var i = 0, countI = serviceNodes.length; i < countI; i++) {
                                var serviceLayers = [];
                                var serviceNode = serviceNodes[i];
                                self.getLayersFromTree(serviceNode, serviceLayers, true);
                                layers.push(serviceLayers);
                            }
                        
                            var countLayers = 0;
                            if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceAddReversal") == false){
                                for (var j = 0, count = layers.length; j < count; j++) {
                                    var layerList = layers[j];
                                    layerList.forEach(function(layer) {
                                        countLayers = countLayers + 1;
                                        self.map.setLayerIndex(layer, countLayers);
                                    });
                                }
                            }else{
                                for (var j = layers.length - 1; j >= 0; j--) {
                                    var layerList = layers[j];
                                    layerList.forEach(function(layer) {
                                        countLayers = countLayers + 1;
                                        self.map.setLayerIndex(layer, countLayers);
                                    });
                                }
                            }
                        }
                    }
                }
          });
         
        // the layer tree
        this.layerTree = Ext.create('Ext.tree.Panel', {
            viewType: 'gx_custom_treeview',
            store: self.treeStore,
            autoScroll: true, 
            onlyServices: false,
            useArrows:true,
            lines: true,
            frame : false,
            rootVisible: false,
            allowNodeOver: true,
            viewConfig: de.ingrid.mapclient.Configuration.getSettings("defaultTreeDragDrop") ? { plugins: { ptype: 'treeviewdragdrop' } } : {},
            plugins:[hoverActions],
            buttonSpanElStyle:'width:20px;'
        });

        Ext.apply(this, {
            items: this.layerTree,
            bodyCssClass: 'background'
        });
        this.superclass.initComponent.call(this);
    },
    /**
     * Get the layer store
     * @return GeoExt.data.LayerStore instance
     */
    getLayerStore: function() {
        return this.layerStore;
    },
    /**
     * Check if a service is already contained in this panel
     * @param service de.ingrid.mapclient.frontend.data.Service instance
     * @return Boolean
     */
    containsService: function(service) {
        for(var i=0; i<this.services.items.length; i++){
            var tmpService = this.services.items[i];
            if(service.getCapabilitiesUrl().split("?")[0] == tmpService.getCapabilitiesUrl().split("?")[0]){
                var addServiceCap = service.getCapabilitiesUrl();
                var tmpServiceCap = tmpService.getCapabilitiesUrl();
                if(addServiceCap && tmpServiceCap){
                    addServiceCap = addServiceCap.replace("http://","").replace("https://","").toLowerCase().replace("version=", "").replace("service=wms", "").replace("request=getcapabilities", "");
                    tmpServiceCap = tmpServiceCap.replace("http://","").replace("https://","").toLowerCase().replace("version=", "").replace("service=wms", "").replace("request=getcapabilities", "");
                    if(addServiceCap == tmpServiceCap){
                        return true;
                    }
                }
            }else if(service.getDefinition() && tmpService.getDefinition()){
                var addServiceCap = service.getDefinition().href;
                var tmpServiceCap = tmpService.getDefinition().href;
                if(addServiceCap && tmpServiceCap){
                    addServiceCap = addServiceCap.replace("http://","").replace("https://","").toLowerCase().replace("version=", "").replace("service=wms", "").replace("request=getcapabilities", "");
                    tmpServiceCap = tmpServiceCap.replace("http://","").replace("https://","").toLowerCase().replace("version=", "").replace("service=wms", "").replace("request=getcapabilities", "");
                    if((addServiceCap == tmpServiceCap)
                        && (service.getDefinition().name == tmpService.getDefinition().name) 
                        && (service.definition["abstract"] == tmpService.definition["abstract"])){
                        return true;
                    }
                }
            }
        }
        return false;
    },
    /**
     * Add a service to the panel
     * @param service de.ingrid.mapclient.frontend.data.Service instance
     */
    addService: function(service, showService, initialAdd, expandNode, zoomToExtent, checkedLayers) {
        var self = this;
        if(service != undefined){
            var isLayerAddByParameter = false;
            
            if (this.containsService(service)) {
                //tell the user that the service is already loaded
                //de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.VIEW_ALREADY_LOADED_FAILURE);
                return;
            }
            
            // Select layer by URL-parameter
            if(typeof wms === 'string'){
                if(decodeURIComponent(wms) == service.capabilitiesUrl){
                    var serviceLayers = service.layers;
                    if(serviceLayers){
                        var serviceLayersItem = serviceLayers.items;
                        if(serviceLayersItem){
                            var parameterIdentifier = de.ingrid.mapclient.frontend.data.MapUtils.getParameter("ID");
                            if(parameterIdentifier != ""){
                                isLayerAddByParameter = self.checkLayerByParameter(parameterIdentifier, serviceLayersItem);
                            }
                        }
                    }
                }
            }
            
            var cntrPanel = Ext.getCmp('centerPanel');
            //we only have a center panel if we are in the full view
            if(typeof cntrPanel !== 'undefined' && showService){        
                de.ingrid.mapclient.Message.showInfo(i18n('tMsgServiceAdded'));
            }

            //check if the added service support our base EPSG,
            //if not warn the user but display the new service
            var srss = service.capabilitiesStore.data.items[0].data.srs;
            var supportsSRS = false;
            // srss holds the name of the supported projections
            for(srs in  srss){
                if(this.map.projection instanceof Object){
                    if(srs.toLowerCase() == this.map.projection.getCode().toLowerCase()){
                        supportsSRS = true;
                        break;
                    }
                }else{
                    if(srs.toLowerCase() == this.map.projection.toString().toLowerCase()){
                        supportsSRS = true;
                        break;
                    }
                }
            }
            // maybe the srs is not in the support list, but there is a bbox defined for it
            var srss = service.capabilitiesStore.data.items[0].data.bbox;
            if(!supportsSRS && srss){
                for(srs in  srss){
                    if(this.map.projection instanceof Object){
                        if(srs.toLowerCase() == this.map.projection.getCode().toLowerCase()){
                            supportsSRS = true;
                            break;
                        }
                    }else{
                        if(srs.toLowerCase() == this.map.projection.toString().toLowerCase()){
                            supportsSRS = true;
                            break;
                        }
                    }
                }
            }
            var serviceTitle = "no srs info available";
            if(service.definition){
                serviceTitle = service.definition.title;
            }
            if(!supportsSRS){
                de.ingrid.mapclient.Message.showEPSGWarning(this.map.projection,serviceTitle);
            }

            var serviceLayers = service.getLayers();
            var serviceRecords = service.capabilitiesStore.getRange();

            // add service layers to the store, if they are not already contained
            for (var i=0, count4=serviceRecords.length; i<count4; i++) {
                var serviceRecord = serviceRecords[i];
                var index = this.layerStore.findBy(function(record) {
                    var serviceLayer = serviceRecord.get('layer');
                    var layer = record.getLayer();
                    if(layer  && serviceLayer){
                        var isSame = de.ingrid.mapclient.frontend.data.Service.compareLayers(serviceLayer, layer);
                        if(isSame){
                            layer.options = Ext.apply(serviceLayer.options, layer.options);
                        }
                        return isSame;
                    }else{
                        return 0;
                    }
                });
                if (index == -1) {
                    this.layerStore.add([serviceRecord]);
                    // Create Legend for Services
                    var legendDialog = Ext.getCmp('legendDialog');
                    if(legendDialog == undefined){
                        var legendDialog = Ext.create('de.ingrid.mapclient.frontend.controls.LegendDialog', {
                        }).show();
                        legendDialog.hide();
                    }
                    
                }
            }
                        
            // add service node to the tree
            var appendChild = {
                text: serviceTitle,
                leaf: false,
                cls: 'x-tree-node-service',
                service: service,
                plugins: [{
                    ptype: 'gx_layercontainer',
                    leaf: false,
                    service: service,
                    loader: Ext.create('de.ingrid.mapclient.frontend.controls.ServiceTreeLoader', {
                        service: service,
                        initialAdd: initialAdd,
                        treeState: self.treeState,
                        map: self.map,
                        layerTree: self.layerTree,
                        panel: self,
                        selectedLayersByService: self.selectedLayersByService,
                        layersByURLService: self.layersByURLService,
                        checkedLayers: checkedLayers,
                        store: this.layerStore,
                        filter: function(record) {
                            var layer = record.get("layer");
                            if(layer == undefined){
                                layer = record.getLayer();
                            }
                            var layerBelongsToService = service.contains(layer);
                            return layerBelongsToService;
                        }
                    })
                }]
            };
            
            if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceAddReversal") == true){
                this.treeStore.tree.root.insertBefore(appendChild, this.layerTree.getRootNode().firstChild);
            }else{
                this.treeStore.tree.root.appendChild(appendChild);
            }

            this.services.add(service.getCapabilitiesUrl(), service);
            //if we are not in an initial state, then we fire the event which causes session write
            //and we zoom to extent, otherwise we load from session, therefore no writing needed and
            //we zoom to the extend of the wmc-session doc
            if(!initialAdd){
                this.fireEvent('datachanged');
            }

            bounds = self.bboxOfServiceExtent(service, supportsSRS);
            // do we get some data?
            if(bounds){
            //do we come from session or user interaction? zoom if user interaction
                if(initialAdd || isLayerAddByParameter){
                    if(wms == service.capabilitiesUrl && isLayerAddByParameter){
                        var firstVisibleLayer;
                        var serviceAddByParameterLayers = service.getLayers();
                        for (var i = 0, countI = serviceAddByParameterLayers.length; i < countI; i++) {
                            var serviceAddByParameterLayer = serviceAddByParameterLayers[i];
                            if(serviceAddByParameterLayer.visibility){
                                firstVisibleLayer = serviceAddByParameterLayer;
                                if(firstVisibleLayer.llbbox){
                                    break;
                                }
                            }
                        }
                        if(firstVisibleLayer){
                            var newProj = new OpenLayers.Projection(this.map.getProjection());
                            if(newProj){
                                if(firstVisibleLayer.bbox){
                                    var isAddedLayerBounds = firstVisibleLayer.bbox[newProj.getCode()];
                                    if(isAddedLayerBounds){
                                        if(isAddedLayerBounds.bbox){
                                            bounds = new OpenLayers.Bounds.fromArray(isAddedLayerBounds.bbox);
                                            
                                        }
                                    }else{
                                        for(var key in isAddedLayer.bbox){
                                            isAddedLayerBounds = firstVisibleLayer.bbox[key];
                                            bounds = new OpenLayers.Bounds.fromArray(isAddedLayerBounds.bbox);
                                            var oldProj = new OpenLayers.Projection(key);
                                            bounds.transform(oldProj, newProj);
                                            break;
                                        }
                                    }
                                    self.map.zoomToExtent(bounds);
                                    
                                    // zoom in if the content cannot be shown at this level
                                    if(firstVisibleLayer.minScale) {
                                        var minResolution = OpenLayers.Util.getResolutionFromScale(firstVisibleLayer.minScale, self.map.baseLayer.units);
                                        if (minResolution < self.map.resolution) {
                                            // probably due to a not so exact conversion of the scale
                                            // we have to decrease the scale, so that the layer is actually seen (INGRID-2235)
                                            self.map.zoomToScale(firstVisibleLayer.minScale * 0.9);
                                        }
                                    }
                                }
                            }
                            /*
                            bounds = OpenLayers.Bounds.fromArray(firstVisibleLayer.llbbox);
                            var oldProj = new OpenLayers.Projection("EPSG:4326");
                            var newProj = new OpenLayers.Projection(this.map.getProjection());
                            bounds.transform(oldProj, newProj);
                            this.map.zoomToExtent(bounds);
                            */
                        }
                    }
                }else{
                    if(zoomToExtent){
                        this.map.zoomToExtent(bounds);
                    }
                }
            }
            
            // Set vector layers to the end
            var vectorLayer;
            vectorLayer = self.map.getLayersBy("name", "Cosmetic")[0];
            if(vectorLayer){
                this.map.removeLayer(vectorLayer);
                this.map.addLayer(vectorLayer);
            }
            vectorLayer = self.map.getLayersBy("id", "bWaStrVector")[0];
            if(vectorLayer){
                this.map.removeLayer(vectorLayer);
                this.map.addLayer(vectorLayer);
            }
            vectorLayer = self.map.getLayersBy("id", "bWaStrVectorTmp")[0];
            if(vectorLayer){
                this.map.removeLayer(vectorLayer);
                this.map.addLayer(vectorLayer);
            }
            vectorLayer = self.map.getLayersBy("id", "bWaStrVectorMarker")[0];
            if(vectorLayer){
                this.map.removeLayer(vectorLayer);
                this.map.addLayer(vectorLayer);
            }
        }
    },
    checkLayerByParameter: function(parameter, layers){
        var self = this;
        var splitIdentifier = parameter.split("%23");
        var identifierValue = splitIdentifier[0];
        if(splitIdentifier.length > 1){
            identifierValue = splitIdentifier[1];
        }
        var isAddedVisibilityLayer = false;
        var isExist = false;
        
        for ( var i = 0, count = layers.length; i < count; i++) {
            var layer = layers[i];
            var identifiers = layer.identifiers;
            if(identifiers){
                for (var key in identifiers){
                    var value = identifiers[key];
                    if(identifierValue == value){
                        isExist = true;
                        layer.visibility = true;
                        self.layersByURLService.push(layer);
                        isAddedVisibilityLayer = true;
                    }
                }
            }
            if(isExist == false){
                layer.visibility = false;
            }
            isExist = false;
        }
        return isAddedVisibilityLayer; 
    },
    getLayersFromTree: function(node, layers, doExpand){
        var isExpanded = false;
        if(doExpand){
            if(node.expanded == false && node.leaf == false && node.childNodes.length == 0){
                isExpanded = true;
                node.expand();
            }
        }
        var layerNodes = node.childNodes;
        for (var i = 0, countI = layerNodes.length; i < countI; i++) {
            var layerNode = layerNodes[i];
            var layer = layerNode.get("layer");
            if(layer){
                layers.push(layer);
            }
            this.getLayersFromTree(layerNode, layers, doExpand);
        }
        if(isExpanded){
            isExpanded = false;
            node.collapse();
        }
    },
    /**
     * Remove a service from the panel
     * 
     * @param service
     *            de.ingrid.mapclient.frontend.data.Service instance
     */
    removeService: function(service, supressMsgs, activeNode) {
        var self = this;
        
        if (!this.containsService(service)) {
            return;
        }
        
        if (de.ingrid.mapclient.Configuration.getValue("wmsCapUrl") == service.capabilitiesUrl && (typeof supressMsgs == 'undefined' || !supressMsgs)) {
            var cntrPanel = Ext.getCmp('centerPanel');
            de.ingrid.mapclient.Message.showInfo(i18n('tMsgCannotRemoveBaselayer'));
        } else {
            var cntrPanel = Ext.getCmp('centerPanel');
            // we only have a center panel if we are in the full view
            if (typeof cntrPanel !== 'undefined' && !supressMsgs) {
                de.ingrid.mapclient.Message.showInfo(i18n('tMsgServiceRemoved'));
            }
            // remove service layers from the store by hand 
            // we dont use the remove method of the store anymore
            // because if we have a request open it keeps loading tiles
            // destroying each layers will impede further loading
            self.destroyLayersRecursively(activeNode);

            // remove service node from the tree, again we do this manually
            activeNode.remove();

            this.services.removeAtKey(service.getCapabilitiesUrl());
            this.fireEvent('datachanged');
        }
    },
    /**
     * Remove all services from the panel
     */
    removeAll: function(supressMsgs) {
        var self = this;
        this.services.each(function(service) {
            // find child node, remove it
            var childNodes = self.layerTree.getRootNode().childNodes;
            for (var i=0; i<childNodes.length; i++) {
                childNode = childNodes[i];
                var nodeService = childNode.raw.service;
                if (nodeService && nodeService.capabilitiesUrl == service.capabilitiesUrl) {
                    self.removeService(service, supressMsgs, childNode);
                }
            }
        });
    },
    /**
     * Get the list of activated services
     * @return Array of de.ingrid.mapclient.frontend.data.Service instances
     */
    getServiceList: function() {
        var services = [];
        var serviceNodes = this.layerTree.getRootNode().childNodes;
        for (var i=0, count=serviceNodes.length; i<count; i++) {
            var serviceNode = serviceNodes[i];
            services.push(serviceNode.raw.service);
        }
        return services;
    },
    /**
     * Open a window with meta info of a map layer
     * @param node Ext.tree.TreeNode instance
     */
    displayMetaData: function(node) {
        var self = this;
        var layer = null;
        var isServiceRequest = true;
        if(node.get("layer")){
            layer = node.get("layer");
            isServiceRequest = false;
        }

        var service = node.raw.service;
        if(service){
            //if we get a layer then this should be a LayerNode, otherwise we get a LayerContainer object
            if(!layer) {
                if(service.layers){
                    if(service.layers.items){
                        layer = service.layers.items[0];
                    }
                }
            }       

            var window = Ext.getCmp(node.id + "-metadata");
            if(window){
                window.close();
            }else{
                if(self.metadataWindowStart == 0){
                    self.metadataWindowStart = Ext.getCmp("centerPanel").x;
                }
                if(self.metadataWindowsCount % 10 == 0){
                    self.metadataWindowStart = Ext.getCmp("centerPanel").x + 50;
                }else{
                    self.metadataWindowStart = self.metadataWindowStart + 50;
                }
                self.metadataWindowsCount = self.metadataWindowsCount + 1;
                var metadataWindow = new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
                    id: node.id + "-metadata",
                    capabilitiesUrl: service.getCapabilitiesUrl(),
                    layer: layer.id,
                    x: self.metadataWindowStart,
                    y: Ext.getCmp("centerPanel").y
                });
                metadataWindow.show();
            }
        } else {
            de.ingrid.mapclient.Message.showInfo(i18n('tNoInformationAvailable'));
        }

    },
    /**
     * Display a opacity slider for the selected layer
     * @param layer The layer, for which to set the opacity
     */
    displayOpacitySlider: function(layer) {
        var self = this;
        this.opacityDialog = new de.ingrid.mapclient.frontend.controls.OpacityDialog({
            id: 'opacityDialog',
            layer: layer
        });
        this.opacityDialog.show();
    },
    /**
     * Check if a opacity slider dialog is currently opened and update it with the given layer
     * @param layer The layer, for which to set the opacity
     */
    updateOpacitySlider: function(layer) {
        if (this.opacityDialog && !this.opacityDialog.isDestroyed) {
            this.opacityDialog.close();
            this.displayOpacitySlider(layer);
        }
    },
    /**
     * Add KML to active service panel
     * @param title of KML
     * @param url of KML file
     */
    addKml: function(kmlArray) {
        var self = this;
        self.kmlArray = kmlArray;
        var layers = new Array();

        var kmlColor = ["#000000", "#BEBEBE", "#B03060", "#FF0000", "#00FF00", "#32CD32", "#556B2F", "#FFFF00",
                      "#000080", "#0000FF", "#A020F0", "#FF00FF", "#00F5FF", "#7FFFD4", "#EEE9E9", "#FFFFFF"];
        var countColor = 0;

        for ( var i = 0, count5 = kmlArray.length; i < count5; i++) {
            var addedKml = kmlArray[i];
            var kmlTitle = addedKml.title;
            var kmlUrl = addedKml.url;

            if(kmlTitle == undefined){
                var addedKmlTitle = addedKml[0];
                if(addedKmlTitle != undefined){
                    var addedKmlTitleValue = addedKmlTitle[1];
                    if(addedKmlTitleValue != undefined){
                        kmlTitle = addedKmlTitleValue;
                    }
                }
            }

            if(kmlUrl == undefined){
                var addedKmlUrl = addedKml[1];
                if(addedKmlUrl != undefined){
                    var addedKmlUrlValue = addedKmlUrl[1];
                    if(addedKmlUrlValue != undefined){
                        kmlUrl = addedKmlUrlValue;
                    }
                }
            }
            if(kmlTitle != undefined && kmlUrl != undefined){
                var styleMap = new OpenLayers.StyleMap({
                    'default':{
                         label : "${name}"
                    }
                });

                var rule = new OpenLayers.Rule({
                  title: kmlTitle,
                  symbolizer: {pointRadius: 3, fontSize: "11px", fontColor: "#000000",
                               labelAlign: "center", labelXOffset: 0,
                               labelYOffset: 10, fillColor: kmlColor[countColor], strokeColor: "#000000" }
                });
                styleMap.styles["default"].addRules([rule]);
                
                var layer = new OpenLayers.Layer.Vector(kmlTitle, {
                    strategies: [new OpenLayers.Strategy.Fixed()],
                    protocol: new OpenLayers.Protocol.HTTP({
                        url: kmlUrl,
                        format: new OpenLayers.Format.KML({
                            extractStyles: true, 
                            extractAttributes: true,
                            maxDepth: 2
                        })
                    }),
                    styleMap: styleMap
                });
                countColor = countColor + 1;
                if(countColor % 16 == 0){
                    countColor = 0;
                }

                var selectCtrl = new OpenLayers.Control.SelectFeature(layer);
                function createPopup(feature) {
                    var selection = feature;
                    popup = Ext.create('GeoExt.window.Popup', {
                        title: feature.data.name,
                        location: feature,
                        unpinnable:false,
                        width:400,
                        html: feature.data.description
                    });
                    // unselect feature when the popup
                    // is closed
                    popup.on({
                        close: function() {
                            selectCtrl.unselect(selection);
                        }
                    });
                    popup.show();
                }
                layer.events.on({
                    featureselected: function(e) {
                        createPopup(e.feature);
                    }
                });
                this.map.addControl(selectCtrl);
                selectCtrl.activate();

                layers.push(layer);
                this.map.addLayer(layer);
            }
        }

        var store = new GeoExt.data.LayerStore({
            layers: layers
        });

        var appendChild = {
                text: i18n('tZeigePunktkoordinaten'),
                leaf: false,
                cls: 'x-tree-node-service',
                plugins: [{
                    ptype: 'gx_layercontainer',
                    leaf: false,
                    loader: Ext.create('de.ingrid.mapclient.frontend.controls.ServiceTreeLoader', {
                        initialAdd: true,
                        treeState: self.treeState,
                        map: self.map,
                        layerTree: self.layerTree,
                        panel: self,
                        selectedLayersByService: self.selectedLayersByService,
                        layersByURLService: self.layersByURLService,
                        store: store
                    })
                }]
            };

        if(this.layerTree != null){
            this.layerTree.getRootNode().appendChild(appendChild);
        }
    },
    removePointCoordinatesLayer: function(activeNode) {
        var layerId = activeNode.get("layer").id;
        var parentNode = activeNode.parentNode;

        // Remove layer from map
        if(this.layerStore.data){
            if(this.layerStore.data.items){
                var items = this.layerStore.data.items;
                var index = 0;
                for (var i=0, count6=items.length; i<count6; i++) {
                    var item = items[i];
                    var itemId = item.id;
                    if(itemId){
                        if(itemId == layerId){
                            index = i;
                            break;
                        }
                    }
                }
                this.layerStore.remove(this.layerStore.getAt(index));
            }
        }

        // Remove from tree
        if(this.layerTree){
            if(this.layerTree.getRootNode()){
                var childNodesTree = this.layerTree.getRootNode().childNodes;
                var indexTree = 0;
                for (var i=0, count7=childNodesTree.length; i<count7; i++) {
                    var childNodeTree = childNodesTree[i];
                    if(childNodeTree.text == parentNode.text){
                        indexTree = i;
                        break;
                    }
                }
                var selectedService = this.layerTree.getRootNode().childNodes[indexTree];
                var selectedServiceLayers = selectedService.childNodes;
                for (var i=0, count8=selectedServiceLayers.length; i<count8; i++) {
                    var selectedServiceLayer = selectedServiceLayers[i];
                    if(selectedServiceLayer.layerStore.data.items){
                        var serviceTreeItems = selectedServiceLayer.layerStore.data.items;
                        var indexServiceTree = 0;
                        for (var j=0, count9=serviceTreeItems.length; j<count9; j++) {
                            var serviceTreeItem = serviceTreeItems[i];
                            var itemId = serviceTreeItem.id;
                            if(itemId){
                                if(itemId == layerId){
                                    indexServiceTree = i;
                                    break;
                                }
                            }
                        }
                        selectedServiceLayer.layerStore.remove(selectedServiceLayer.layerStore.getAt(indexServiceTree));
                        break;
                    }
                }
                if(selectedService.childNodes.length == 0){
                    this.layerTree.getRootNode().removeChild(selectedService);
                }
            }
        }

        // Remove from session
        if(this.kmlArray){
            var title = activeNode.get("layer").name;
            var url = activeNode.get("layer").url;
            for (var i=0, count10=this.kmlArray.length; i<count10; i++) {
                var kml = this.kmlArray[i];
                if(title == kml.title && url == kml.url){
                    this.kmlArray.remove(kml);
                    break;
                }
            }
        }
        this.fireEvent('datachanged');
    },
    removePointCoordinatesService: function(activeNode) {
        // Remove from map
        if(activeNode.get("plugins")){
            if(activeNode.get("plugins")[0].loader.store.data.items){
                for (var i=0, count1=activeNode.get("plugins")[0].loader.store.data.items.length; i<count1; i++) {
                    var childNode = activeNode.get("plugins")[0].loader.store.data.items[i];
                    if(childNode){
                        var layerId = childNode.id;
                        if(this.layerStore.data){
                            if(this.layerStore.data.items){
                                var items = this.layerStore.data.items;
                                var index = 0;
                                for (var j=0, count2=items.length; j<count2; j++) {
                                    var item = items[j];
                                    var itemId = item.id;
                                    if(itemId){
                                        if(itemId == layerId){
                                            index = j;
                                            this.layerStore.remove(this.layerStore.getAt(index));
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Remove from tree
            activeNode.removeAll();
            this.layerTree.getRootNode().removeChild(activeNode);

            // Remove from session
            if(this.kmlArray){
                for (var i = 0; i < this.kmlArray.length; i++) {
                    this.kmlArray.splice(i);
                    i--;
                }
            }
            this.fireEvent('datachanged');
        }
    },
    /**
     * we set the map to the largest bounding box its layers contain 
     * but first we check if our layers support our base projection 
     * @param {} service
     * @param {} supportsSRS
     * @return {}
     */
    bboxOfServiceExtent: function(service, supportsSRS) {
        var self = this;
        var bbox = null;
        var srs;
        if(self.map.projection instanceof OpenLayers.Projection){
            srs = self.map.projection.projCode;
        }else{
            srs = self.map.projection;
        }
        if(service){
            var bboxes = service.capabilitiesStore.data.items;  
            var mapProjection = de.ingrid.mapclient.frontend.data.MapUtils
                    .getMapProjection(self.map);
            // default case, projection is 4326 and the service defines a lonlatbox
            // we just take it as base zoomextent, should cover most cases
            if (mapProjection.projCode == "EPSG:4326"
                    && service.capabilitiesStore.data.items[0].data.llbbox) {
                var bbox = service.capabilitiesStore.data.items[0].data.llbbox;
                        var bounds = new OpenLayers.Bounds.fromArray(bbox);
                        return bounds;
                }   

            //our service supports the map projection but the map is not in the default projection
            // we look for bboxes, which might be defined in the service
            if (supportsSRS && mapProjection.projCode != "EPSG:4326") {


                for (var i = 0; i < bboxes.length; i++) {

                    if (typeof(bboxes[i].data.bbox[srs]) !== 'undefined') {
                        if (bboxes[i].data.bbox[srs].bbox) {
                            bbox = bboxes[i].data.bbox[srs].bbox;
                            var bounds = new OpenLayers.Bounds.fromArray(bbox);
                            return bounds;
                        }
                    }
                }
            }
            // at this point we didnt get a bbox with our map projection so we have to transform 
            // any bbox we get and try to fit it

            for (var i = 0; i < bboxes.length; i++) {
                if (bboxes[i].data.bbox) {
                    for (var srsIn in bboxes[i].data.bbox){
                        bbox = bboxes[i].data.bbox[srsIn].bbox;
                        projMap = new OpenLayers.Projection(srs);
                        var projLayer = new OpenLayers.Projection(srsIn);
                        var bounds = new OpenLayers.Bounds.fromArray(bbox);
                        bounds.transform(projLayer, projMap);
                        return bounds;  
                    }
                }
            }
        }
    },
    /**
     * Extract Bounding Box from Layer. Try to get it first from bbox and then from llbbox.
     */
    bboxOfLayerExtent: function(layer) {
        var bbox = null;
        var srs;
        if(this.map.projection instanceof OpenLayers.Projection){
            srs = this.map.projection.projCode;
        }else{
            srs = this.map.projection;
        }
        var bounds=null;
        
        // check for WMS Layers
        if (layer instanceof OpenLayers.Layer.WMS) {
            //check if our layers upport the map projection
            bounds = this._getBoundingBoxFromLayer(layer, srs);
        } else {
            // NON WMS Layer (KML Layer)
            var srsIn = layer.projection.projCode;
            bounds = layer.maxExtent;
            if (srsIn != srs) {
                var projMap = new OpenLayers.Projection(srs);
                var projLayer = new OpenLayers.Projection(srsIn);
                bounds.transform(projLayer, projMap);
            }
        }
        return bounds;
    },
    /**
     * Extract Bounding Box from Layer. Try to get it first from bbox and then from llbbox.
     */
    _getBoundingBoxFromLayer: function(layer, currentProjection) {
        if(layer.bbox){
            if(layer.bbox[currentProjection]){
                bbox = layer.bbox[currentProjection].bbox;
                return new OpenLayers.Bounds.fromArray(bbox);
            } else {
                // try to get bounding box from LatLonBoundingBox property
                var llbbox = layer.llbbox;
                if (llbbox) {
                    var bounds = new OpenLayers.Bounds.fromArray(llbbox);
                    var projMap = new OpenLayers.Projection(currentProjection);
                    var projLayer = new OpenLayers.Projection("EPSG:4326"); // WGS84
                    bounds.transform(projLayer, projMap);
                    return bounds;
                }
            }
        }
        return layer.maxExtent;
    },
    /**
     * Check all layers of a service for the global bounding box
     */
    getBoundsFromSubLayers: function(service, node) {
        var srs;
        if(this.map.projection instanceof OpenLayers.Projection){
            srs = this.map.projection.projCode;
        }else{
            srs = this.map.projection;
        }
        var maxBounds = null;
        var self = this;
        var layers = []; 
        if(service){
            layers = service.capabilitiesStore.data.items;
        }else{
            if(node.getData().plugins && node.getData().plugins.length > 0){
                var plugins = node.getData().plugins[0];
                if(plugins.loader){
                    if(plugins.loader.store){
                        var range = plugins.loader.store.getRange();
                        for (var i = 0; i < range.length; i++) {
                            var item = range[i];
                            layers.push(item.raw);
                        }
                    }
                }
            }
        }
        
        Ext.each(layers, function(layer) {
            var bounds = self._getBoundingBoxFromLayer(layer, srs);
            if (bounds && maxBounds === null) maxBounds = bounds;
            else if (bounds) maxBounds.extend(bounds);
        });
        return maxBounds;
    },
    /**
     * Check all layers of a service for the minScale attribute
     */
    getMinScaleFromSubLayers: function(service, node) {
        var minScale = null;
        var layers = []; 
        if(service){
            layers = service.capabilitiesStore.data.items;
        }else{
            if(node.getData().plugins && node.getData().plugins.length > 0){
                var plugins = node.getData().plugins[0];
                if(plugins.loader){
                    if(plugins.loader.store){
                        var range = plugins.loader.store.getRange();
                        for (var i = 0; i < range.length; i++) {
                            var item = range[i];
                            layers.push(item);
                        }
                    }
                }
            }
        }
        
        Ext.each(layers, function(layer) {
            if (minScale === null || minScale < layer.data.minScale) 
                minScale = layer.data.minScale;
            
        });
        return minScale;
    },
    expandNode: function (node, fromTreeState){
        var self = this;
        
        if(fromTreeState){
            if(node.raw.service){
                if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState")){
                    for (var i = 0, count = this.treeState.length; i < count; i++) {
                        var state = this.treeState[i];
                        var name = node.text;
                        var capabilitiesUrl = node.raw.service.capabilitiesUrl;
                        var isService = node.get("layer") ? "false" : "true";
                        var layer = node.get("layer") ? node.get("layer").params.LAYERS : "";
                        
                        if(name == state.name && capabilitiesUrl == state.capabilitiesUrl && isService + "" == state.isService && layer == state.layer){
                            node.expand();
                            break;
                        }
                    }
                    if(node.hasChildNodes()){
                        for (var j = 0, count = node.childNodes.length; j < count; j++) {
                            var childNode = node.childNodes[j];
                            self.expandNode(childNode, true);
                        }
                    }
                }
            }
        }else{
            node.expand();
            if(node.hasChildNodes()){
                for (var j = 0, count = node.childNodes.length; j < count; j++) {
                    var childNode = node.childNodes[j];
                    self.expandNode(childNode, false);
                }
            }
        }
    },
    removeCollapseChildNodeEntry: function (node){
        var self = this;
        
        for(var i = 0; i < node.childNodes.length; i++){
            var childNode = node.childNodes[i];
            var name = childNode.text;
            var capabilitiesUrl = childNode.raw.service.capabilitiesUrl;
            var isService = childNode.get("layer") ? "false" : "true";
            var layer = childNode.get("layer") ? childNode.get("layer").params.LAYERS : "";
            
            for(var j = 0; j < self.treeState.length; j++){
                var state = self.treeState[j];
                if(name == state.name && capabilitiesUrl == state.capabilitiesUrl && isService + "" == state.isService && layer == state.layer){
                    var index = self.treeState.indexOf(state);
                    if (index > -1) {
                        self.treeState.splice(index, 1);
                    }
                }
            }
            
            childNode.collapse();
            
            if(childNode.hasChildNodes()){
                self.removeCollapseChildNodeEntry(childNode);
            }
        }
    },
    /**
     * disable/enable layer nodes recursively, based on the fact if they support our current zoomlevel
     * @param {} node
     * @param {} scale
     */
    checkScaleRecursively : function(node, scale){
        // Used on OpenLayers.Map.setCenter function
        var self = this;
        node.eachChild(function(n) {
            var layer = n.get("layer");
            if(layer){
                if(layer.inRange != undefined){
                    if(layer.inRange == false){
                        var cls = 'x-tree-node-disabled';
                        if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
                            if(layer.visibility && n.childNodes.length > 0 ){
                                cls = cls + ' x-tree-node-select-disabled';
                            }
                        }
                        if(n.get("x-tree-node-disabled")){
                            cls = cls + ' x-tree-expand';
                        }
                        n.set('cls', cls);
                    }else{
                        var cls = '';
                        if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
                            if(n.get("cls") != "x-tree-node-select")
                                cls = cls + '';
                            if((layer.visibility && n.childNodes.length > 0 ) || n.get("cls") == "x-tree-node-select-disabled"){
                                cls = cls + ' x-tree-node-select';
                            }
                        }
                        if(n.get("expanded")){
                            cls = cls + ' x-tree-expand';
                        }
                        n.set('cls', cls);
                    }
                }
            }
            if(n.hasChildNodes){
                self.checkScaleRecursively(n, scale);
            }
            self.expandNode(n, true);
        });
    },
    /**
     * destroy layers by hand so that they dont keep loading when removed
     * @param {} node
     */
    destroyLayersRecursively: function(node){
        var self = this;

        node.eachChild(function(n) {
            var layer = n.data.layer;
            if(layer){
                if(n.hasChildNodes){
                    self.destroyLayersRecursively(n);
                }
                layer.destroy();
            }
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
    }
});
