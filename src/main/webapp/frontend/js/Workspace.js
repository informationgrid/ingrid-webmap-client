/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend");

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
				hasDownloadTool : true
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

			kmlArray : []

		});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.Workspace.prototype.initComponent = function() {
	if (this.session == null) {
		throw "Workspace has to be created with a Session instance";
	}
	var self = this;

	// create the map (default projection is WGS 84)
	this.map = new OpenLayers.Map({
				fractionalZoom : true,
				projection : new OpenLayers.Projection("EPSG:4326"),
				// this will be used by some controls (ArgParser, MousePosition,
				// Permalink)
				displayProjection : new OpenLayers.Projection("EPSG:4326"),
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
				border : false,
				map : this.map
			});

	// create the accordion for the west panel
	var accordionItems = [];

	// a) layer tree
	this.activeServicesPanel = new de.ingrid.mapclient.frontend.controls.ActiveServicesPanel(
			{
				map : this.map
			});
	accordionItems.push(this.activeServicesPanel);

	// b) available service categories
	var serviceCategories = de.ingrid.mapclient.Configuration
			.getValue("serviceCategories");
	if (serviceCategories) {
		for (var i = 0, count = serviceCategories.length; i < count; i++) {
			var panel = new de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel(
					{
						serviceCategory : serviceCategories[i],
						activeServicesPanel : this.activeServicesPanel
					});
			accordionItems.push(panel);
		}
	}

	// c) search panel

	var searchPanel = new Ext.FormPanel({
				id : 'searchPanel',
				title : 'Suche',
				autoScroll : true,
				labelWidth : 150,
				items : [{
							xtype : 'label',
							fieldLabel : 'Suchbegriff eingeben'
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
							text : 'Suchen',
							xtype : 'button',
							formBind : true,
							handler : function() {
								de.ingrid.mapclient.frontend.Workspace.prototype
										.search(
												Ext.getCmp('search').getValue(),
												self);
								console.debug('form submitted');

							}
						}]
			})
	accordionItems.push(searchPanel);

	// create the legend panel
	var legendPanel = new GeoExt.LegendPanel({
				layerStore : this.activeServicesPanel.getLayerStore(),
				autoScroll : true,
				border : false
			});

	// create the panel for the west region
	var westPanel = new Ext.TabPanel({
				id : 'west',
				region : 'west',
				activeTab : 0,
				width : 200,
				split : true,
				collapsible : true,
				items : [{
							id : 'Dienste',
							title : 'Dienste',
							closable : false,
							layout : 'accordion',
							layoutConfig : {
								animate : true
							},
							border : false,
							items : accordionItems
						}, {
							title : 'Legende',
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
					tooltip : 'Info',
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
					tooltip : 'Zur&uuml;ck'
				}));
		toolbarItems.push(new GeoExt.Action({
					control : historyCtrl.next,
					disabled : true,
					iconCls : 'iconZoomNext',
					tooltip : 'Vor'
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
			tooltip : 'Messen',
			menu : [new Ext.menu.CheckItem({
						id : 'measurePath',
						text : 'Strecke',
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
						text : 'Fl&auml;che',
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
	if (this.viewConfig.hasInfoTool) {
		toolbarItems.push(new Ext.Button({
					iconCls : 'iconPrint',
					tooltip : 'Drucken',
					handler : function(btn) {
						new de.ingrid.mapclient.frontend.controls.PrintDialog({
									mapPanel : mapPanel,
									legendPanel : legendPanel
								});
					}
				}));
	}

	// e) load tool
	if (this.viewConfig.hasLoadTool) {
		toolbarItems.push(new Ext.Button({
					iconCls : 'iconLoad',
					tooltip : 'Laden',
					disabled : !this.session.hasUserId(),
					handler : function(btn) {
						var dlg = new de.ingrid.mapclient.frontend.controls.LoadDialog(
								{
									session : self.session
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
	if (this.viewConfig.hasSaveTool) {
		toolbarItems.push(new Ext.Button({
			iconCls : 'iconSave',
			tooltip : 'Speichern',
			disabled : !this.session.hasUserId(),
			handler : function(btn) {
				var dlg = new de.ingrid.mapclient.frontend.controls.SaveDialog();
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
			tooltip : 'Karte herunterladen',
			handler : function(btn) {
				var dia = new de.ingrid.mapclient.frontend.controls.DownloadDialog();
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
					tooltip : 'Hilfe',
					handler : function(btn) {
						window.open(de.ingrid.mapclient.HELP_URL);
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
					viewConfig : this.viewConfig
				});
	}

	this.on('afterrender', function(el) {
				if (settingsDialog && self.viewConfig.hasSettings) {
					mapPanel.items.add(settingsDialog); // constrain to mapPanel
					settingsDialog.anchorTo(mapPanel.el, 'tr-tr', [-10, 10]);
				}
			});

	// create the panel for the center region
	var centerPanel = new Ext.Panel({
				region : 'center',
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
				self.activeServicesPanel.addService(service);

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
	// create the overview layer
	// (we need to configure the baselayer explicitly,
	// otherwise it is created by the clone operation
	// which does not copy the isBaseLayer property)
	var overviewLayer = this.map.baseLayer.clone();
	overviewLayer.isBaseLayer = true;

	// add controls to map

	var controls = [new OpenLayers.Control.Navigation(),
			new OpenLayers.Control.PanZoomBar(),
			new OpenLayers.Control.ScaleLine(),
			new OpenLayers.Control.MousePosition(),
			new OpenLayers.Control.OverviewMap({
						layers : [overviewLayer]
					}), new OpenLayers.Control.KeyboardDefaults()];

	if (this.viewConfig.hasPermaLink) {
		controls.push(new OpenLayers.Control.Permalink());
		controls.push(new OpenLayers.Control.Permalink('permalink'));
	}
	this.map.addControls(controls);

	// listen to session changing events (addLayer and removeLayer are
	// signaled by datachange of activeServicesPanel)
	this.map.events.on({
				// 'addlayer': this.onStateChanged,
				// 'removelayer': this.onStateChanged,
				'changelayer' : this.onStateChanged,
				'moveend' : this.onStateChanged,
				'changebaselayer' : this.onStateChanged,
				scope : this
			});
	this.activeServicesPanel.on('datachanged', this.onStateChanged, this);

	this.listenToStateChanges = true;
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
		title += 'Strecke';
		content += measure.toFixed(3) + " " + units;
	} else {
		title += 'Fl&auml;che';
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
	if (this.listenToStateChanges) {
		this.save(true);
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
	var responseHandler = (isTemporary == true) ? undefined : {
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
de.ingrid.mapclient.frontend.Workspace.prototype.load = function(shortUrl, id) {
	// set parameters according to load type
	var safeStateAfterLoad = id != undefined ? true : false;

	// prevent recording state changes
	this.listenToStateChanges = false;

	this.activeServicesPanel.removeAll();
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
							.addService(state.activeServices[i]);
				}
				// restore active services
				for (var i = 0, count = state.activeServices.length; i < count; i++) {
					self.activeServicesPanel
							.addService(state.activeServices[i]);
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
