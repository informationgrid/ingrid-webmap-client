/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend");

/**
 * @class PanelWorkspace is the main gui component for the frontend.
 */
de.ingrid.mapclient.frontend.PanelWorkspace = Ext.extend(Ext.Panel, {
	layout: 'border',
	monitorResize: true,
	renderTo:'openlayersDiv',
	height:676,
	autoWidth:true,

	/**
	 * @cfg The initial map url to load. This is typically a short url which the
	 * 		server maps to a user data url (optional)
	 */
	mapUrl: null,

	/**
	 * @cfg de.ingrid.mapclient.frontend.data.Session instance
	 */
	session: null,

	/**
	 * The OpenLayers.Map instance
	 */
	map: null,

	/**
	 * The main layer tree
	 */
	activeServicesPanel: null,

	/**
	 * Indicates if workspace state changes should be handled or not
	 *
	 * @see de.ingrid.mapclient.frontend.Workspace.onStateChanged
	 */
	listenToStateChanges: false,
	
	callbackHooks: null,
	callbackAreaId:null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.PanelWorkspace.prototype.initComponent = function() {
	if (this.session == null) {
		throw "Workspace has to be created with a Session instance";
	}
	var self = this;

	// create the map (default projection read from config)
	var projection =  de.ingrid.mapclient.Configuration.getValue('projections');
	var epsg = projection[0].epsgCode;
	this.map = new OpenLayers.Map({
		fractionalZoom: true,
		projection: epsg ? new OpenLayers.Projection(epsg) : new OpenLayers.Projection("EPSG:4326"),
		// this will be used by some controls (ArgParser, MousePosition,
		// Permalink)
		displayProjection: epsg ? new OpenLayers.Projection(epsg) : new OpenLayers.Projection("EPSG:4326"),
		// if we dont add these controls on init
		// we get the default controls plus the added ones
		// adding controls at init impedes default controls
		controls : [new OpenLayers.Control.Navigation(),
					new OpenLayers.Control.PanZoomBar(),
					new OpenLayers.Control.ScaleLine(),
					new OpenLayers.Control.MousePosition()]
	});

	// create the map container
	var mapPanel = new GeoExt.MapPanel({
		border: false,
		map: this.map
	});

	// create the accordion for the west panel
	var accordionItems = [];

	// a) layer tree
	this.activeServicesPanel = new de.ingrid.mapclient.frontend.controls.ActiveServicesPanel({
		map: this.map
	});
	accordionItems.push(this.activeServicesPanel);

	// b) available service categories
	var mapServiceCategories = de.ingrid.mapclient.Configuration.getValue("mapServiceCategories");
	if (mapServiceCategories) {
		for ( var i = 0, count = mapServiceCategories.length; i < count; i++) {
			var panel = new de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel({
				mapServiceCategory: mapServiceCategories[i],
				activeServicesPanel: this.activeServicesPanel
			});
			accordionItems.push(panel);
		}
	}

	// c) search panel
	accordionItems.push({
		id: 'searchPanel',
		title: i18n('tSuche'),
		autoScroll: true
	});

	// create the legend panel
	var legendPanel = new GeoExt.LegendPanel({
		layerStore: this.activeServicesPanel.getLayerStore(),
		autoScroll: true,
		border: false
	});

	// create the panel for the west region
	var westPanel = new Ext.TabPanel({
		region: 'west',
		activeTab: 0,
		width: 200,
		split: true,
		collapsible: true,
		items: [{
			title: i18n('tDienste'),
			closable: false,
			layout: 'accordion',
			layoutConfig: {
				animate: true
			},
			border: false,
			items: accordionItems
		}, {
			title: i18n('tLegende'),
			items: legendPanel
		}]
	});

	// create the toolbar items
	var toolbarItems = [];

	
	// BBOX select tool
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasBboxSelectTool")) {
		var coordinatesCtrl = new OpenLayers.Control.Measure(
				OpenLayers.Handler.RegularPolygon, {
					handlerOptions : {
						sides : 4,
						irregular : true,
						persist : true
					},
					callbacks : {
						done : function(geometry) {
							if (self.callbackHooks.bboxSelected) {
								bounds = geometry.getBounds();
								var oldProjection = de.ingrid.mapclient.frontend.data.MapUtils.getMapProjection(self.map);
								if(oldProjection.projCode != "EPSG:4326"){
									var newProjection = new OpenLayers.Projection("EPSG:4326");
									bounds = geometry.getBounds().clone().transform(oldProjection, newProjection);
								}
								self.callbackHooks.bboxSelected(bounds.left.toFixed(2), bounds.right.toFixed(2), bounds.bottom.toFixed(2), bounds.top.toFixed(2));
							} else {
								// output message to js console
								//console.log("No callback 'bboxSelected' has been defined for selecting a bounding box!") 
							}
						}
					}
				});  

		this.map.addControl(coordinatesCtrl);
		coordinatesCtrl.activate();
	}
	

	// b.1) area tool
	var administrativeFeatureInfoControl = new de.ingrid.mapclient.frontend.controls.FeatureInfoDialog({
		map: this.map,
		title: i18n('tAdministrativeAuswahl'),
		callbackAreaId:self.callbackAreaId
	});
	this.map.events.on({
		'click': administrativeFeatureInfoControl.checkAdministrativeUnits,
		scope: administrativeFeatureInfoControl
	});
	
	toolbarItems.push(new Ext.ButtonGroup({
		items : [{
					xtype : 'button',
					id : 'bboxButton',
					iconCls : 'iconSelectCoordinates',
					tooltip : i18n('tGebietAuswaehlen'),
					toggleGroup : 'mygroup',
					enableToggle : true,
					pressed: true,
					hidden: de.ingrid.mapclient.Configuration.getSettings("searchHasBboxSelectTool") ? false : true,
					handler : function(btn) {
						if (btn.pressed) {
							coordinatesCtrl.activate();
							administrativeFeatureInfoControl.deactivate();
	
						} else {
							coordinatesCtrl.deactivate();

						}
					}
				}, {
					xtype : 'button',
					iconCls : 'iconInfo',
					tooltip : i18n('tIdAuswaehlen'),
					enableToggle : true,
					hidden: de.ingrid.mapclient.Configuration.getSettings("searchHasFeatureInfoTool") ? false : true,
					toggleGroup : 'mygroup',
					handler : function(btn) {
						if (btn.pressed) {
							coordinatesCtrl.deactivate();
							administrativeFeatureInfoControl.activate();
						} else {
							administrativeFeatureInfoControl.deactivate();
						}
					}
				}, {
					xtype : 'button',
					iconCls : 'iconDefault',
					tooltip : i18n('tKarteVerschieben'),
					enableToggle : true,
					toggleGroup : 'mygroup',
					handler : function(btn) {
						if (btn.pressed) {
							coordinatesCtrl.deactivate();
							administrativeFeatureInfoControl.deactivate();
						} else {
							// console.debug("button active");
						}
					}
				}]
	}));
	
	// b.2) history tool
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasHistoryTool")) {
		// create the OpenLayers control
		var historyCtrl = new OpenLayers.Control.NavigationHistory();
		this.map.addControl(historyCtrl);

		toolbarItems.push(new GeoExt.Action({
			control: historyCtrl.previous,
			disabled: true,
			iconCls: 'iconZoomPrev',
			tooltip: i18n('tZurueck')
		}));
		toolbarItems.push(new GeoExt.Action({
			control: historyCtrl.next,
			disabled: true,
			iconCls: 'iconZoomNext',
			tooltip: i18n('tVor')
		}));
	}
	
	// c) measure tool
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasMeasureTool")) {
		// create the OpenLayers control
		var measurePathCtrl = new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
			persist: true
		});
		measurePathCtrl.events.on({
			"measure": this.measure
		});
		this.map.addControl(measurePathCtrl);
		//testest

		//this control checks the coordinates of the drawn rectangle
		var measurePolygonCtrl = new OpenLayers.Control.Measure(
				OpenLayers.Handler.RegularPolygon, {
					handlerOptions : {
						sides : 4,
						irregular : true,
						persist : true
					}
				});  


		this.map.addControl(measurePolygonCtrl);
		


		toolbarItems.push(new Ext.SplitButton({
			iconCls: 'iconMeassure',
			tooltip: i18n('tMessen'),
			menu: [new Ext.menu.CheckItem({
				id: 'measurePath',
				text: i18n('tStrecke'),
				toggleGroup: 'addToSearch',
				listeners: {
					checkchange: function(item, checked) {
						if (checked) {
							Ext.getCmp('measurePolygon').setChecked(false);
							measurePathCtrl.activate();
						} else {
							measurePathCtrl.deactivate();
						}
					}
				}
			}), new Ext.menu.CheckItem({
				id: 'measurePolygon',
				text: i18n('tFlaeche'),
				toggleGroup: 'control',
				listeners: {
					checkchange: function(item, checked) {
						if (checked) {
							Ext.getCmp('measurePath').setChecked(false);
							measurePolygonCtrl.activate();
							
						} else {
							measurePolygonCtrl.deactivate();
						}
					}
				}
			})]
		}));
	}
	
	// Create Nominatim
	if (de.ingrid.mapclient.Configuration.getSettings("searchNominatimEnable")) {
		toolbarItems.push({
			id:'nominatim',
			xtype: "gx_geocodercombo",
			hideTrigger: true,
			// To restrict the search to a bounding box, uncomment the following
			// line and change the viewboxlbrt parameter to a left,bottom,right,top
			// bounds in EPSG:4326:
			url: "" + de.ingrid.mapclient.Configuration.getSettings("searchNominatimParams").trim(),
			width: 300,
			map: this.map,
			emptyText: i18n("tNominatimSearch"),
			zoom: 5,
			loadingText: i18n("tNominatimLoading")
		});
	}
	
	toolbarItems.push(new Ext.Toolbar.Fill());

	// d) print tool
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasPrintTool")) {
		toolbarItems.push(new Ext.Button({
			iconCls: 'iconPrint',
			tooltip: i18n('tDrucken'),
			handler: function(btn) {
				new de.ingrid.mapclient.frontend.controls.PrintDialog({
					mapPanel: mapPanel,
					legendPanel: legendPanel
				});
			}
		}));
	}

	// e) load tool
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasLoadTool")) {
		toolbarItems.push(new Ext.Button({
			iconCls: 'iconLoad',
			tooltip: i18n('tLaden'),
			disabled: !this.session.hasUserId(),
			handler: function(btn) {
				var dlg = new de.ingrid.mapclient.frontend.controls.LoadDialog({
					session: self.session
				});
				dlg.on('close', function(p) {
					if (dlg.isLoad()) {
						self.load(undefined, dlg.getFileId());
					}
				});
			}
		}));
	}

	// f) save tool
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasSaveTool")) {
		toolbarItems.push(new Ext.Button({
			iconCls: 'iconSave',
			tooltip: i18n('tSpeichern'),
			disabled: !this.session.hasUserId(),
			handler: function(btn) {
				var dlg = new de.ingrid.mapclient.frontend.controls.SaveDialog();
				dlg.on('close', function(p) {
					if (dlg.isSave()) {
						self.save(false, dlg.getTitle(), dlg.getDescription());
					}
				});
			}
		}));
	}

	// g) help tool
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasHelpTool")) {
		toolbarItems.push(new Ext.Button({
			iconCls: 'iconHelp',
			tooltip: i18n('tHilfe'),
			handler: function(btn) {
				window.open(de.ingrid.mapclient.HELP_URL_EXT_SEARCH, "InternalWin", 'width=750,height=550,resizable=yes,scrollbars=yes,location=no,toolbar=yes');
			}
		}));
	}

	// create the toolbar
	var toolbar = new Ext.Toolbar({
		items: toolbarItems
	});

	// create the settings dialog
	var settingsDialog;
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasSettings")) {
		settingsDialog = new de.ingrid.mapclient.frontend.controls.SettingsDialog({
		map: this.map,
		viewConfig: {
			hasProjectionsList: de.ingrid.mapclient.Configuration.getSettings("searchHasProjectionsList"),
			hasScaleList: de.ingrid.mapclient.Configuration.getSettings("searchHasScaleList")
		}
		});
	}
	this.on('afterrender', function(el) {
		if (settingsDialog) {
			mapPanel.items.add(settingsDialog); // constrain to mapPanel
			settingsDialog.anchorTo(mapPanel.el, 'tr-tr', [ -10, 10 ]);
		}
	});

	// create the panel for the center region
	var centerPanel = new Ext.Panel({
		region: 'center',
		id: 'centerPanel',
		layout: 'fit',
		items: mapPanel,
		tbar: toolbar
	});
		//activate animated toolbar at initial load of map
		var loadingPanel = new OpenLayers.Control.LoadingPanel();
		this.map.addControl(loadingPanel);
		loadingPanel.activate();
	
	// add the items according to the selected configuration
	// (center panel is mandatory)
	var items = [ centerPanel ];
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasServicesPanel")) {
		items.push(westPanel);
	}

	Ext.apply(this, {
		items: items
	});


	
	de.ingrid.mapclient.frontend.PanelWorkspace.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.PanelWorkspace.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.PanelWorkspace.superclass.onRender.apply(this, arguments);

	if (this.mapUrl) {
		// load the map defined in the mapUrl
		this.load(this.mapUrl);
	}
	else {
		// try to load existing session data
		this.load();
		// always init default map
		var callback = Ext.util.Functions.createDelegate(this.finishInitMap, this);
		this.initDefaultMap(callback);
	}
};

