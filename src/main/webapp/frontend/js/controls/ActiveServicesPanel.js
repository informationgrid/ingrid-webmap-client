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
	autoScroll: true,

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

	/**
	 * Toolbar buttons
	 */
	addBtn: null,
	removeBtn: null,
	transparencyBtn: null,
	metaDataBtn: null,
	expandBtn: null,
	groupLayerBtn: null,
	zoomLayerBtn : null,
	allExpanded: false,
	ctrls:null,
	kmlArray: [],
	transpBtnActive: false,
	metadataBtnActive: false,
	serviceCategoryPanel:null,
	parentCheckChangeActive:false,
	isCheckedByCheckedLayers:false,
	selectedLayersByService: []
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

	// create the toolbar buttons
	this.addBtn = new Ext.Button({
		iconCls: 'iconAdd',
		tooltip: i18n('tDienstHinzufuegen'),
		disabled: false,
		handler: function(btn) {
			new de.ingrid.mapclient.frontend.controls.NewServiceDialog({
				id: 'newServiceDialog',
				activeServicesPanel: self,
				ctrls: self.ctrls
			}).show();
		}
	});
	this.removeBtn = new Ext.Button({
		iconCls: 'iconRemove',
		tooltip: i18n('tZumEntfernenErstEinenDienstMarkieren'),
		disabled: true,
		handler: function(btn) {
			if (self.activeNode) {

				if(self.activeNode.attributes.service != undefined){
					//enable add service button
					if(self.serviceCategoryPanel.disabledButtons[self.activeNode.attributes.service.capabilitiesUrl]){
					self.serviceCategoryPanel.disabledButtons[self.activeNode.attributes.service.capabilitiesUrl].enable();
					self.serviceCategoryPanel.disabledButtons[self.activeNode.attributes.service.capabilitiesUrl] = null;
					}
					self.removeService(self.activeNode.attributes.service, null, self.activeNode);
					self.removeBtn.disable();
					self.removeBtn.setTooltip(i18n('tZumEntfernenErstEinenDienstMarkieren'));
					self.metaDataBtn.disable();
					self.metaDataBtn.setTooltip(i18n('tFuerMetadatenErst'));
				}else if (self.activeNode.layer != undefined){
					// Remove "Zeige Punktkoordinaten" layers
					if (self.activeNode.layer.id != undefined){
						self.removePointCoordinatesLayer(self.activeNode);
					}
				}else{
					// Remove "Zeige Punktkoordinaten" service
					self.removePointCoordinatesService(self.activeNode);self.remove
				}

			}
		}
	});
	this.transparencyBtn = new Ext.Button({
		iconCls: 'iconTransparency',
		tooltip: i18n('tFuerTransparenzErst'),
		disabled: true,
		handler: function(btn) {
			if (self.activeNode  && !self.transpBtnActive) {
				self.displayOpacitySlider(self.activeNode.layer);
				self.transpBtnActive = true;
			}
		}
	});
	this.metaDataBtn = new Ext.Button({
		iconCls: 'iconMetadata',
		tooltip: i18n('tFuerMetadatenErst'),
		disabled: true,
		handler: function(btn) {
			if (self.activeNode && !self.metadataBtnActive) {
				self.displayMetaData(self.activeNode);
			}
		}
	});
	this.expandBtn = new Ext.Button({
		iconCls: 'iconExpand',
		tooltip: i18n('tAlleZuAufklappen'),
		disabled: false,
		handler: function(btn) {
			if (self.allExpanded) {
				self.layerTree.collapseAll();
				self.allExpanded = false;
			}else{
				self.layerTree.expandAll();
				self.allExpanded = true;
			}
		}
	});

	this.groupLayerBtn = new Ext.Button({
		iconCls: 'iconMap',
		tooltip: 'Gruppenlayer anzeigen',
		disabled: true,
		handler: function(btn) {
			var node = self.activeNode; 
			if (node.attributes.checked) {
				var layer = node.layer;
				if(node.attributes.cls == "x-tree-node-select"){
					layer.setVisibility(false);
					node.setCls('x-tree-node-anchor');
				}else{
					var isParentsSelect = de.ingrid.mapclient.frontend.Workspace.prototype.isParentsSelect(node);
					if(isParentsSelect){
						layer.setVisibility(true);
					}
					node.setCls('x-tree-node-select');
				}
				node.getUI().toggleCheck(true);
			}
		}
	});

	// zoom to layer extent
	var bbox = null;

	this.zoomLayerBtn = new Ext.Button({
				iconCls : 'iconZoomLayerExtent',
				tooltip : i18n('tZoomeAufServiceOderLayer'),
				disabled : true,
				handler : function(btn) {
					var bounds   = null;
					var minScale = null;
					if (self.activeNode) {
						//check if we have a service(root) node 
						if(self.activeNode instanceof GeoExt.tree.LayerContainer){
							bounds = self.bboxOfServiceExtent(self.activeNode.attributes.service)
							//minScale = self.activeNode.layer.minScale;
							if (!bounds) bounds = self.getBoundsFromSubLayers(self.activeNode.attributes.service);
							minScale = self.getMinScaleFromSubLayers(self.activeNode.attributes.service);
						}else{
							bounds = self.bboxOfLayerExtent(self.activeNode.attributes)
							// every layer has a minScale, even if not found in getCapabilities-Document
							// in that case the minScale is calculated by the resolution of the map (see Layer.js:940) 
							minScale = self.activeNode.layer.minScale;
							
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
				}
			});

	
	// the layer tree
	this.layerTree = new Ext.tree.TreePanel({
		root: {
			nodeType: 'async',
			text: i18n('tLayers'),
			expanded: false,
			children: []
		},
		rootVisible: false,
		enableDD: false,
		border: false
	});

	var self = this;
	this.layerTree.getSelectionModel().on('selectionchange', function(selModel, node) {
		// default
		self.addBtn.enable();
		self.removeBtn.enable();
		self.transparencyBtn.disable();
		self.metaDataBtn.enable();	
		self.zoomLayerBtn.enable();
		self.groupLayerBtn.disable();

		if (node) {
			if (node.layer) {
				self.transparencyBtn.enable();
				self.transparencyBtn.setTooltip(i18n('tLayerTransparenz'));
				self.updateOpacitySlider(node.layer);
				if (node.layer.CLASS_NAME=="OpenLayers.Layer.GML") {
					self.removeBtn.enable();
					self.removeBtn.setTooltip(i18n('tDienstEntfernen'));
					self.metaDataBtn.disable();
				} else {
					self.removeBtn.disable();
					self.removeBtn.setTooltip(i18n('tZumEntfernenErstEinenDienstMarkieren'));
					self.metaDataBtn.enable().setTooltip(i18n('tMetadaten'));
				}
				
				if(selModel.selNode.childNodes.length != 0){
					self.groupLayerBtn.enable();
				}
			}else if (node.attributes.service) {
				self.transparencyBtn.disable();
				self.transparencyBtn.setTooltip(i18n('tFuerTransparenzErst'));
				self.removeBtn.enable();
				self.removeBtn.setTooltip(i18n('tDienstEntfernen'));
				self.metaDataBtn.enable().setTooltip(i18n('tMetadaten'));
				
			} else {
				// non service layers (i.e. kml folder layer)
				self.zoomLayerBtn.disable();
				self.transparencyBtn.disable();
				self.metaDataBtn.disable();
			}
		}
		self.activeNode = node;
	});
	
	
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
			}
	
		});
	}
	
	var items = [
			this.addBtn,
			this.removeBtn,
			this.transparencyBtn,
			this.metaDataBtn,
			this.expandBtn,
			this.zoomLayerBtn
		]
	
	if(de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false){
		items.push(this.groupLayerBtn);
	} 
	
	Ext.apply(this, {
		items: this.layerTree,
		tbar: items
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
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.addService = function(service, showService, initialAdd, expandNode) {
	var self = this;
	if(service != undefined){
		if (this.containsService(service)) {
			//tell the user that the service is already loaded
			//de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.VIEW_ALREADY_LOADED_FAILURE);
			return;
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
			if(srs.toLowerCase() == this.map.projection.toString().toLowerCase()){
			supportsSRS = true;
			break;
			}
		}
		// maybe the srs is not in the support list, but there is a bbox defined for it
		var srss = service.capabilitiesStore.data.items[0].data.bbox;
		if(!supportsSRS && srss)
			for(srs in  srss){
				if(srs.toLowerCase() == this.map.projection.toLowerCase()){
				supportsSRS = true;
				break;
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
			if(!initialAdd)
				this.map.zoomToExtent(bounds);
		}
		//we need to expand the nodes otherwise the root node doesnt know its children
		if(typeof expandNode === 'undefined' || expandNode == false)
			node.expand(true);

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
	return this.services.getRange();
};

/**
 * Open a window with meta info of a map layer
 * @param node Ext.tree.TreeNode instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.displayMetaData = function(node) {
	var self = this;
	var layer = null;
	var isService = false;
	if(node.attributes.layer)
		layer = node.attributes.layer;
	//if we get a layer then this should be a LayerNode, otherwise we get a LayerContainer object
	if(!layer) {
		isService = true;
		layer = node.childNodes[0].layer;
	}		

	var service = node.attributes.service;
	if(service){
		var metaDialog = new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
			capabilitiesUrl: service.getCapabilitiesUrl(),
			layer: isService ? null : layer
		}).show();
		metaDialog.on('close', function(){
			self.metadataBtnActive = false;
		});
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
	this.opacityDialog.on('close', function(){
	self.transpBtnActive = false;
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

/**
 * disable/enable layer nodes recursively, based on the fact if they support our current zoomlevel
 * @param {} node
 * @param {} scale
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.checkScaleRecursively  = function(node, scale){
		var self = this;
		node.expand();
		node.eachChild(function(n) {
	    	var layer = n.layer;
	    	if(layer){
	    		if(layer.maxScale > scale || layer.minScale < scale){
	    			//if we disable, they are not selectable anymore
	    			//this style class is set on disable, but doesnt reeally disable
	    			//n.disable();
	    			n.setCls('x-tree-node-disabled');
	    		}
	        	else
	        		n.enable();
	    	}
	        if(n.hasChildNodes){
	        	self.checkScaleRecursively(n, scale);
	        }
    	});
    	if(node instanceof GeoExt.tree.LayerNode){
    		var layer = node.layer;
    		if(layer){
	    		if(layer.maxScale > scale || layer.minScale < scale){
//	    			node.disable();
	    			node.setCls('x-tree-node-disabled');
	    		}else
	    			node.enable();
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

GeoExt.tree.LayerNode.prototype.onCheckChange = function(node, checked){
	if (de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection") == false) {
		var isParentsSelect = de.ingrid.mapclient.frontend.Workspace.prototype.isParentsSelect(node);
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
                delete this._visibilityChanging;
			}
			if(checked == false){
            	node.setCls('x-tree-node-anchor');
            }
            
           	if(checked){
           		de.ingrid.mapclient.frontend.Workspace.prototype.checkboxSelection(node, true, isParentsSelect);
           	}else{
           		de.ingrid.mapclient.frontend.Workspace.prototype.checkboxSelection(node, false, isParentsSelect);
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
