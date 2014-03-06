/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class ActiveServicesPanel shows the activated services.
 * The panels fires a 'datachanged' event, if the list of services changed.
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel = Ext.extend(Ext.Panel, {
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
	metadataWindowStart: 0
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.initComponent = function() {

	var self = this;
	
	// add the datachanged event
	this.addEvents({
		datachanged: false
	});

	// create the layer store
	this.layerStore = new GeoExt.data.LayerStore({
		map: this.map,
		// add field "styles" to reader, to copy the styles to the layer records
		reader: new GeoExt.data.LayerReader({fields:[{name: "styles"}]}),
		initDir: GeoExt.data.LayerStore.MAP_TO_STORE
	});

	// zoom to layer extent
	var bbox = null;
	
	var deleteAction = {
        text: i18n('tLoeschen'),
        iconCls: 'iconRemove',
        tooltip: i18n('tZumEntfernenErstEinenDienstMarkieren'),
        handler: function(){
        	if (self.activeNode) {
				if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState")){
					// Remove tree state
					for(var i = 0; i < self.treeState.length; i++){
						var state = self.treeState[i];
						if(state.capabilitiesUrl  == self.activeNode.attributes.service.capabilitiesUrl ){
							self.treeState.remove(state);
						}
					}
				}
				
				// Remove selected Layers
				for(var i = 0; i < self.selectedLayersByService.length; i++){
					var layer = self.selectedLayersByService[i];
					if(layer.capabilitiesUrl == self.activeNode.attributes.service.capabilitiesUrl){
						self.selectedLayersByService.remove(layer);
						i--;
					}
				}
				
				if(self.activeNode.attributes.service != undefined){
					self.removeService(self.activeNode.attributes.service, null, self.activeNode);
				}else if (self.activeNode.layer != undefined){
					// Remove "Zeige Punktkoordinaten" layers
					if (self.activeNode.layer.id != undefined){
						self.removePointCoordinatesLayer(self.activeNode);
					}
				}else{
					// Remove "Zeige Punktkoordinaten" service
					self.removePointCoordinatesService(self.activeNode);
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
				//check if we have a service(root) node 
				if(node instanceof GeoExt.tree.LayerContainer){
					bounds = self.bboxOfServiceExtent(node.attributes.service)
					//minScale = self.activeNode.layer.minScale;
					if (!bounds) bounds = self.getBoundsFromSubLayers(node.attributes.service);
					minScale = self.getMinScaleFromSubLayers(node.attributes.service);
				}else{
					bounds = self.bboxOfLayerExtent(node.attributes)
					// every layer has a minScale, even if not found in getCapabilities-Document
					// in that case the minScale is calculated by the resolution of the map (see Layer.js:940) 
					minScale = node.layer.minScale;
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
		handler: function() {
			var node = self.activeNode;
			if(node.attributes.cls != "x-tree-node-select"){
				if (node.attributes.cls != "x-tree-node-disabled" && node.attributes.cls != "x-tree-node-select-disabled") {
					var layer = node.layer;
					var isParentsSelect = self.isParentsSelect(node);
					if(isParentsSelect){
						layer.setVisibility(true);
					}
					node.setCls('x-tree-node-select');
					node.getUI().toggleCheck(true);
				}
			}else{
				var layer = node.layer;
				layer.setVisibility(false);
				node.setCls('x-tree-node-anchor');
			}
		}
    };
	
	self.menuService = new Ext.menu.Menu({
		showSeparator: false,
		width: '150px',
	    items: [
	        deleteAction,
	        metadataAction,
	        zoomToExtendAction
	    ]
	});
	
	self.menuGroupLayer = new Ext.menu.Menu({
		showSeparator: false,
		width: '150px',
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
	     	new GeoExt.LayerOpacitySlider({
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
	
	self.menuLayer = new Ext.menu.Menu({
		showSeparator: false,
		width: '150px',
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
	     	new GeoExt.LayerOpacitySlider({
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
	
	var hoverActions = new Ext.ux.HoverActions({
		actions: [new Ext.Button({
	        iconCls: 'iconMenu',
	        tooltip: i18n('tOptionen'),
	        disabled: true,
	        handler: function(node,e) {
	        	if(self.menuNodeId == node.id){
	        		self.menuNodeId = "";
	        	}else{
	        		self.menuNodeId = node.id;
	        		self.activeNode = node;
		        	if(node.attributes.iconCls){
		        		var layerMenuSlider;
		        		// Layer menu
		        		if(node.leaf){
		        			layerMenuSlider = Ext.getCmp('layerTransparentSlider');
		        			self.menuLayer.showAt([e.getTarget().offsetLeft ,e.getXY()[1] + e.getTarget().offsetHeight]);
		        		}else{
		        			layerMenuSlider = Ext.getCmp('groupLayerTransparentSlider');
		        			self.menuGroupLayer.showAt([e.getTarget().offsetLeft ,e.getXY()[1] + e.getTarget().offsetHeight]);
		        		}
	    				
	    				// Update slider
	    				layerMenuSlider.setLayer(node.layer);
	    				var opacity = 1;
	    				if(node.layer.opacity){
	    					opacity = node.layer.opacity;
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
	
	// the layer tree
	this.layerTree = new Ext.tree.TreePanel({
		id:"layertree",
		root: new Ext.tree.AsyncTreeNode({
			nodeType: 'async',
			text: i18n('tLayers'),
			expanded: true,
			children: []
		}),
		cls: 'x-tree-noicon',
		autoScroll: true, 
		useArrows:true,
        lines: false,
        frame : false,
		rootVisible: false,
		enableDD: de.ingrid.mapclient.Configuration.getSettings("defaultTreeDragDrop"),
		plugins:[hoverActions],
		buttonSpanElStyle:'width:12px;',
		listeners: {
	        click: function(node,e) {
	        	if(node.hasChildNodes()){
	        		if(node.isExpanded()){
	        			node.collapse();
	        		}else{
	        			node.expand();
	        		}
	        	}
	        }
	    }
	});

	var self = this;
	
	if (de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false) {
		this.layerTree.on('beforeappend', function(tree, parent, node){
			if(node.attributes.layer){
				var id = node.attributes.layer.params.LAYERS;
				var capabilitiesUrl = node.attributes.service.capabilitiesUrl;
				
				for (var j = 0, count = self.selectedLayersByService.length; j < count; j++) {
				    var selectedLayer = self.selectedLayersByService[j];
					if(id == selectedLayer.id && capabilitiesUrl == selectedLayer.capabilitiesUrl){
						node.attributes.checked=true;
						if(selectedLayer.cls){
							node.setCls(selectedLayer.cls);
						}
					}
				}
				// check if node add by url layer and select parent node
				if(self.layersByURLService){
					for (var i = 0, count = self.layersByURLService.length; i < count; i++) {
						var urlLayer = self.layersByURLService[i];
						var urlLayerId = urlLayer.params.LAYERS;
						if(urlLayer.visibility){
							if(id == urlLayerId){
								if(parent.attributes.checked != true){
									parent.getUI().toggleCheck(true);
									parent.attributes.layer.setVisibility(false);
								}
								break;
							}
						}
					}
				}
			}
		});
	}
	
	if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState")){
		this.layerTree.on('beforeexpandnode', function(node){
			if(node.isRoot == undefined || node.isRoot == false ){
				var name = node.text;
				var capabilitiesUrl = node.attributes.service.capabilitiesUrl;
				var isService = node.layer ? "false" : "true";
				var layer = node.layer ? node.layer.params.LAYERS : "";
				
				var exist = false;
				
				for (var j = 0, count = self.treeState.length; j < count; j++) {
					var state = self.treeState[j];
					if(name == state.name && capabilitiesUrl == state.capabilitiesUrl && isService + "" == state.isService && layer == state.layer){
						exist = true;
						break;
					}
				}
				if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpand") == false){
					self.checkScaleRecursively(node, self.map.getScale());
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
		});
		
		this.layerTree.on('beforecollapsenode', function(node){
			if(node.isRoot == undefined || node.isRoot == false ){
				var name = node.text;
				var capabilitiesUrl = node.attributes.service.capabilitiesUrl;
				var isService = node.layer ? false : true;
				var layer = node.layer ? node.layer.params.LAYERS : "";
				
				for(var i = 0; i < self.treeState.length; i++){
					var state = self.treeState[i];
					if(name == state.name && capabilitiesUrl == state.capabilitiesUrl && isService + "" == state.isService && layer == state.layer){
						self.treeState.remove(state);
					}
				}
				
				if(node.hasChildNodes()){
					self.removeCollapseChildNodeEntry(node);
				}
				self.fireEvent('datachanged');
			}
		});
	}
	
	// Create Legend for Services
	var legendDialog = new de.ingrid.mapclient.frontend.controls.LegendDialog({
		activeServicesPanel: self
	});
	legendDialog.hide();
	
	Ext.apply(this, {
		items: this.layerTree,
		bodyCssClass: 'background'
	});
	de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.superclass.initComponent.call(this);
};

/**
 * Get the layer store
 * @return GeoExt.data.LayerStore instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.getLayerStore = function() {
	return this.layerStore;
};

/**
 * Check if a service is already contained in this panel
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 * @return Boolean
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.containsService = function(service) {
	return this.services.containsKey(service.getCapabilitiesUrl());
};

/**
 * Add a service to the panel
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.addService = function(service, showService, initialAdd, expandNode, zoomToExtent) {
	var self = this;
	if(service != undefined){
		var isLayerAddByParameter = false;
		
		if (this.containsService(service)) {
			//tell the user that the service is already loaded
			//de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.VIEW_ALREADY_LOADED_FAILURE);
			return;
		}
		
		if(typeof wms === 'string'){
			if(wms == service.capabilitiesUrl){
				var serviceLayers = service.layers;
				if(serviceLayers){
					var serviceLayersItem = serviceLayers.items;
					if(serviceLayersItem){
						// Select layer by URL-parameter
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
		if(!supportsSRS && srss)
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
		var serviceTitle = "no srs info available";
		if(service.definition)
		serviceTitle = service.definition.title
		if(!supportsSRS)
		de.ingrid.mapclient.Message.showEPSGWarning(this.map.projection,serviceTitle);


		var serviceLayers = service.getLayers();
		var serviceRecords = this.layerStore.reader.readRecords(serviceLayers).records;

		// add service layers to the store, if they are not already contained
		for (var i=0, count4=serviceRecords.length; i<count4; i++) {
			var serviceRecord = serviceRecords[i];
			var index = this.layerStore.findBy(function(record) {
				var serviceLayer = serviceRecord.get('layer');
				var layer = record.get('layer');
				return de.ingrid.mapclient.frontend.data.Service.compareLayers(serviceLayer, layer);
			});
			if (index == -1) {
				this.layerStore.add([serviceRecord]);
			}
		}

		// Check visibility of added layers by parameter 
		if(isLayerAddByParameter){
			self.checkLayerVisibility(serviceRecords);
		}
		
		// add service node to the tree
		var node = new GeoExt.tree.LayerContainer({
			text: serviceTitle,
			layerStore: this.layerStore,
			leaf: false,
			expanded: false,
			service: service,
			loader: new de.ingrid.mapclient.frontend.controls.ServiceTreeLoader({
				filter: function(record) {
					var layer = record.get("layer");
					var layerBelongsToService = service.contains(layer);
					return layerBelongsToService;
				},
				onCheckChangeCallback : function (node, checked) {
					this.expand(true);
					var checkedOnce = false;
					if(self.isCheckedByCheckedLayers){
						// Single layer selection by checkedLayer (read from config) 
						self.isCheckedByCheckedLayers = false;
					}else{
						// Layer selection checked child layers too (by mouse click)
						node.eachChild(function(n) {
					    	// check everything but the first layer, which is our baselayer
					    	if(!checkedOnce && de.ingrid.mapclient.Configuration.getValue('layers')[0].name == n.text ){
					    		checkedOnce = true;
					    		// we dont check/uncheck our base layer but we have to pass the checked command to its child nodes
					    		if(n.hasChildNodes){
					    			n.eachChild(function(n){
					    			n.getUI().toggleCheck(checked);
					    			});
					    		}
					    	} else {
					    		if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection")){
						    		n.getUI().toggleCheck(checked);
					    		}
					    	}
					    });
					}
					
					if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
						if(self.activeNode){
							var isEnable = self.activeNode.attributes.checked;
							if(self.activeNode){
								if(self.activeNode.layer){
									if(self.activeNode.layer.params){
										if(self.activeNode.layer.params.LAYERS){
											if(self.activeNode.layer.params.LAYERS.indexOf("INGRID-") > -1){
												isEnable = false;
											}
										}else{
											isEnable = false;
										}
									}
								}
							}
							
							self.enableGroupLayerButton(self.activeNode, isEnable);
						}
						
						var id = node.layer.params.LAYERS;
						var capabilitiesUrl = node.attributes.service.capabilitiesUrl;
						
						for (var j = 0, count = self.selectedLayersByService.length; j < count; j++) {
							var selectedLayer = self.selectedLayersByService[j];
							if(id == selectedLayer.id && capabilitiesUrl == selectedLayer.capabilitiesUrl){
								self.selectedLayersByService.remove(selectedLayer);
								break;
							}
						}
						
						if(checked){
							self.selectedLayersByService.push({
								id:id,
								capabilitiesUrl:capabilitiesUrl,
								checked:checked,
								cls:node.attributes.cls ? node.attributes.cls : "x-tree-node-anchor",
								leaf:node.leaf
								
							});
						}
						self.fireEvent('datachanged');
					}
				}
			})
		});

		//on checkchange(we check the service) we expand the nodes of the service and check all layers
		node.on('checkchange', function(node, checked) {
			this.expand(true);
			var checkedOnce = false;
			node.eachChild(function(n) {
		    	// check everything but the first layer, which is our baselayer
		    	if(!checkedOnce && de.ingrid.mapclient.Configuration.getValue('layers')[0].name == n.text ){
		    		checkedOnce = true;
					// we dont check/uncheck our base layer but we have to pass the checked command to its child nodes
		    		if(n.hasChildNodes){
		    			n.eachChild(function(n){
		    			n.getUI().toggleCheck(checked);
		    			});
		    		}
		    	} else {
		    		if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection")){
		    			n.getUI().toggleCheck(checked);
		    		}
		    	}
		    });
		});
		
		if(de.ingrid.mapclient.Configuration.getSettings("defaultTreeDragDrop")){
			node.on('move', function(tree, thisNode, oldParent, newParent, index, nextNode) {
				if (oldParent == newParent) {
					var serviceNodes = tree.root.childNodes;
					var layers = [];
					for (var i = 0, countI = serviceNodes.length; i < countI; i++) {
					 	var serviceNode = serviceNodes[i];
					 	self.getLayersFromTree(serviceNode, layers);
					}
				
					for (var j = 0, count = layers.length; j < count; j++) {
						var layer = layers[j];
						self.map.raiseLayer(layer, layers.length);
					}
             	}
			});
		}
		
		
		this.layerTree.root.appendChild(node);

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
		//we need to expand the nodes otherwise the root node doesnt know its children
		if(expandNode){
			node.expand();
			self.expandNode(node, false);
		}

		// Select layer by checkedLayers only on add service.
		// After mapclient reload load don't select layers by checkedLayers
		if(!initialAdd){
			//we check the services which are meant to be checked by default
			var wmsServices = de.ingrid.mapclient.Configuration.getValue("wmsServices");
			for(var i = 0; i < wmsServices.length; i++){
				if(service.capabilitiesUrl == wmsServices[i].capabilitiesUrl){
					var cl = wmsServices[i].checkedLayers;
					if(cl){
						for(var j = 0; j < cl.length; j++){
							var k = 0;
							// Set boolean to note checkedLayers selection (single selection)
							self.isCheckedByCheckedLayers = true;
							self.checkRecursively(cl[j],node);
						}
					}
					break;
				}
			}
		}
		
		// 
		var serviceNodes = this.layerTree.root.childNodes;
		var layers = [];
		for (var i = 0, countI = serviceNodes.length; i < countI; i++) {
		 	var serviceNode = serviceNodes[i];
		 	self.getLayersFromTree(serviceNode, layers);
		}
	
		for (var j = 0, count = layers.length; j < count; j++) {
			var layer = layers[j];
			self.map.raiseLayer(layer, layers.length);
		}
		// Set vector layers to the end
		if(de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable") == true){
			if(this.map){
				var cosmeticLayer;
				var layers = this.map.layers;
				for (var i = 0, count = layers.length; i < count; i++) {
					var layer = layers[i];
					if(layer){
						if(layer.name){
							if(layer.name == "Cosmetic"){
								cosmeticLayer = layer;
								this.map.removeLayer(layer);
							}
						}
					}
				}
				if(cosmeticLayer){
					this.map.addLayer(cosmeticLayer);
				}
			}
		}
	}
};

/**
 * check layer nodes recursively, since we implemented tree view in the panel
 * this method checks wether our childnodes need to be checked and since we
 * have a tree it is done recursively now
 * @param {} layerName
 * @param {} node
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.checkRecursively = function(layerName, node){
	var self = this;
	node.eachChild(function(n) {
		if (layerName == n.layer.params.LAYERS)
			n.getUI().toggleCheck(true);
		if (n.hasChildNodes) {
			n.expand();
			self.checkRecursively(layerName, n);
		}
	});
			        
}

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.checkLayerByParameter = function(parameter, layers){
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
}

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.checkLayerVisibility = function(records){
	var self = this;
	if(this.layerStore){
		if(this.layerStore.data){
			var items = this.layerStore.data.items; 
			if(items){
				for(var i = 0, count = items.length; i < count; i++) {
					var item = items[i];
					if(item){
						if(item.data){
							var layer = item.data.layer; 
							if(layer){
								for(var j = 0, countJ = records.length; j < countJ; j++) {
									var record = records[j];
									if(record.data){
										var recordLayer = record.data.layer;
										if(recordLayer){
											var isSame = de.ingrid.mapclient.frontend.data.Service.compareLayers(layer, recordLayer);
											if(isSame){
												layer.visibility = recordLayer.visibility;
												self.layersByURLService.push(layer);
												break;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.getLayersFromTree = function(node, layers){
	var layerNodes = node.childNodes;
	for (var i = 0, countI = layerNodes.length; i < countI; i++) {
		var layerNode = layerNodes[i];
		var layer = layerNode.layer;
		if(layer){
			layers.push(layer);
		}
		this.getLayersFromTree(layerNode, layers);
	}
}

/**
 * Remove a service from the panel
 * 
 * @param service
 *            de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removeService = function(
		service, supressMsgs, activeNode) {
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


		this.services.removeKey(service.getCapabilitiesUrl());
		this.fireEvent('datachanged');
	}
};

/**
 * Remove all services from the panel
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removeAll = function(supressMsgs) {
	var self = this;
	this.services.each(function(service) {
  		// find child node, remove it
		var childNodes = self.layerTree.root.childNodes;
		for (var i=0; i<childNodes.length; i++) {
			childNode = childNodes[i];
			if (childNode.attributes.service && childNode.attributes.service.capabilitiesUrl == service.capabilitiesUrl) {
				self.removeService(service, supressMsgs, childNode);
			}
		}
	});
};

/**
 * Get the list of activated services
 * @return Array of de.ingrid.mapclient.frontend.data.Service instances
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.getServiceList = function() {
	var services = [];
	var serviceNodes = this.layerTree.root.childNodes;
	for (var i=0, count=serviceNodes.length; i<count; i++) {
		var serviceNode = serviceNodes[i];
		services.push(serviceNode.attributes.service);
	}
	return services;
};

/**
 * Open a window with meta info of a map layer
 * @param node Ext.tree.TreeNode instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.displayMetaData = function(node) {
	var self = this;
	var layer = null;
	if(node.attributes.layer)
		layer = node.attributes.layer;
	//if we get a layer then this should be a LayerNode, otherwise we get a LayerContainer object
	if(!layer) {
		layer = node.childNodes[0].layer;
	}		

	var service = node.attributes.service;
	if(service){
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
		console.error("Service could not be found!");
	}

};

/**
 * Display a opacity slider for the selected layer
 * @param layer The layer, for which to set the opacity
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.displayOpacitySlider = function(layer) {
	var self = this;
	this.opacityDialog = new de.ingrid.mapclient.frontend.controls.OpacityDialog({
		id: 'opacityDialog',
		layer: layer
	});
	this.opacityDialog.show();
};

/**
 * Check if a opacity slider dialog is currently opened and update it with the given layer
 * @param layer The layer, for which to set the opacity
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.updateOpacitySlider = function(layer) {
	if (this.opacityDialog && !this.opacityDialog.isDestroyed) {
		this.opacityDialog.close();
		this.displayOpacitySlider(layer);
	}
};

/**
 * Add KML to active service panel
 * @param title of KML
 * @param url of KML file
 */

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.addKml = function(kmlArray) {
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

			var layer = new OpenLayers.Layer.GML(kmlTitle, kmlUrl, {
				   format: OpenLayers.Format.KML,
				   formatOptions: {
					 extractStyles: true,
				     extractAttributes: true,
				     maxDepth: 2
				   },
			       styleMap: styleMap,
				   displayOutsideMaxExtent : false
				}
			);

			var rule = new OpenLayers.Rule({
				  title: kmlTitle,
				  symbolizer: {pointRadius: 3, fontSize: "11px", fontColor: "#000000",
				               labelAlign: "center", labelXOffset: 0,
				               labelYOffset: 10, fillColor: kmlColor[countColor], strokeColor: "#000000" }
				});

			styleMap.styles["default"].addRules([rule]);
			countColor = countColor + 1;
			if(countColor % 16 == 0){
				countColor = 0;
			}

			var selectCtrl = new OpenLayers.Control.SelectFeature(layer);
			function createPopup(feature) {
				popup = new GeoExt.Popup({
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
			            if(OpenLayers.Util.indexOf(layer.selectedFeatures,
			                                       this.feature) > -1) {
			                selectCtrl.unselect(this.feature);
			            }
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

	var overlayLayerNode = new GeoExt.tree.OverlayLayerContainer({
		text: i18n('tZeigePunktkoordinaten'),
		initDir:0,
	    layerStore: store,
	    leaf: false,
	    expanded: false
	});

	if(this.layerTree != null){
		this.layerTree.getRootNode().appendChild(overlayLayerNode);
	}

};


de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removePointCoordinatesLayer = function(activeNode) {

	var layerId = activeNode.layer.id;
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
		if(this.layerTree.root){
			var childNodesTree = this.layerTree.root.childNodes;
			var indexTree = 0;
			for (var i=0, count7=childNodesTree.length; i<count7; i++) {
				var childNodeTree = childNodesTree[i];
				if(childNodeTree.text == parentNode.text){
					indexTree = i;
					break;
				}
			}
			var selectedService = this.layerTree.root.childNodes[indexTree];
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
				this.layerTree.root.removeChild(selectedService);

			}
		}
	}

	// Remove from session
	if(this.kmlArray){
		var title = activeNode.layer.name;
		var url = activeNode.layer.url;
		for (var i=0, count10=this.kmlArray.length; i<count10; i++) {
			var kml = this.kmlArray[i];
			if(title == kml.title && url == kml.url){
				this.kmlArray.remove(kml);
				break;
			}
		}
	}
	this.fireEvent('datachanged');
};


de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removePointCoordinatesService = function(activeNode) {

	// Remove from map
	if(activeNode.attributes.layerStore.data.items){
		for (var i=0, count1=activeNode.attributes.layerStore.data.items.length; i<count1; i++) {
			var childNode = activeNode.attributes.layerStore.data.items[i];
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
	this.layerTree.root.removeChild(activeNode);

	// Remove from session
	if(this.kmlArray){
		for (var i=0, count3=this.kmlArray.length; i<count3; i++) {
			var kml = this.kmlArray[i];
			this.kmlArray.remove(kml);
			count3 = count3 - 1;
			i--;
		}
	}
	this.fireEvent('datachanged');
};
		
	/**
	 * we set the map to the largest bounding box its layers contain 
	 * but first we check if our layers support our base projection 
	 * @param {} service
	 * @param {} supportsSRS
	 * @return {}
	 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.bboxOfServiceExtent = function(
		service, supportsSRS) {
	var self = this;
	var bbox = null;
	var srs = self.map.projection;
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
					var projMap = new OpenLayers.Projection(srs);
					var projLayer = new OpenLayers.Projection(srsIn);
					var bounds = new OpenLayers.Bounds.fromArray(bbox);
					bounds.transform(projLayer, projMap);
					return bounds;	
				}
				
			}
		}
};
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.bboxOfLayerExtent = function(attributes) {
	var bbox = null;
	var srs = this.map.projection;
	var bounds=null;
	
	// check for WMS Layers
	if (attributes.service) {
		//layerUrl
		var url = attributes.layer.url;
		//get the layerId, but the right one! our layer id doesnt help, no bbox in this object
		var layerId;
		if (attributes.layer.params) {
			layerId = attributes.service.layers.get(url+':'+attributes.layer.params.LAYERS)
		} else {
			layerId = attributes.service.layers.get(url+':'+attributes.layer.name)
		}
		var layer = attributes.service.capabilitiesStore.data.get(layerId.id);
		//check if our layers upport the map projection
		bounds = this._getBoundingBoxFromLayer(layer, srs);
	} else {
		// NON WMS Layer (KML Layer)
		var srsIn = attributes.layer.projection.projCode;
		bounds = attributes.layer.maxExtent;
		if (srsIn != srs) {
			var projMap = new OpenLayers.Projection(srs);
			var projLayer = new OpenLayers.Projection(srsIn);
			bounds.transform(projLayer, projMap);
		}
	}
	return bounds;
};

/**
 * Extract Bounding Box from Layer. Try to get it first from bbox and then from llbbox.
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype._getBoundingBoxFromLayer = function(layer, currentProjection) {
	if(layer.data.bbox[currentProjection]){
		bbox = layer.data.bbox[currentProjection].bbox;
		return new OpenLayers.Bounds.fromArray(bbox);
	} else {
		// try to get bounding box from LatLonBoundingBox property
		var llbbox = layer.data.llbbox;
		if (llbbox) {
			var bounds = new OpenLayers.Bounds.fromArray(llbbox);
			var projMap = new OpenLayers.Projection(currentProjection);
			var projLayer = new OpenLayers.Projection("EPSG:4326"); // WGS84
			bounds.transform(projLayer, projMap);
			return bounds;
		}
	}
	return null;
};

/**
 * Check all layers of a service for the global bounding box
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.getBoundsFromSubLayers = function(service) {
	var srs    = this.map.projection;
	var maxBounds = null;
	var self = this;
	var layers = service.capabilitiesStore.data.items;
	
	Ext.each(layers, function(layer) {
		var bounds = self._getBoundingBoxFromLayer(layer, srs);
		if (bounds && maxBounds === null) maxBounds = bounds;
		else if (bounds) maxBounds.extend(bounds);
	});
	return maxBounds;
};

/**
 * Check all layers of a service for the minScale attribute
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.getMinScaleFromSubLayers = function(service) {
	var minScale = null;
	var layers = service.capabilitiesStore.data.items;
	
	Ext.each(layers, function(layer) {
		if (minScale === null || minScale < layer.data.minScale) 
			minScale = layer.data.minScale;
		
	});
	return minScale;
};

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.expandNode = function (node, fromTreeState){
	var self = this;
	
	if(fromTreeState){
		if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeState")){
			for (var i = 0, count = this.treeState.length; i < count; i++) {
				var state = this.treeState[i];
				var name = node.text;
				var capabilitiesUrl = node.attributes.service.capabilitiesUrl;
				var isService = node.layer ? "false" : "true";
				var layer = node.layer ? node.layer.params.LAYERS : "";
				
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
	}else{
		node.expand();
		if(node.hasChildNodes()){
			for (var j = 0, count = node.childNodes.length; j < count; j++) {
				var childNode = node.childNodes[j];
				self.expandNode(childNode, false);
			}
		}
	}
};

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removeCollapseChildNodeEntry = function (node){
	var self = this;
	
	for(var i = 0; i < node.childNodes.length; i++){
		var childNode = node.childNodes[i];
		var name = childNode.text;
		var capabilitiesUrl = childNode.attributes.service.capabilitiesUrl;
		var isService = childNode.layer ? "false" : "true";
		var layer = childNode.layer ? childNode.layer.params.LAYERS : "";
		
		for(var j = 0; j < self.treeState.length; j++){
			var state = self.treeState[j];
			if(name == state.name && capabilitiesUrl == state.capabilitiesUrl && isService + "" == state.isService && layer == state.layer){
				self.treeState.remove(state);
			}
		}
		
		childNode.collapse();
		
		if(childNode.hasChildNodes()){
			self.removeCollapseChildNodeEntry(childNode);
		}
	}
};

/**
 * disable/enable layer nodes recursively, based on the fact if they support our current zoomlevel
 * @param {} node
 * @param {} scale
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.checkScaleRecursively  = function(node, scale){
		var self = this;
		if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpand")){
			node.expand();
		}
		node.eachChild(function(n) {
	    	var layer = n.layer;
	    	if(layer){
	    		if(layer.maxScale > scale || layer.minScale < scale){
	    			//if we disable, they are not selectable anymore
	    			//this style class is set on disable, but doesnt reeally disable
	    			//n.disable();
	    			n.setCls('x-tree-node-disabled');
	    			if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
		    			if(n.layer.visibility && !n.leaf){
		    				n.setCls('x-tree-node-select-disabled');
		    			}
	    			}
	    		}
	        	else{
	        		n.enable();
	        		if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
	        			if(n.attributes.cls != "x-tree-node-select")
		        			n.setCls('x-tree-node-anchor');
		        		if((n.layer.visibility && !n.leaf) || n.attributes.cls == "x-tree-node-select-disabled"){
		        			n.setCls('x-tree-node-select');
		        		}
	        		}
	        	}
	    	}
	        if(n.hasChildNodes){
	        	self.checkScaleRecursively(n, scale);
	        }
	        
	        self.expandNode(n, true);
    	});
    	if(node instanceof GeoExt.tree.LayerNode){
    		var layer = node.layer;
    		if(layer){
	    		if(layer.maxScale > scale || layer.minScale < scale){
//	    			node.disable();
	    			node.setCls('x-tree-node-disabled');
	    			if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
	    				if(node.layer.visibility && !node.leaf){
	    					node.setCls('x-tree-node-select-disabled');
	    				}
	    			}
	    		}else{
	    			node.enable();
	    			if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
		    			if(node.attributes.cls != "x-tree-node-select"){
		    				node.setCls('x-tree-node-anchor');
		    			}
		    			if((node.layer.visibility && !node.leaf) || node.attributes.cls == "x-tree-node-select-disabled"){
		    				node.setCls('x-tree-node-select');
		        		}
	    			}
	    		}
    		}
    	}			        
}
/**
 * destroy layers by hand so that they dont keep loading when removed
 * @param {} node
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.destroyLayersRecursively  = function(node){
		var self = this;

		node.eachChild(function(n) {
    	var layer = n.layer;
    	if(layer){
	        if(n.hasChildNodes){
		    	self.destroyLayersRecursively(n);
		    }
        	layer.destroy();
    	}
		
    	});		
 
}

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.isParentsSelect = function(node) {
	var parentNode = node.parentNode;
	var isChecked = true;
	if(parentNode.layer){
    	if(parentNode.attributes.checked){
    		isChecked = this.isParentsSelect(parentNode);
    	}else{
    		isChecked = false;
    	}
	}
	return isChecked;
}

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.checkboxSelection = function(node, select, isParentsSelect) {
	var childNodes = node.childNodes; 
	for (var i = 0, count = childNodes.length; i < count; i++) {
		var childNode = childNodes[i];
		var isParentSelectChildNode = this.isParentsSelect(childNode);
		if(childNode.attributes.checked){
			var layer = childNode.layer;
			if(layer){
				if(select){
					if(((layer.getVisibility() == false) && (childNode.leaf == true) && isParentSelectChildNode) == true){
    					layer.setVisibility(select);
    				}else if ((childNode.leaf == false) && (childNode.attributes.cls == "x-tree-node-select") && isParentSelectChildNode){
    					layer.setVisibility(select);
    				}
				}else{
					if(layer.getVisibility()){
    					layer.setVisibility(select);
    					childNode.getUI().toggleCheck(true);
    				}
				}
				if(layer.isBaseLayer){
                	layer.setVisibility(true);
                }
			}
		}
		this.checkboxSelection(childNode, select, isParentSelectChildNode);
	}
}

de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.enableGroupLayerButton  = function(node, isEnabled){
	var self = this; 
	
	if(isEnabled){
		if(node.childNodes.length != 0){
		}
	}else{
		if(node.childNodes.length != 0){
		}
	}
}

GeoExt.tree.LayerNode.prototype.onCheckChange = function(node, checked){
	if (de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false) {
		var isParentsSelect = de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.isParentsSelect(node);
		if(isParentsSelect){
			if(checked != this.layer.getVisibility()) {
                this._visibilityChanging = true;
                var layer = this.layer;
                if(checked && layer.isBaseLayer && layer.map) {
                    layer.map.setBaseLayer(layer);
                } else {
                   	if(checked && this.childNodes.length > 0){
                   		 layer.setVisibility(false);
                   	}else{
                   		 if(isParentsSelect){
                   			 layer.setVisibility(checked);
                   		 }else{
                   			 layer.setVisibility(false);
                   		 }
                   	}
                }
                if(layer.isBaseLayer){
                	layer.setVisibility(true);
                }
                delete this._visibilityChanging;
			}
			if(checked == false){
				if(node.attributes.cls != "x-tree-node-disabled"){
					node.setCls('x-tree-node-anchor');
				}
            }
            
           	if(checked){
           		de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.checkboxSelection(node, true, isParentsSelect);
           	}else{
           		de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.checkboxSelection(node, false, isParentsSelect);
           	}
		}
	}else{
		if(checked != this.layer.getVisibility()) {
            this._visibilityChanging = true;
            var layer = this.layer;
            if(checked && layer.isBaseLayer && layer.map) {
                layer.map.setBaseLayer(layer);
            } else {
                layer.setVisibility(checked);
            }
            delete this._visibilityChanging;
        }
	}
}