/**
 * Initialize the map with the default service
 *
 * @param callback
 *            Function to be called after initialization finished
 */
de.ingrid.mapclient.frontend.PanelWorkspace.prototype.initDefaultMap = function(callback) {

	// initialize the map with the default service
	var self = this;
	var capUrl = de.ingrid.mapclient.Configuration.getValue("wmsCapUrl");
	de.ingrid.mapclient.frontend.data.Service.load(
		capUrl,
		function(service) {
			// get the selected layer names and base layer name from
			// the configuration
			var selectedLayers = de.ingrid.mapclient.Configuration.getValue("layers");
			var selectedLayerNames = [];
			var baseLayerName = '';
			for ( var i = 0, count = selectedLayers.length; i < count; i++) {
				var layer = selectedLayers[i];
				selectedLayerNames.push(layer.name);
				if (layer.isBaseLayer == true) {
					baseLayerName = layer.name;
				}
			}

			// process the layers
			var layers = service.getLayers();
			var baseLayerSet = false;
			for ( var i = 0, count = layers.length; i < count; i++) {
				var layer = layers[i];

				// set the layer visibility according to the default
				// layer selection
				var isDefaultLayer = selectedLayerNames.indexOf(layer.name) != -1 ? true: false;
				// set the baselayer attribute
				var isBaseLayer = (layer.name == baseLayerName) ? true : false;
				if (isBaseLayer) {
					baseLayerSet = true;
				}
				layer.visibility = isDefaultLayer;
				layer.isBaseLayer = isBaseLayer;
				
				if (isBaseLayer) {
					baseLayerSet = true;
					// bind the base layer to the map
					// only bind the baseLayer to the map because since GeoExt 1.1
					// the map is zoomed to extent on layer add. Without a base layer 
					// set the extent cannot be derived.
					// the other layer will be add in
					// ActiveServicesPanel.addService()
					self.map.addLayer(layer);
				}
			}
			if (!baseLayerSet) {
				console.debug("Error!! BaseLayer '" + baseLayerName + "' does not match any layer.");
			}


			// initialize the projections list
			var projections = de.ingrid.mapclient.Configuration.getValue('projections');
			if (projections && projections.length > 0) {
				de.ingrid.mapclient.frontend.data.MapUtils.assureProj4jsDef(projections[0].epsgCode, function() {
					de.ingrid.mapclient.frontend.data.MapUtils.changeProjection(projections[0].epsgCode, self.map, this, true);
					self.map.events.triggerEvent("zoomend");
				});
			} else {
				// set initial bounding box for the map (expected to be WGS 84)
				// note: this must be done after layouting the map!
				var bbox = de.ingrid.mapclient.Configuration.getValue("mapExtend");
				var bounds = new OpenLayers.Bounds.fromArray([bbox.west, bbox.south, bbox.east, bbox.north]);
				//bounds.transform(new OpenLayers.Projection("EPSG:4326"), self.map.getProjectionObject());
				self.map.zoomToExtent(bounds);
			}
			// add default service to active services
			self.activeServicesPanel.addService(service);

			if (callback instanceof Function) {
				callback();
			}
		});
};

