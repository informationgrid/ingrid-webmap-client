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
	 * The OpenLayers.Map instance
	 */
    map: null,
    /**
	 * The map panel
	 */
    mapPanel: null,
    /**
	 * The settings dialog inside the map panel
	 */
    settingsDialog: null,
    /**
	 * The main layer tree
	 */
    activeServicesPanel: null,
    /**
	 * The legend panel
	 */
    legendPanel: null,
    /**
     * Indicates if workspace state changes should be handled or not
     * @see de.ingrid.mapclient.frontend.Workspace.onStateChanged
     */
    listenToStateChanges: false
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.Workspace.prototype.initComponent = function() {

	// create the map (default projection is WGS 84)
	this.map = new OpenLayers.Map({
		projection: new OpenLayers.Projection("EPSG:4326"),
		// this will be used by some controls (ArgParser, MousePosition, Permalink)
		//displayProjection: new OpenLayers.Projection("EPSG:4326"),
		minExtent: new OpenLayers.Bounds(-1, -1, 1, 1),
		maxExtend: new OpenLayers.Bounds(-180, -90, 180, 90),
		units: "degrees"
	});

	// create the layout
	this.activeServicesPanel = new de.ingrid.mapclient.frontend.controls.ActiveServicesPanel({
		map: this.map
	});
	var accordionItems = [this.activeServicesPanel];

	var serviceCategories = de.ingrid.mapclient.Configuration.getValue("serviceCategories");
	if (serviceCategories) {
		for (var i=0, count=serviceCategories.length; i<count; i++) {
			var panel = new de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel({
				serviceCategory: serviceCategories[i],
				activeServicesPanel: this.activeServicesPanel
			});
			accordionItems.push(panel);
		}
	}
	accordionItems.push({
        id: 'searchPanel',
        title: 'Suche',
        autoScroll: true
    });

	this.settingsDialog = new de.ingrid.mapclient.frontend.controls.SettingsDialog({
		map: this.map
	});
	this.on('afterrender', function(el) {
    	if (this.settingsDialog) {
			this.settingsDialog.anchorTo(this.mapPanel.el, 'tr-tr', [-10, 10]);
    	}
    });

	// create the map container
	this.mapPanel = new GeoExt.MapPanel({
	    border: false,
	    map: this.map,
	    items: this.settingsDialog
	});

	// create toolbar controls
	var historyCtrl = new OpenLayers.Control.NavigationHistory();
	this.map.addControl(historyCtrl);
	var measurePathCtrl = new OpenLayers.Control.Measure(
        OpenLayers.Handler.Path, {
            persist: true
    });
	measurePathCtrl.events.on({
        "measure": this.measure
    });
	this.map.addControl(measurePathCtrl);
	var measurePolygonCtrl =  new OpenLayers.Control.Measure(
        OpenLayers.Handler.Polygon, {
            persist: true
    });
	measurePolygonCtrl.events.on({
        "measure": this.measure
    });
    this.map.addControl(measurePolygonCtrl);

	// create the legend panel
	this.legendPanel = new GeoExt.LegendPanel({
		layerStore: this.activeServicesPanel.getLayerStore(),
        autoScroll: true,
        border: false
    });

	var self = this;
	var items = [{
        region: 'west',
        xtype: 'tabpanel',
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
            items: this.legendPanel
        }]
	}, {
        region: 'center',
        layout: 'fit',
        items: [
            this.mapPanel
        ],
        tbar: items = [{
            iconCls: 'iconInfo'
        }, new GeoExt.Action({
			control: historyCtrl.previous,
			disabled: true,
            iconCls: 'iconZoomPrev'
        }), new GeoExt.Action({
			control: historyCtrl.next,
			disabled: true,
            iconCls: 'iconZoomNext'
        }), {
            xtype: 'splitbutton',
            iconCls: 'iconMeassure',
            menu: [new Ext.menu.CheckItem({
            	id: 'measurePath',
                text: 'Strecke',
                toggleGroup: 'measure',
                listeners: {
                	checkchange: function(item, checked) {
                		if (checked) {
                			Ext.getCmp('measurePolygon').setChecked(false);
                			measurePathCtrl.activate();
                		}
                		else {
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
                		}
                		else {
                			measurePolygonCtrl.deactivate();
                		}
                	}
                }
            })
        ]}, '->', {
            iconCls: 'iconPrint'
        }, {
            iconCls: 'iconSave',
            handler: function(btn) {
            	self.save(false);
            }
        }, {
            iconCls: 'iconHelp'
        }]
    }];

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

	// try to load existing session data
	this.load();
};

/**
 * Initialize the map with the default service
 * @param callback Function to be called after initialization finished
 */
