/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend");

/**
 * @class Workspace is the main gui component for the frontend.
 */
de.ingrid.mapclient.frontend.Workspace = Ext.extend(Ext.Viewport, {
	layout: 'border',
	monitorResize: true,

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
	 * @cfg The view configuration. The default configuration lists all known
	 *      properties:
	 */
	viewConfig: {
		hasServicesPanel: true,
		hasInfoTool: true,
		hasHistoryTool: true,
		hasMeasureTool: true,
		hasPrintTool: true,
		hasLoadTool: true,
		hasSaveTool: true,
		hasHelpTool: true,
		hasProjectionsList: true,
		hasScaleList: true,
		hasAreasList: true,
		hasPermaLink: true
	},

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
	listenToStateChanges: false
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
		fractionalZoom: true,
		projection: new OpenLayers.Projection("EPSG:4326"),
		// this will be used by some controls (ArgParser, MousePosition,
		// Permalink)
		displayProjection: new OpenLayers.Projection("EPSG:4326")
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
	var serviceCategories = de.ingrid.mapclient.Configuration.getValue("serviceCategories");
	if (serviceCategories) {
		for ( var i = 0, count = serviceCategories.length; i < count; i++) {
			var panel = new de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel({
				serviceCategory: serviceCategories[i],
				activeServicesPanel: this.activeServicesPanel
			});
			accordionItems.push(panel);
		}
	}

	// c) search panel
	accordionItems.push({
		id: 'searchPanel',
		title: 'Suche',
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
			title: 'Dienste',
			closable: false,
			layout: 'accordion',
			layoutConfig: {
				animate: true
			},
			border: false,
			items: accordionItems
		}, {
			title: 'Legende',
			items: legendPanel
		}]
	});

	// create the toolbar items
	var toolbarItems = [];

	// a) feature tool
	if (this.viewConfig.hasInfoTool) {

		var featureInfoControl = new de.ingrid.mapclient.frontend.controls.FeatureInfoDialog({
			map: this.map
		});
		this.map.events.on({
			'click': featureInfoControl.query,
			scope: featureInfoControl
		});

		toolbarItems.push(new Ext.Button({
			iconCls: 'iconInfo',
			tooltip: 'Info',
			enableToggle: true,
			handler: function(btn) {
				if (btn.pressed) {
					featureInfoControl.activate();
				}
				else {
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
			control: historyCtrl.previous,
			disabled: true,
			iconCls: 'iconZoomPrev',
			tooltip: 'Zurück'
		}));
		toolbarItems.push(new GeoExt.Action({
			control: historyCtrl.next,
			disabled: true,
			iconCls: 'iconZoomNext',
			tooltip: 'Vor'
		}));
	}

	// c) measure tool
	if (this.viewConfig.hasMeasureTool) {
		// create the OpenLayers control
		var measurePathCtrl = new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
			persist: true
		});
		measurePathCtrl.events.on({
			"measure": this.measure
		});
		this.map.addControl(measurePathCtrl);
		var measurePolygonCtrl = new OpenLayers.Control.Measure(OpenLayers.Handler.Polygon, {
			persist: true
		});
		measurePolygonCtrl.events.on({
			"measure": this.measure
		});
		this.map.addControl(measurePolygonCtrl);

		toolbarItems.push(new Ext.SplitButton({
			iconCls: 'iconMeassure',
			tooltip: 'Messen',
			menu: [new Ext.menu.CheckItem({
				id: 'measurePath',
				text: 'Strecke',
				toggleGroup: 'measure',
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
				text: 'Fläche',
				toggleGroup: 'measure',
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
	toolbarItems.push(new Ext.Toolbar.Fill());

	// d) print tool
	if (this.viewConfig.hasInfoTool) {
		toolbarItems.push(new Ext.Button({
			iconCls: 'iconPrint',
			tooltip: 'Drucken',
			handler: function(btn) {
				new de.ingrid.mapclient.frontend.controls.PrintDialog({
					mapPanel: mapPanel,
					legendPanel: legendPanel
				});
			}
		}));
	}

	// e) load tool
	if (this.viewConfig.hasLoadTool) {
		toolbarItems.push(new Ext.Button({
			iconCls: 'iconLoad',
			tooltip: 'Laden',
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
	if (this.viewConfig.hasSaveTool) {
		toolbarItems.push(new Ext.Button({
			iconCls: 'iconSave',
			tooltip: 'Speichern',
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
	if (this.viewConfig.hasInfoTool) {
		toolbarItems.push(new Ext.Button({
			iconCls: 'iconHelp',
			tooltip: 'Hilfe',
			handler: function(btn) {
				window.open(de.ingrid.mapclient.HELP_URL);
			}
		}));
	}

	// create the toolbar
	var toolbar = new Ext.Toolbar({
		items: toolbarItems
	});

	// create the settings dialog
	var settingsDialog = new de.ingrid.mapclient.frontend.controls.SettingsDialog({
		map: this.map,
		viewConfig: this.viewConfig
	});
	this.on('afterrender', function(el) {
		if (settingsDialog) {
			mapPanel.items.add(settingsDialog); // constrain to mapPanel
			settingsDialog.anchorTo(mapPanel.el, 'tr-tr', [ -10, 10 ]);
		}
	});

	// create the panel for the center region
	var centerPanel = new Ext.Panel({
		region: 'center',
		layout: 'fit',
		items: mapPanel,
		tbar: toolbar
	});

	// add the items according to the selected configuration
	// (center panel is mandatory)
	var items = [ centerPanel ];
	if (this.viewConfig.hasServicesPanel) {
		items.push(westPanel);
	}

	Ext.apply(this, {
		items: items
	});

	de.ingrid.mapclient.frontend.Workspace.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.Workspace.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.Workspace.superclass.onRender.apply(this, arguments);

	if (this.mapUrl) {
		// load the map defined in the mapUrl
		this.load(this.mapUrl);
	}
	else {
		// try to load existing session data
		this.load();
		// always init default map
		//var callback = Ext.util.Functions.createDelegate(this.finishInitMap, this);
		//this.initDefaultMap(callback);
	}
};

/**
 * Initialize the map with the default service
 *
 * @param callback
 *            Function to be called after initialization finished
 */
de.ingrid.mapclient.frontend.Workspace.prototype.initDefaultMap = function(callback) {

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
			for ( var i = 0, count = layers.length; i < count; i++) {
				var layer = layers[i];

				// set the layer visibility according to the default
				// layer selection
				var isDefaultLayer = selectedLayerNames.indexOf(layer.name) != -1 ? true: false;
				// set the baselayer attribute
				var isBaseLayer = (layer.name == baseLayerName) ? true : false;
				layer.visibility = isDefaultLayer;
				layer.isBaseLayer = isBaseLayer;

				// bind the layer to the map
				self.map.addLayer(layer);
			}

			// set initial bounding box for the map (expected to be WGS 84)
			// note: this must be done after layouting the map!
			var bbox = de.ingrid.mapclient.Configuration.getValue("mapExtend");
			var bounds = new OpenLayers.Bounds.fromArray([bbox.west, bbox.south, bbox.east, bbox.north]);
			//bounds.transform(new OpenLayers.Projection("EPSG:4326"), self.map.getProjectionObject());
			self.map.zoomToExtent(bounds);

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
			layers: [ overviewLayer ]
		}), new OpenLayers.Control.KeyboardDefaults(),
		new OpenLayers.Control.LoadingPanel()
	];
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
		'changelayer': this.onStateChanged,
		'moveend': this.onStateChanged,
		'changebaselayer': this.onStateChanged,
		scope: this
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
		title += 'Fläche';
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
de.ingrid.mapclient.frontend.Workspace.prototype.onStateChanged = function() {
	if (this.listenToStateChanges) {
		this.save(true);
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
de.ingrid.mapclient.frontend.Workspace.prototype.save = function(isTemporary, title, description) {
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
de.ingrid.mapclient.frontend.Workspace.prototype.load = function(shortUrl, id) {
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
			state.restoreMapState();
			// restore active services
			for (var i = 0, count = state.activeServices.length; i < count; i++) {
				self.activeServicesPanel.addService(state.activeServices[i]);
			}
			self.finishInitMap();
			if (safeStateAfterLoad) {
				self.save(true);
			}
		},
		failure: function(responseText) {
			var callback = Ext.util.Functions.createDelegate(self.finishInitMap, self);
			self.initDefaultMap(callback);
		}
	});
};