/**
 * Create the OpenLayers controls for the map.
 */
de.ingrid.mapclient.frontend.PanelWorkspace.prototype.finishInitMap = function() {

	var self = this;

	// add controls to map
	var controls = [new OpenLayers.Control.KeyboardDefaults(),
		new OpenLayers.Control.LoadingPanel()
	];
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasPermaLink")) {
		controls.push(new OpenLayers.Control.Permalink());
		controls.push(new OpenLayers.Control.Permalink('permalink'));
	}
	this.map.addControls(controls);
	
	if(de.ingrid.mapclient.Configuration.getSettings("searchMinimapEnable")){
		// create the overview layer
		// (we cannot clone the baselayer here, because it would use wrong 
		// settings form the main map (zoom levels, etc.).)
		var overviewLayer = new OpenLayers.Layer.WMS(
				this.map.baseLayer.name, 
	            this.map.baseLayer.url,
	            {layers: this.map.baseLayer.params.LAYERS}
	        );
		var mapOptions = {
	            maxExtent: this.map.maxExtent, 
	            maxResolution: 'auto',
	            projection: this.map.projection
	        };
		var ov = new OpenLayers.Control.OverviewMap({
			layers : [overviewLayer],
			minRatio: 2,
			maxRatio: 100,
			minimizeControl: function(e) {
				this.element.style.display = 'none';
				this.showToggle(true);
				if (e != null) {
				OpenLayers.Event.stop(e);
				}
				var copyright = $("copyright");
				if(copyright)
					copyright.style.right =  "25px";
			},
			maximizeControl: function(e) {
				this.element.style.display = '';
				this.showToggle(false);
				if (e != null) {
				OpenLayers.Event.stop(e);
				}
				var copyright = $("copyright");
				if(copyright)
					copyright.style.right =  "220px";
			},
			mapOptions:mapOptions
		});
		this.map.addControl(ov);
	}
	
	// listen to session changing events (addLayer and removeLayer are
	// signaled by datachange of activeServicesPanel)
	this.map.events.register('moveend', self.map, function(evt) {
        if(this.sessionWriteEnable) {
        	self.onStateChanged();
        }
	});
	
	this.activeServicesPanel.on('datachanged', this.onStateChanged, this);
	this.listenToStateChanges = true;
	if (de.ingrid.mapclient.Configuration.getSettings("searchHasInfoDialog")) {
		de.ingrid.mapclient.Message.showInfo(i18n('tUmDerSucheEinenRaumbezugHinzuzufuegenBitteEineAuswahlTreffen'),{width:450, delay:900000});
	}
};

