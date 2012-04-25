/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class ActiveServicesPanel shows the activated services.
 * The panels fires a 'datachanged' event, if the list of services changed.
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel = Ext.extend(Ext.Panel, {
	title: "Aktive Dienste",
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
	allExpanded: false,
	
	kmlArray: []
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.initComponent = function() {

	var self = this;

	// add the datachanged event
	this.addEvents({
		datachanged: true
	});

	// create the layer store
	this.layerStore = new GeoExt.data.LayerStore({
		map: this.map,
		initDir: GeoExt.data.LayerStore.MAP_TO_STORE
	});

	// create the toolbar buttons
	this.addBtn = new Ext.Button({
		iconCls: 'iconAdd',
		tooltip: 'Dienst hinzuf&uuml;gen',
		disabled: false,
		handler: function(btn) {
			new de.ingrid.mapclient.frontend.controls.NewServiceDialog({
				activeServicesPanel: self
			}).show();
		}
	});
	this.removeBtn = new Ext.Button({
		iconCls: 'iconRemove',
		tooltip: 'Dienst entfernen',
		disabled: true,
		handler: function(btn) {
			if (self.activeNode) {
				if(self.activeNode.attributes.service != undefined){
					self.removeService(self.activeNode.attributes.service);	
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
		tooltip: self.activeNode ? 'Layer-Transparenz' : 'Für die Layertransparenz bitte zuerst Layer auswählen!',
		disabled: true,
		handler: function(btn) {
			if (self.activeNode) {
				self.displayOpacitySlider(self.activeNode.layer);
			}
		}
	});
	this.metaDataBtn = new Ext.Button({
		iconCls: 'iconMetadata',
		tooltip: 'Metadaten',
		disabled: true,
		handler: function(btn) {
			if (self.activeNode) {
				self.displayMetaData(self.activeNode);
			}
		}
	});
	this.expandBtn = new Ext.Button({
		iconCls: 'iconExpand',
		tooltip: 'Alle auf/zuklappen',
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

	// the layer tree
	this.layerTree = new Ext.tree.TreePanel({
		root: {
			nodeType: 'async',
			text: 'Layers',
			expanded: false,
			children: []
		},
		rootVisible: false,
		enableDD: true,
		border: false
	});

	var self = this;
	this.layerTree.getSelectionModel().on('selectionchange', function(selModel, node) {
		// default
		self.addBtn.enable();
		self.removeBtn.enable();
		self.transparencyBtn.disable();
		self.metaDataBtn.enable();
		
		if (node) {
			if (node.layer) {
				self.transparencyBtn.enable();
				self.updateOpacitySlider(node.layer);
				if (node.layer.CLASS_NAME=="OpenLayers.Layer.GML") {
					self.removeBtn.enable();
				} else {
					self.removeBtn.disable();
				}
			}else {
				self.transparencyBtn.disable();
				self.removeBtn.enable();	
			}
		}
		self.activeNode = node;
	});

	Ext.apply(this, {
		items: this.layerTree,
		tbar: items = [
			this.addBtn,
			this.removeBtn,
			this.transparencyBtn,
			this.metaDataBtn,
			this.expandBtn
		]
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
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.addService = function(service) {
	if(service != undefined){
		if (this.containsService(service)) {
			//tell the user that the service is already loaded
			//de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.VIEW_ALREADY_LOADED_FAILURE);
			return;
		}
	

		//check if the added service support our base EPSG,
		//if not warn the user but display the new service
		var srss = service.capabilitiesStore.data.items[0].data.srs;
		var supportsSRS = false;
		// srss holds the name of the supported projections 
		for(srs in  srss){
			if(srs == this.map.projection){
			supportsSRS = true;
			break;
			}
		}

		if(!supportsSRS)
		de.ingrid.mapclient.Message.showEPSGWarning(this.map.projection,service.definition.title);

		
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
			text: service.getDefinition().title,
			layerStore: this.layerStore,
			leaf: false,
			expanded: false,
			service: service,
			loader: {
				filter: function(record) {
					var layer = record.get("layer");
					var layerBelongsToService = service.contains(layer);
					return layerBelongsToService;
				}
			}
		});
		this.layerTree.root.appendChild(node);
	
		this.services.add(service.getCapabilitiesUrl(), service);
		this.fireEvent('datachanged');
		
		/*****************************************************************/
		/* we set the map to the largest bounding box its layers contain */
		/* but first we check if our layers support our base projection **/ 
		/*****************************************************************/

		var mapProjection = de.ingrid.mapclient.frontend.data.MapUtils.getMapProjection(this.map);
		if(mapProjection.projCode == "EPSG:4326"){
		var bboxes = service.capabilitiesStore.data.items;
		var bIndex = 0;
		var largestCoord = bboxes[0].data.llbbox[0];
		for (var i = 0; i < bboxes.length; i++){
			// we look for a smaller x1 coord, since these go into the negative
			// thus the map becomes larger
			if (bboxes[i].data.llbbox[0] < largestCoord)
				bIndex = i;
		}
		var llbbox = service.capabilitiesStore.data.items[bIndex].data.llbbox;
		var bounds = new OpenLayers.Bounds.fromArray(llbbox);
		this.map.zoomToExtent(bounds);			
		}
		
		if(supportsSRS && mapProjection.projCode != "EPSG:4326"){

		var bboxes = service.capabilitiesStore.data.items;
		var bIndex = 0;
		var largestCoord = Number.MAX_VALUE;
		for (var i = 0; i < bboxes.length; i++){
			// we look for a smaller x1 coord, since these go into the negative
			// thus the map becomes larger
			// and we check if the layer NOT the service supports the projection
			if(typeof(bboxes[i].data.bbox[srs]) !== 'undefined'){
			if (bboxes[i].data.bbox[srs].bbox[0] < largestCoord){
				bIndex = i;
				var llbbox = bboxes[i].data.bbox[srs].bbox;
			}
			}
		}		
		// do we get some data?	
		if(llbbox){
		var bounds = new OpenLayers.Bounds.fromArray(llbbox);
		var newProj = new OpenLayers.Projection(srs);
		this.map.zoomToExtent(bounds);
		}else{
		// if not we tell the user
		de.ingrid.mapclient.Message.showEPSGWarning(this.map.projection,service.definition.title);
		}
		}
	}
	
};

/**
 * Remove a service from the panel
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removeService = function(service) {

	if (!this.containsService(service)) {
		return;
	}

	// remove service layers from the store
	var recordsToRemove = [];
	this.layerStore.each(function(record) {
		if (service.contains(record.get("layer"))) {
			recordsToRemove.push(record);
		}
	});
	this.layerStore.remove(recordsToRemove);

	// remove service node from the tree
	var node = this.layerTree.root.findChildBy(function(child) {
		var isServiceNode = false;
		var curService = child.attributes.service;
		if (curService != undefined) {
			isServiceNode = (curService.getCapabilitiesUrl() == service.getCapabilitiesUrl());
		}
		return isServiceNode;
	}, this, true);
	if (node) {
		node.remove(true);
	}

	this.services.removeKey(service.getCapabilitiesUrl());
	this.fireEvent('datachanged');
};

/**
 * Remove all services from the panel
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.removeAll = function() {
	var self = this;
	this.services.each(function(service) {
		self.removeService(service);
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
	var layer = node.attributes.layer;
	var service = de.ingrid.mapclient.frontend.data.Service.findByLayer(layer);
	if (service) {
		new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
			capabilitiesUrl: service.getCapabilitiesUrl(),
			layer: layer
		}).show();
	}else{
		service = node.attributes.service;
		if(service){
			new de.ingrid.mapclient.frontend.controls.MetaDataDialog({
				capabilitiesUrl: service.getCapabilitiesUrl(),
				layer: layer
			}).show();
		}
	}
};

/**
 * Display a opacity slider for the selected layer
 * @param layer The layer, for which to set the opacity
 */
de.ingrid.mapclient.frontend.controls.ActiveServicesPanel.prototype.displayOpacitySlider = function(layer) {
	this.opacityDialog = new de.ingrid.mapclient.frontend.controls.OpacityDialog({
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
				     maxDepth: 2},
				     styleMap: styleMap
				     },
				     displayOutsideMaxExtent = false
				);
			
			// TODO: add rules so the layer will be displayed on legend
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
		text: 'Zeige Punktkoordinaten',
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
