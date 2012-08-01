/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend");
// we extend the map because we dont listen to the default map events anymore
// we write the session on the setCenter method now
// also we disable this method on load, we enable it on finishing the whole init process
de.ingrid.mapclient.frontend.IngridMap = Ext.extend(OpenLayers.Map,{
	constructor: function(config){
		de.ingrid.mapclient.frontend.IngridMap.superclass.constructor.call(this, config);
	},
	sessionWriteEnable:false,
	containingViewport:null,
	setCenter: function(lonlat, zoom, dragging, forceZoomChange) {
        de.ingrid.mapclient.frontend.IngridMap.superclass.setCenter.call(this, lonlat, zoom, dragging, forceZoomChange);
//        if(this.sessionWriteEnable)
//        this.containingViewport.onStateChanged();
    }
});
/**
 * @class Workspace is the main gui component for the frontend.
 */
de.ingrid.mapclient.frontend.Workspace = Ext.extend(Ext.Viewport, {
			layout : 'border',
			monitorResize : true,

			/**
			 * @cfg The initial map url to load. This is typically a short url
			 *      which the server maps to a user data url (optional)
			 */
			mapUrl : null,

			/**
			 * @cfg de.ingrid.mapclient.frontend.data.Session instance
			 */
			session : null,

			/**
			 * @cfg The view configuration. The default configuration lists all
			 *      known properties:
			 */
			viewConfig : {
				hasServicesPanel : true,
				hasInfoTool : true, 
				hasHistoryTool : true,
				hasMeasureTool : true, 
				hasPrintTool : true,
				hasLoadTool : true,
				hasSaveTool : true,
				hasHelpTool : true,
				hasProjectionsList : true,
				hasScaleList : true,
				hasAreasList : true,
				hasPermaLink : true,
				hasDownloadTool : true,
				hasZoomTool: true
			},

			/**
			 * The OpenLayers.Map instance
			 */
			map : null,

			/**
			 * The main layer tree
			 */
			activeServicesPanel : null,

			/**
			 * Indicates if workspace state changes should be handled or not
			 * 
			 * @see de.ingrid.mapclient.frontend.Workspace.onStateChanged
			 */
			listenToStateChanges : false,

			kmlArray : [],
			ctrls: []

		});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.Workspace.prototype.initComponent = function() {
	if (this.session == null) {
		throw "Workspace has to be created with a Session instance";
	}
	var self = this;
	var navigationControl = new OpenLayers.Control.Navigation();
	this.ctrls['navigationControl'] = navigationControl;
	// create the map (default projection is WGS 84)
	this.map = new de.ingrid.mapclient.frontend.IngridMap({
				containingViewport:self,
				fractionalZoom : true,
				projection : new OpenLayers.Projection("EPSG:4326"),
				// this will be used by some controls (ArgParser, MousePosition,
				// Permalink)
				displayProjection : new OpenLayers.Projection("EPSG:4326"),
				// if we dont add these controls on init
				// we get the default controls plus the added ones
				// adding controls at init impedes default controls
				controls : [navigationControl,
							new OpenLayers.Control.PanZoomBar(),
							new OpenLayers.Control.ScaleLine(),
							new OpenLayers.Control.MousePosition()]
			});

	// create the map container
	var mapPanel = new GeoExt.MapPanel({
				border : false,
				map : this.map
			});

	// create the accordion for the west panel
	var accordionItems = [];

	// a) layer tree
	this.activeServicesPanel = new de.ingrid.mapclient.frontend.controls.ActiveServicesPanel(
			{
				map : this.map,
				ctrls: self.ctrls
			});
	accordionItems.push(this.activeServicesPanel);

	// b) available service categories
	var mapServiceCategories = de.ingrid.mapclient.Configuration
			.getValue("mapServiceCategories");
	if (mapServiceCategories) {
		for (var i = 0, count = mapServiceCategories.length; i < count; i++) {
			var panel = new de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel(
					{
						mapServiceCategory : mapServiceCategories[i],
						activeServicesPanel : this.activeServicesPanel
					});
			accordionItems.push(panel);
		}
	}

	// c) search panel

	var searchPanel = new Ext.FormPanel({
				id : 'searchPanel',
				title : i18n('tSuche'),
				autoScroll : true,
				labelWidth : 150,
				items : [{
							xtype : 'label',
							fieldLabel : i18n('tSuchbegriffEingeben')
						}, {
							name : "search",
							id : 'search',
							allowBlank : false,
							xtype : 'textfield',
							cls : 'webmapclient_searchpanel',
							html : '' // style class only gets rendered with
										// this setting...
						}, {
							name : 'searchButton',
							text : i18n('tSuchen'),
							xtype : 'button',
							formBind : true,
							handler : function() {
								de.ingrid.mapclient.frontend.Workspace.prototype
										.search(
												Ext.getCmp('search').getValue(),
												self);
							}
						}],
				keys:[{ key: [Ext.EventObject.ENTER], handler: function() {
                    de.ingrid.mapclient.frontend.Workspace.prototype
										.search(Ext.getCmp('search').getValue(),
												self);
                			}
            		}]	
			})
	accordionItems.push(searchPanel);

	// create the legend panel
	var legendPanel = new GeoExt.LegendPanel({
				layerStore : this.activeServicesPanel.getLayerStore(),
				autoScroll : true,
				border : false,
				cls: "mapclientLegendPanel"
			});

	// create the panel for the west region
	var westPanel = new Ext.TabPanel({
				id : 'west',
				region : 'west',
				defaults:{ autoScroll:true }, 
    			activeTab : 0,
				width : 200,
				split : true,
				collapsible : true,
				items : [{
							id : 'Dienste',
							title : i18n('tDienste'),
							closable : false,
							layout : 'accordion',
							layoutConfig : {
								animate : true
							},
							border : false,
							items : accordionItems
						}, {
							title : i18n('tLegende'),
							items : legendPanel
						}]
			});

	// create the toolbar items
	var toolbarItems = []; 

	// a) feature tool
				
	if (this.viewConfig.hasInfoTool) {

		var featureInfoControl = new de.ingrid.mapclient.frontend.controls.FeatureInfoDialog(
				{
					map : this.map
				}); 
		this.map.events.on({
					'click' : featureInfoControl.query,
					scope : featureInfoControl
				});

		toolbarItems.push(new Ext.Button({
					iconCls : 'iconInfo',
					tooltip : i18n('tObjektinformationen'),
					enableToggle : true, 
					handler : function(btn) {
						if (btn.pressed) {
							featureInfoControl.activate();
						} else {
							featureInfoControl.deactivate();
						}
					}
				}));

	}

	// b) history tool
	if (this.viewConfig.hasHistoryTool) {
		// create the OpenLayers control
		var historyCtrl = new OpenLayers.Control.NavigationHistory();
		this.map.addControl(historyCtrl);

		toolbarItems.push(new GeoExt.Action({
					control : historyCtrl.previous,
					disabled : true,
					iconCls : 'iconZoomPrev',
					tooltip : i18n('tZurueck')
				}));
		toolbarItems.push(new GeoExt.Action({
					control : historyCtrl.next,
					disabled : true,
					iconCls : 'iconZoomNext',
					tooltip : i18n('tVor')
				}));
	}
 	if (this.viewConfig.hasZoomTool) {

 
		toolbarItems.push(new Ext.Button({
					iconCls : 'iconZoom',
					tooltip : i18n('tKarteZoomen'),
					enableToggle : false, 
					handler : function(btn) {
						self.map.zoomToMaxExtent();
					}
				}));

	}
	// c) measure tool
	if (this.viewConfig.hasMeasureTool) {
		// create the OpenLayers control
		var measurePathCtrl = new OpenLayers.Control.Measure(
				OpenLayers.Handler.Path, {
					persist : true
				});
		measurePathCtrl.events.on({
					"measure" : this.measure
				});
		this.map.addControl(measurePathCtrl);
		var measurePolygonCtrl = new OpenLayers.Control.Measure(
				OpenLayers.Handler.Polygon, {
					persist : true
				});
		measurePolygonCtrl.events.on({
					"measure" : this.measure
				});
		// activate animated toolbar at initial load of map
		this.map.addControl(measurePolygonCtrl);
		var loadingPanel = new OpenLayers.Control.LoadingPanel();
		this.map.addControl(loadingPanel);
		loadingPanel.activate();

		toolbarItems.push(new Ext.SplitButton({
			iconCls : 'iconMeassure',
			tooltip : i18n('tMessen'),
			menu : [new Ext.menu.CheckItem({
						id : 'measurePath',
						text : i18n('tStrecke'),
						toggleGroup : 'measure',
						listeners : {
							checkchange : function(item, checked) {
								if (checked) {
									Ext.getCmp('measurePolygon')
											.setChecked(false);
									measurePathCtrl.activate();
								} else {
									measurePathCtrl.deactivate();
								}
							}
						}
					}), new Ext.menu.CheckItem({
						id : 'measurePolygon',
						text : i18n('tFlaeche'),
						toggleGroup : 'measure',
						listeners : {
							checkchange : function(item, checked) {
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
	toolbarItems.push(new Ext.Toolbar.Fill());

	// d) print tool
	var printActive = false;
	var printDia = null;
	if (this.viewConfig.hasInfoTool) {
		toolbarItems.push(new Ext.Button({
					iconCls : 'iconPrint',
					tooltip : i18n('tDrucken'),
					handler : function(btn) {
						
						if(!printActive){
						printDia = new de.ingrid.mapclient.frontend.controls.PrintDialog({
									mapPanel : mapPanel,
									legendPanel : legendPanel
								});
								printActive = true;
								self.ctrls['keyboardControl'].deactivate();
						}
						printDia.on('close', function(){
							printActive = false;
							self.ctrls['keyboardControl'].activate();
						})
						
					}
				}));
	}

	// e) load tool
	if (this.viewConfig.hasLoadTool) {
		toolbarItems.push(new Ext.Button({
					iconCls : 'iconLoad',
					tooltip : i18n('tLaden'),
					disabled : !this.session.hasUserId(),
					handler : function(btn) {
						var dlg = new de.ingrid.mapclient.frontend.controls.LoadDialog(
								{
									session : self.session
								});
								self.ctrls.keyboardControl.deactivate();
						dlg.on('close', function(p) {
									if (dlg.isLoad()) {
										var supressMsgs = true;
										self.load(undefined, dlg.getFileId(), supressMsgs);
									}
									self.ctrls.keyboardControl.activate();
								});
					}
				}));
	}

	// f) save tool
	if (this.viewConfig.hasSaveTool) {
		toolbarItems.push(new Ext.Button({
			iconCls : 'iconSave',
			tooltip : this.session.hasUserId() ? i18n('tSpeichern'):i18n('tZumSpeichernErstEinloggen'),
			disabled : !this.session.hasUserId(),
			handler : function(btn) {
				var dlg = new de.ingrid.mapclient.frontend.controls.SaveDialog({ctrls:self.ctrls});
				dlg.on('close', function(p) {
							if (dlg.isSave()) {
								self.save(false, dlg.getTitle(), dlg
												.getDescription());
							}
						});
			}
		}));
	}

	// g) download tool
	if (this.viewConfig.hasDownloadTool) {
		toolbarItems.push(new Ext.Button({
			iconCls : 'iconDownload',
			tooltip : i18n('tKarteHerunterladen'),
			handler : function(btn) {
				var dia = new de.ingrid.mapclient.frontend.controls.DownloadDialog({ctrls:self.ctrls});
				dia.on('close', function(p) {
							if (dia.isSave()) {
								self.download(dia.getTitle());
							}
						});
				}
		
			}
		));
	}
	// h) help tool
	if (this.viewConfig.hasInfoTool) {
		toolbarItems.push(new Ext.Button({
					iconCls : 'iconHelp',
					tooltip : i18n('tHilfe'),
					handler : function(btn) {
						popupWin = window.open(de.ingrid.mapclient.HELP_URL, "InternalWin", 'width=750,height=550,resizable=yes,scrollbars=yes,location=no,toolbar=yes');
  						popupWin.focus();
					}
				}));
	}

	// create the toolbar
	var toolbar = new Ext.Toolbar({
				items : toolbarItems
			});

	// create the settings dialog
	var settingsDialog;
	if (this.viewConfig.hasSettings) {
		settingsDialog = new de.ingrid.mapclient.frontend.controls.SettingsDialog(
				{
					map : this.map,
					viewConfig : this.viewConfig,
					ctrls: self.ctrls
				});

	}

	this.on('afterrender', function(el) {
				if (settingsDialog && self.viewConfig.hasSettings) {
					mapPanel.items.add(settingsDialog); // constrain to mapPanel
					settingsDialog.anchorTo(mapPanel.el, '', [-10, 10]);
				}
			});
	westPanel.on('resize', function(el) {
				if (settingsDialog && self.viewConfig.hasSettings) {
					settingsDialog.setPosition(50,50);
				}
			});
	// create the panel for the center region
	var centerPanel = new Ext.Panel({
				region : 'center',
				id: 'centerPanel',
				layout : 'fit',
				items : mapPanel,
				tbar : toolbar
			});
	// dummy panel for the header
	var northPanel = new Ext.Panel({
				region : 'north',
				baseCls : '',
				height : this.viewConfig.spacerTop
						? this.viewConfig.spacerTop
						: 0
			});

	// add the items according to the selected configuration
	// (center panel is mandatory)
	var items;
	if (this.viewConfig.spacerTop) {
		items = [centerPanel, northPanel];
	} else {
		items = [centerPanel];
	}
	if (this.viewConfig.hasServicesPanel) {
		items.push(westPanel);
	}

	Ext.apply(this, {
				items : items
			});

	de.ingrid.mapclient.frontend.Workspace.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.Workspace.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.Workspace.superclass.onRender.apply(this,
			arguments);

	if (this.mapUrl) {
		// load the map defined in the mapUrl
		this.load(this.mapUrl);
	} else {
		// try to load existing session data
		this.load();
		// always init default map
		this.activeServicesPanel.on('datachanged', this.onStateChanged, this);
		this.listenToStateChanges = true;
	}
};

/**
 * Initialize the map with the default service
 * 
 * @param callback
 *            Function to be called after initialization finished
 */
de.ingrid.mapclient.frontend.Workspace.prototype.initDefaultMap = function(
		callback) {

	// initialize the map with the default service
	var self = this;
	var capUrl = de.ingrid.mapclient.Configuration.getValue("wmsCapUrl");
	de.ingrid.mapclient.frontend.data.Service.load(capUrl, function(service) {
				// get the selected layer names and base layer name from
				// the configuration
				var selectedLayers = de.ingrid.mapclient.Configuration
						.getValue("layers");
				var selectedLayerNames = [];
				var baseLayerName = '';
				for (var i = 0, count = selectedLayers.length; i < count; i++) {
					var layer = selectedLayers[i];
					selectedLayerNames.push(layer.name);
					if (layer.isBaseLayer == true) {
						baseLayerName = layer.name;
					}
				}

				// process the layers
				var layers = service.getLayers();
				for (var i = 0, count = layers.length; i < count; i++) {
					var layer = layers[i];

					// set the layer visibility according to the default
					// layer selection
					var isDefaultLayer = selectedLayerNames.indexOf(layer.name) != -1
							? true
							: false;
					// set the baselayer attribute
					var isBaseLayer = (layer.name == baseLayerName)
							? true
							: false;
					layer.visibility = isDefaultLayer;
					layer.isBaseLayer = isBaseLayer;

					// bind the layer to the map
					self.map.addLayer(layer);
				}

				// set initial projection, if no projection has been defined,
				// use default projection from map

				// initialize the projections list
				var projections = de.ingrid.mapclient.Configuration
						.getValue('projections');
				if (projections && projections.length > 0) {
					de.ingrid.mapclient.frontend.data.MapUtils
							.assureProj4jsDef(projections[0].epsgCode,
									function() {
										de.ingrid.mapclient.frontend.data.MapUtils
												.changeProjection(
														projections[0].epsgCode,
														self.map, this, true);
										self.map.events.triggerEvent("zoomend");
									});
				} else {
					// set initial bounding box for the map (expected to be WGS
					// 84)
					// note: this must be done after layouting the map!
					var bbox = de.ingrid.mapclient.Configuration
							.getValue("mapExtend");
					var bounds = new OpenLayers.Bounds.fromArray([bbox.west,
							bbox.south, bbox.east, bbox.north]);
					// bounds.transform(new OpenLayers.Projection("EPSG:4326"),
					// self.map.getProjectionObject());
					self.map.zoomToExtent(bounds);
				}

				// add default service to active services
				self.activeServicesPanel.addService(service, false, true);

				if (callback instanceof Function) {
					callback();
				}
			});
};

/**
 * Create the OpenLayers controls for the map.
 */
de.ingrid.mapclient.frontend.Workspace.prototype.finishInitMap = function() {

	var self = this;

	// add controls to map
	var keyboardControl = new OpenLayers.Control.KeyboardDefaults();
	var controls = [new OpenLayers.Control.Navigation(),
			new OpenLayers.Control.PanZoomBar(),
			new OpenLayers.Control.ScaleLine(),
			new OpenLayers.Control.MousePosition(),
			keyboardControl];
	
	this.ctrls['keyboardControl'] = keyboardControl;
	if (this.viewConfig.hasPermaLink) {
		controls.push(new OpenLayers.Control.Permalink());
		controls.push(new OpenLayers.Control.Permalink('permalink'));
	}
	this.map.addControls(controls);
	// create the overview layer
	// (we cannot clone the baselayer here, because it would use wrong 
	// settings form the main map (zoom levels, etc.).)
	var overviewLayer = new OpenLayers.Layer.WMS(
			this.map.baseLayer.name, 
            this.map.baseLayer.url,
            {layers: this.map.baseLayer.params.LAYERS}
        );
	var ov = new OpenLayers.Control.OverviewMap({
		layers : [overviewLayer],
		minRatio: 30, maxRatio: 30
		
	});
	this.map.addControl(ov);
	
	// listen to session changing events (addLayer and removeLayer are
	// signaled by datachange of activeServicesPanel)
	this.map.events.register('moveend', self.map, function(evt) {
        if(this.sessionWriteEnable) {
        	self.onStateChanged();
        }
	});
	this.map.events.register('changelayer', self.map, function(evt) {
        if(this.sessionWriteEnable) {
            self.onStateChanged();
        }
	});	
	this.activeServicesPanel.on('datachanged', this.onStateChanged, this);

	this.listenToStateChanges = true;
	this.map.sessionWriteEnable = true;
};

/**
 * Display a measurement result
 * 
 * @param event
 *            Event with measure, units, order, and geometry properties as
 *            received from OpenLayers.Control.Measure
 */
de.ingrid.mapclient.frontend.Workspace.prototype.measure = function(event) {
	var units = event.units;
	var order = event.order;
	var measure = event.measure;
	var title = '';
	var content = '';
	if (order == 1) {
		title += i18n('tStrecke');
		content += measure.toFixed(3) + " " + units;
	} else {
		title += i18n('tFlaeche');
		content += measure.toFixed(3) + " " + units + "<sup>2</" + "sup>";
	}
	new Ext.Window({
				title : title,
				width : 120,
				height : 60,
				layout : 'fit',
				items : {
					border : false,
					bodyStyle : 'padding: 5px',
					html : content
				}
			}).show();
};

/**
 * Method to be called, when any data changes that needs to be stored on the
 * server. To prevent execution set listenToStateChanges to false
 */


de.ingrid.mapclient.frontend.Workspace.prototype.onStateChanged = function() {
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
 * Store the current map state along with the given title and description on the
 * server.
 * 
 * @param isTemporary
 *            Boolean indicating, if the data should be saved in the current
 *            session only or permanently
 * @param title
 *            The map state title (optional)
 * @param description
 *            The map state description (optional)
 */
de.ingrid.mapclient.frontend.Workspace.prototype.save = function(isTemporary,
		title, description) {
	// set parameters according to save type
		var cntrPanel = Ext.getCmp('centerPanel');
		var responseHandler = (isTemporary == true) ? undefined : {
		success : function(responseText) {
			de.ingrid.mapclient.Message.showInfo(i18n('tKarteGespeichert'));
		},
		failure : function(responseText) {
			de.ingrid.mapclient.Message.showInfo(i18n('tKonnteKarteNichtSpeichern', {iconCls:"x-icon-error", title:i18n('tError')}));
			}
		};

	// create the session state instance
	var data = new de.ingrid.mapclient.frontend.data.SessionState({
				title : title,
				description : description,
				map : this.map,
				activeServices : this.activeServicesPanel.getServiceList(),
				kmlArray : this.kmlArray
			});
	this.session.save(data, isTemporary, responseHandler);
};

/**
 * Store the current map state along with the given title and description on the
 * server.
 * 
 * @param title
 *            The map state title (optional)
 * @param description
 *            The map state description (optional)
 */
de.ingrid.mapclient.frontend.Workspace.prototype.download = function(
		title) {
	// set parameters according to save type
	var responseHandler = {
		success : function(responseText) {
			de.ingrid.mapclient.Message
					.showInfo(de.ingrid.mapclient.Message.MAP_SAVE_SUCCESS);
		},
		failure : function(responseText) {
			de.ingrid.mapclient.Message
					.showError(de.ingrid.mapclient.Message.MAP_SAVE_FAILURE);
		}
	};

	// create the session state instance
	var data = new de.ingrid.mapclient.frontend.data.SessionState({
				title : title,
				map : this.map,
				activeServices : this.activeServicesPanel.getServiceList(),
				kmlArray : this.kmlArray
			});
	this.session.download(data, responseHandler);
};
/**
 * Load the user data with the given url or id from the server. If neither url
 * nor id are given, the last configuration for the current session will be
 * loaded
 * 
 * @param shortUrl
 *            The short url of the data to load (optional, if given, id will be
 *            ignored)
 * @param id
 *            The id of the data (optional)
 */
de.ingrid.mapclient.frontend.Workspace.prototype.load = function(shortUrl, id, supressMsgs) {
	// set parameters according to load type
	var safeStateAfterLoad = id != undefined ? true : false;

	// prevent recording state changes
	this.listenToStateChanges = false;

	this.activeServicesPanel.removeAll(supressMsgs);
	var state = new de.ingrid.mapclient.frontend.data.SessionState({
				id : id,
				map : this.map,
				activeServices : [],
				kmlArray : []
			});
	var self = this;
	this.session.load(state, shortUrl, {
		success : function(responseText) {
			if (!(typeof(state.kmlArray) === "undefined")
					&& state.kmlArray.length > 0) {
				// Add KML if session with added KML exist
				if (kml != null) {
					var title = kml.title;
					var url = kml.url;
					var isAdded = false;

					// Check for existing KML
					if (title != undefined && url != undefined) {
						for (var i = 0, count = state.kmlArray.length; i < count; i++) {
							var addedKml = state.kmlArray[i];
							var kmlTitle = addedKml.title;
							var kmlUrl = addedKml.url;
							if (kmlTitle == undefined) {
								var addedKmlTitle = addedKml[0];
								if (addedKmlTitle != undefined) {
									var addedKmlTitleValue = addedKmlTitle[1];
									if (addedKmlTitleValue != undefined) {
										kmlTitle = addedKmlTitleValue;
									}
								}
							}

							if (kmlUrl == undefined) {
								var addedKmlUrl = addedKml[1];
								if (addedKmlUrl != undefined) {
									var addedKmlUrlValue = addedKmlUrl[1];
									if (addedKmlUrlValue != undefined) {
										kmlUrl = addedKmlUrlValue;
									}
								}
							}
							if (kmlTitle == title && kmlUrl == url) {
								isAdded = true;
								break;
							}
						}

						if (!isAdded) {
							state.kmlArray.push(kml);
						}
					}
				}

				// Load KML by "Zeige Karte" from Session
				for (var i = 0, count = state.kmlArray.length; i < count; i++) {
					var addedKml = state.kmlArray[i];
					var kmlTitle = addedKml.title;
					var kmlUrl = addedKml.url;
					if (kmlTitle == undefined) {
						var addedKmlTitle = addedKml[0];
						if (addedKmlTitle != undefined) {
							var addedKmlTitleValue = addedKmlTitle[1];
							if (addedKmlTitleValue != undefined) {
								kmlTitle = addedKmlTitleValue;
							}
						}
					}

					if (kmlUrl == undefined) {
						var addedKmlUrl = addedKml[1];
						if (addedKmlUrl != undefined) {
							var addedKmlUrlValue = addedKmlUrl[1];
							if (addedKmlUrlValue != undefined) {
								kmlUrl = addedKmlUrlValue;
							}
						}
					}
					if (kmlTitle != undefined && kmlUrl != undefined) {
						self.kmlArray.push({
									url : kmlUrl,
									title : kmlTitle
								});
					}
				}
				self.activeServicesPanel.addKml(self.kmlArray);
			} else {
				// Add KML if session exist
				if (kml != null) {
					self.kmlArray.push(kml);
					state.kmlArray.push(kml);
					self.activeServicesPanel.addKml(self.kmlArray);
				}
			}
			// restore map state
			state.restoreMapState(function() {
				// restore active services
				for (var i = 0, count = state.activeServices.length; i < count; i++) {
					self.activeServicesPanel
							.addService(state.activeServices[i],false,true);
				}

				// Load WMS by "Zeige Karte" from Session
				if (wms != null) {
					var serviceWMS = de.ingrid.mapclient.frontend.data.Service
							.createFromCapabilitiesUrl(wms);
					var callback = Ext.util.Functions.createDelegate(
							self.activeServicesPanel.addService,
							self.activeServicesPanel);
					de.ingrid.mapclient.frontend.data.Service.load(serviceWMS
									.getCapabilitiesUrl(), callback);
				}

				self.finishInitMap();
				if (safeStateAfterLoad) {
					self.save(true);
				}
			});

		},
		failure : function(responseText) {
			var callback = Ext.util.Functions.createDelegate(
					self.finishInitMap, self);
			self.initDefaultMap(callback);

			// Add WMS "Zeige Karte"
			if (wms != null) {
				var serviceWMS = de.ingrid.mapclient.frontend.data.Service
						.createFromCapabilitiesUrl(wms);
				var callback = Ext.util.Functions.createDelegate(
						self.activeServicesPanel.addService,
						self.activeServicesPanel);
				de.ingrid.mapclient.frontend.data.Service.load(serviceWMS
								.getCapabilitiesUrl(), callback);
			}

			// Add KML "Zeige Punktkoordinaten"
			if (kml != null) {
				self.kmlArray.push(kml);
				self.activeServicesPanel.addKml(self.kmlArray);
			}
		}
	});
	de.ingrid.mapclient.frontend.Workspace.prototype.search = function(
			searchTerm, self) {
		var responseHandler = {
			success : function(responseText) {
				de.ingrid.mapclient.Message
						.showInfo(de.ingrid.mapclient.Message.SEARCH_SUCCESS);
			},
			failure : function(responseText) {
				de.ingrid.mapclient.Message
						.showError(de.ingrid.mapclient.Message.SEARCH_FAILURE);
			}
		};
		var url = de.ingrid.mapclient.SEARCH_URL + "?searchTerm=" + searchTerm;
		Ext.Ajax.request({
			url : url,
			method : 'GET',
			success : function(response, request) {
				var resp = Ext.decode(response.responseText);
				if (typeof self.getComponent('west').getComponent('Dienste')
						.getComponent('searchResults') !== 'undefined') {
					self.getComponent('west').getComponent('Dienste')
							.getComponent('searchResults').destroy();
				}
				var searchCategoryPanel = new de.ingrid.mapclient.frontend.controls.SearchCategoryPanel(
						{
							id : 'searchResults',
							serviceCategory : resp,
							activeServicesPanel : self.activeServicesPanel
						});
				var servicePanel = self.getComponent('west')
						.getComponent('Dienste');

				servicePanel.add(searchCategoryPanel);
				servicePanel.doLayout();
				searchCategoryPanel.expand();
				if (responseHandler
						&& responseHandler.success instanceof Function) {
					responseHandler.success(response.responseText);
				}
			},
			failure : function(response, request) {
				if (responseHandler
						&& responseHandler.failure instanceof Function) {
					responseHandler.failure(response.responseText);
				}
			}
		});
	}
};
/**
 * 
 * @override GeoExt.WMSLegend
 * we overide this method, because some WmsServer have trouble with multiple format paramters
 * so we make sure this paramters is only once in the request 
 * 
 */
GeoExt.WMSLegend.prototype.getLegendUrl = function(layerName, layerNames) {
        var rec = this.layerRecord;
        var url;
        var styles = rec && rec.get("styles");
        var layer = rec.getLayer();
        layerNames = layerNames || [layer.params.LAYERS].join(",").split(",");

        var styleNames = layer.params.STYLES &&
                             [layer.params.STYLES].join(",").split(",");
        var idx = layerNames.indexOf(layerName);
        var styleName = styleNames && styleNames[idx];
        // check if we have a legend URL in the record's
        // "styles" data field
        if(styles && styles.length > 0) {
            if(styleName) {
                Ext.each(styles, function(s) {
                    url = (s.name == styleName && s.legend) && s.legend.href;
                    return !url;
                });
            } else if(this.defaultStyleIsFirst === true && !styleNames &&
                      !layer.params.SLD && !layer.params.SLD_BODY) {
                url = styles[0].legend && styles[0].legend.href;
            }
        }
        if(!url) {
            url = layer.getFullRequestString({
                REQUEST: "GetLegendGraphic",
                WIDTH: null,
                HEIGHT: null,
                EXCEPTIONS: "application/vnd.ogc.se_xml",
                LAYER: layerName,
                LAYERS: null,
                STYLE: (styleName !== '') ? styleName: null,
                STYLES: null,
                SRS: null,
                FORMAT: null
            });
        }
        // add scale parameter - also if we have the url from the record's
        // styles data field and it is actually a GetLegendGraphic request.
        if(this.useScaleParameter === true &&
                url.toLowerCase().indexOf("request=getlegendgraphic") != -1) {
            var scale = layer.map.getScale();
            url = Ext.urlAppend(url, "SCALE=" + scale);
        }
        var params = this.baseParams || {};
        //TODO we change this part since we are having trouble on some servers with the mutliple occurence format parameter
        var formatAlreadyThere = false
        if(url.indexOf("&FORMAT=") != -1  || url.indexOf("&format=") != -1 || url.indexOf("%26FORMAT=") != -1 || url.indexOf("%26format=") != -1)
        	formatAlreadyThere = true;
        Ext.applyIf(params, {FORMAT: 'image/gif'});
        if(url.indexOf('?') > 0 && !formatAlreadyThere) {
            url = Ext.urlEncode(params, url);
        }

        return url;
    }