/**
 * Display a measurement result
 *
 * @param event
 *            Event with measure, units, order, and geometry properties as
 *            received from OpenLayers.Control.Measure
 */
de.ingrid.mapclient.frontend.PanelWorkspace.prototype.measure = function(event) {
	var units = event.units;
	var order = event.order;
	var measure = event.measure;
	var title = '';
	var content = '';
	if (order == 1) {
		title += i18n('Strecke');
		content += measure.toFixed(3) + " " + units;
	} else {
		title += i18n('Flaeche');
		content += measure.toFixed(3) + " " + units + "<sup>2</" + "sup>";
	}
	new Ext.Window({
		title: title,
		width: 120,
		height: 60,
		layout: 'fit',
		items: {
			border: false,
			bodyStyle: 'padding: 5px',
			html: content
		}
	}).show();
};

/**
 * Method to be called, when any data changes that needs to be stored on the
 * server. To prevent execution set listenToStateChanges to false
 */
de.ingrid.mapclient.frontend.PanelWorkspace.prototype.onStateChanged = function() {
	var self = this;
	if (this.listenToStateChanges) {
    	// try to avoid multiple session save actions
		// events that are fired within 100ms are canceled
		// so only the last event of multiple fired events will be 
		// used. this assures that all changes to the map are taken
		// into account within the saved session.
		if (self.stateChangeTimer) {
    		clearTimeout(self.stateChangeTimer);
    	}
    	self.stateChangeTimer = setTimeout(function(){self.save(true)}, 100); 
	}
};