de.ingrid.mapclient.frontend.Workspace.prototype.initDefaultMap = function(callback) {

	// initialize the map with the default service
	var self = this;
	var capUrl = de.ingrid.mapclient.Configuration.getValue("wmsCapUrl");
	de.ingrid.mapclient.frontend.data.Service.load(capUrl, function(service) {
		// get the selected layer names and base layer name from the configuration
		var selectedLayers = de.ingrid.mapclient.Configuration.getValue("layers");
		var selectedLayerNames = [];
		var baseLayerName = '';
	    for (var i=0, count=selectedLayers.length; i<count; i++) {
	    	var layer = selectedLayers[i];
	    	selectedLayerNames.push(layer.name);
	    	if (layer.isBaseLayer == true) {
	    		baseLayerName = layer.name;
	    	}
	    }

		// process the layers
		var layers = service.getLayers();
		for (var i=0, count=layers.length; i<count; i++) {
			var layer = layers[i];

			// set the layer visibility according to the default layer selection
			var isDefaultLayer = selectedLayerNames.indexOf(layer.name) != -1 ? true : false;
			// set the baselayer attribute
			var isBaseLayer = (layer.name == baseLayerName) ? true : false;
			layer.visibility = isDefaultLayer;
			layer.isBaseLayer = isBaseLayer;

			// bind the layer to the map
			self.map.addLayer(layer);
		}

		// set initial bounding box for the map
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
	// create the overview layer
	// (we need to configure the baselayer explicitly,
	// otherwise it is created by the clone operation
	// which does not copy the isBaseLayer property)
	var overviewLayer = this.map.baseLayer.clone();
	overviewLayer.isBaseLayer = true;

	// add controls to map
	var controls = [
	        new OpenLayers.Control.Navigation(),
	        new OpenLayers.Control.Permalink(),
	        new OpenLayers.Control.PanZoomBar(),
	        new OpenLayers.Control.ScaleLine(),
	        new OpenLayers.Control.Permalink('permalink'),
	        new OpenLayers.Control.MousePosition(),
	        new OpenLayers.Control.OverviewMap({layers: [overviewLayer]}),
	        new OpenLayers.Control.KeyboardDefaults()
	];
	this.map.addControls(controls);

	// listen to session changing events (addLayer and removeLayer are
	// signaled by datachange of activeServicesPanel)
	this.map.events.on({
	    //'addlayer': this.onStateChanged,
	    //'removelayer': this.onStateChanged,
	    'changelayer': this.onStateChanged,
	    'move': this.onStateChanged,
	    'changebaselayer': this.onStateChanged,
	    scope: this
	});
	this.activeServicesPanel.on('datachanged', this.onStateChanged, this);
	this.listenToStateChanges = true;
};

/**
 * Display a measurement result
 * @param event Event with measure, units, order, and geometry properties as
 * received from OpenLayers.Control.Measure
 */
de.ingrid.mapclient.frontend.Workspace.prototype.measure = function(event) {
    var units = event.units;
    var order = event.order;
    var measure = event.measure;
    var title = '';
    var content = '';
    if(order == 1) {
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
 * Method to be called, when any data changes that needs to be stored on
 * the server. To prevent execution set listenToStateChanges to false
 */
de.ingrid.mapclient.frontend.Workspace.prototype.onStateChanged = function() {
	if (this.listenToStateChanges) {
		this.save(true);
	}
};

/**
 * Load the last configuration from the server
 */
de.ingrid.mapclient.frontend.Workspace.prototype.load = function() {
	// prevent recording state changes
	this.listenToStateChanges = false;

	this.activeServicesPanel.removeAll();
	var state = new de.ingrid.mapclient.frontend.data.SessionState({
		map: this.map,
		activeServices: []
	});
	var self = this;
	de.ingrid.mapclient.frontend.data.Session.load(state, {
		success: function(responseText) {
	    	de.ingrid.mapclient.Message.showInfo("Die existierenden Session-Daten wurden wiederhergestellt.");
	    	// restore map state
	    	state.restoreMapState();
	    	// restore active services
	    	for (var i=0, count=state.activeServices.length; i<count; i++) {
	    		self.activeServicesPanel.addService(state.activeServices[i]);
	    	}
			self.finishInitMap();
		},
		failure: function(responseText) {
			var callback = Ext.util.Functions.createDelegate(self.finishInitMap, self);
			self.initDefaultMap(callback);
		}
	});
};

/**
 * Save the current configuration to the server
 * @param silent Boolean whether to give feedback of success or not
 */
de.ingrid.mapclient.frontend.Workspace.prototype.save = function(silent) {
	var data = new de.ingrid.mapclient.frontend.data.SessionState({
		map: this.map,
		activeServices: this.activeServicesPanel.getServiceList()
	});
	de.ingrid.mapclient.frontend.data.Session.save(data, {
		success: function(responseText) {
			if (!silent) {
		    	de.ingrid.mapclient.Message.showInfo(de.ingrid.mapclient.Message.SESSION_SAVE_SUCCESS);
			}
		},
		failure: function(responseText) {
			if (!silent) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.SESSION_SAVE_FAILURE);
			}
		}
	});
};