/**
 * Store the current map state along with the given title and description on the server.
 *
 * @param isTemporary Boolean indicating, if the data should be saved in the current session
 * 		only or permanently
 * @param title The map state title (optional)
 * @param description The map state description (optional)
 */
de.ingrid.mapclient.frontend.PanelWorkspace.prototype.save = function(isTemporary, title, description) {
	// set parameters according to save type
	var responseHandler = (isTemporary == true) ? undefined : {
		success: function(responseText) {
			de.ingrid.mapclient.Message.showInfo(de.ingrid.mapclient.Message.MAP_SAVE_SUCCESS);
		},
		failure: function(responseText) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.MAP_SAVE_FAILURE);
		}
	};

	// create the session state instance
	var data = new de.ingrid.mapclient.frontend.data.SessionState({
		title: title,
		description: description,
		map: this.map,
		activeServices: this.activeServicesPanel.getServiceList()
	});
	this.session.save(data, isTemporary, responseHandler);
};

/**
 * Load the user data with the given url or id from the server. If neither url nor id are given,
 * the last configuration for the current session will be loaded
 *
 * @param shortUrl The short url of the data to load (optional, if given, id will be ignored)
 * @param id The id of the data (optional)
 */
de.ingrid.mapclient.frontend.PanelWorkspace.prototype.load = function(shortUrl, id) {
	// set parameters according to load type
	var safeStateAfterLoad = id != undefined ? true : false;

	// prevent recording state changes
	this.listenToStateChanges = false;

	this.activeServicesPanel.removeAll();
	var state = new de.ingrid.mapclient.frontend.data.SessionState({
		id: id,
		map: this.map,
		activeServices: []
	});

	var self = this;
	this.session.load(state, shortUrl, {
		success: function(responseText) {
			// restore map state
			state.restoreMapState(function() {
				// restore active services
				for (var i = 0, count = state.activeServices.length; i < count; i++) {
					self.activeServicesPanel.addService(state.activeServices[i], false, false, true);
				}
				
				// Copyright
				var wmsCopyright = de.ingrid.mapclient.Configuration.getValue("wmsCopyright")
				if(wmsCopyright){
					var div = self.getElementsByClassName(document, "olMapViewport");
					var copyright = document.createElement('div');
					copyright.setAttribute('id', 'copyright');
					copyright.className = "olCopyrightPosition";
					copyright.innerHTML = wmsCopyright;
					div[0].appendChild(copyright);
				}
				self.finishInitMap();
				if (safeStateAfterLoad) {
					self.save(true);
				}
			});
		},
		failure: function(responseText) {
			var callback = Ext.util.Functions.createDelegate(function(){
			self.finishInitMap();
			// Copyright
			var wmsCopyright = de.ingrid.mapclient.Configuration.getValue("wmsCopyright")
			if(wmsCopyright){
				var div = self.getElementsByClassName(document, "olMapViewport");
				var copyright = document.createElement('div');
				copyright.setAttribute('id', 'copyright');
				copyright.className = "olCopyrightPosition";
				copyright.innerHTML = wmsCopyright;
				div[0].appendChild(copyright);
				}
			}
			, self);
			self.initDefaultMap(callback);
		}
	});
};

de.ingrid.mapclient.frontend.PanelWorkspace.prototype.getElementsByClassName = function (node, classname) {
    var a = [];
    var re = new RegExp('(^| )'+classname+'( |$)');
    var els = node.getElementsByTagName("*");
    for(var i=0,j=els.length; i<j; i++)
        if(re.test(els[i].className))a.push(els[i]);
    return a;
};                
  

