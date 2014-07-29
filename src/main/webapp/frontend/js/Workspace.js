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
		//on each setcenter method(fired when zoomed), we check if our layers are in the right
        //scale to be displayed
        var servicesPanel = this.containingViewport.activeServicesPanel;
        var root = servicesPanel.layerTree.getRootNode();
        servicesPanel.checkScaleRecursively(root, this.getScale());

        
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
	viewConfig : "default",

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
	kmlRedlining: "",
	ctrls: [],
	redliningControler : null

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
	// create the map (default projection read from config)
	var projection =  de.ingrid.mapclient.Configuration.getValue('projections');
	var epsg = projection[0].epsgCode;
	this.map = new de.ingrid.mapclient.frontend.IngridMap({
		containingViewport:self,
		fractionalZoom : true,
		projection : epsg ? new OpenLayers.Projection(epsg) : new OpenLayers.Projection("EPSG:4326"),
		// this will be used by some controls (ArgParser, MousePosition,
		// Permalink)
		displayProjection : epsg ? new OpenLayers.Projection(epsg) : new OpenLayers.Projection("EPSG:4326"),
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
	this.activeServicesPanel = new de.ingrid.mapclient.frontend.controls.ActiveServicesPanel({
		map : this.map,
		ctrls: self.ctrls
	});
	accordionItems.push(this.activeServicesPanel);

	// b) available service categories
	var mapServiceCategories = de.ingrid.mapclient.Configuration.getValue("mapServiceCategories");
	if (mapServiceCategories) {
		for (var i = 0, count = mapServiceCategories.length; i < count; i++) {
			var panel = new de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel({
				id : "serviceCategory_" + mapServiceCategories[i].name,
				mapServiceCategory : mapServiceCategories[i],
				activeServicesPanel : this.activeServicesPanel,
				metadataWindowStartY: 50 + (50*i)
			});
			accordionItems.push(panel);
		}
	}

	// Externen Dienst hinzufügen
	var externServicePanel = new de.ingrid.mapclient.frontend.controls.NewServicePanel({
		        	 activeServicesPanel: this.activeServicesPanel
		         });
	accordionItems.push(externServicePanel);
	
	// c) search panel
	
	if(de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchEnable") == false){
		var searchPanel = new de.ingrid.mapclient.frontend.controls.SearchPanel();
		accordionItems.push(searchPanel);
	}
	
	var activeItem = 0;
	var activeAccordion = accordionItems[activeItem];
	if (de.ingrid.mapclient.Configuration.getSettings("viewActiveAccordionWestPanel")) {
		activeItem = de.ingrid.mapclient.Configuration.getSettings("viewActiveAccordionWestPanel");
		if(accordionItems[activeItem])
			activeAccordion = accordionItems[activeItem];
	}

	// create the panel for the west region
	var westPanel = new Ext.Panel({
		id : 'west',
		region : 'west',
		width : 250,
		layout     : 'fit',
		collapsible : false,
		collapsed: (de.ingrid.mapclient.Configuration.getSettings("viewHasServicesPanel") == false && de.ingrid.mapclient.Configuration.getSettings("viewHasCollapseTool")) ? true : false, 
		split : true,
		items : [{
					id : 'servicePanel',
					closable : false,
					layout : 'accordion',
					layoutConfig : {
						animate : true,
						activeItem: activeAccordion
					},
					border : false,
					items : accordionItems
				}]
	});

	// create the toolbar items
	var toolbarItems = []; 
	//controls are done in finishinitmap
	// but we need the keybiard control earlier
	var keyboardControl = new OpenLayers.Control.KeyboardDefaults();
	this.ctrls['keyboardControl'] = keyboardControl;
	
	// Collapse Tool
	if (de.ingrid.mapclient.Configuration.getSettings("viewHasCollapseTool")) {
		toolbarItems.push(new Ext.Button({
			iconCls : (de.ingrid.mapclient.Configuration.getSettings("viewHasServicesPanel") == false && de.ingrid.mapclient.Configuration.getSettings("viewHasCollapseTool")) ? 'iconExpand' : 'iconCollapse',
			tooltip : i18n('tServiceBereichAufUndZuKlappen'),
			enableToggle : false,
			style:{
				marginLeft: typeof isFullScreen == "undefined" ? '-13px' : '-7px'
			},
			handleMouseEvents:false,
			handler: function(btn) {
				if (westPanel != null) {
						westPanel.collapse();
						westPanel.expand();
						if(westPanel.collapsed == false){
							this.setIconClass('iconExpand');	
						}else{
							this.setIconClass('iconCollapse');
						}
						
	            } 
			}
		}));
		toolbarItems.push({xtype: 'tbspacer', cls: 'tbspacer_centerToolbar'});
	}
	
	// Legend tool
	if (de.ingrid.mapclient.Configuration.getSettings("viewHasLegendTool")) {
		toolbarItems.push(new Ext.Button({
			iconCls : 'iconLegend',
			tooltip : i18n('tLegendToolBar'),
			text : i18n('tLegendToolBar'),
			enableToggle : false, 
			handler: function(btn) {
				var legendDialog = Ext.getCmp('legendDialog');
				if(legendDialog == undefined){
					legendDialog = new de.ingrid.mapclient.frontend.controls.LegendDialog({
						activeServicesPanel: self.activeServicesPanel
					});
				}
				
				if(legendDialog.isVisible()){
					if(legendDialog.hidden){
						legendDialog.show();
					}else{
						legendDialog.hide();						
					}
				}else{
					legendDialog.show();
				}
			}
		}));
		
		toolbarItems.push({
            xtype: 'tbseparator'
        });
	}
	
	// a) feature tool
	var featureInfoControl = new de.ingrid.mapclient.frontend.controls.FeatureInfoDialog({
		id: 'featureInfoControl',
		map : this.map
	}); 

	this.map.events.on({
		'click' : featureInfoControl.query,
		scope : featureInfoControl
	});

	var positionControl = new de.ingrid.mapclient.frontend.controls.PositionDialog({
		id: 'positionControl',
		map : this.map,
		y: de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop") && this.viewConfig != "default"						
				? parseInt(de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop").trim()) + 75 : 75 
	}); 
	this.map.events.on({
		'click' : positionControl.point,
		scope : positionControl
	});
	
	toolbarItems.push(new Ext.Button({
		id : 'btnDragMap',
		iconCls : 'iconDrag',
		tooltip : i18n('tKarteVerschieben'),
		toggleGroup : 'toggleGroupMapPanel',
		enableToggle : true,
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasDragMapTool") || de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable") ? false : true,
		pressed: true,
		handler : function(btn) {
			if (btn.pressed) {
				// Deactivate controls
				measurePathCtrl.deactivate();
				measurePolygonCtrl.deactivate();
				Ext.getCmp('measurePath').setChecked(false);
				Ext.getCmp('measurePolygon').setChecked(false);
				featureInfoControl.deactivate();
				positionControl.deactivate();
				self.deactivateRedlining();
			}else{
				btn.getEl().dom.click();
			}
		}
	}));
	
	toolbarItems.push(new Ext.Button({
		iconCls : 'iconInfo',
		tooltip : i18n('tObjektinformationen'),
		toggleGroup : 'toggleGroupMapPanel',
		enableToggle : true, 
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasInfoTool") ? false : true,
		handler : function(btn) {
			if (btn.pressed) {
				// Deactivate controls
				measurePathCtrl.deactivate();
				measurePolygonCtrl.deactivate();
				Ext.getCmp('measurePath').setChecked(false);
				Ext.getCmp('measurePolygon').setChecked(false);
				self.deactivateRedlining();
				positionControl.deactivate();
				featureInfoControl.activate();
			}else{
				if(de.ingrid.mapclient.Configuration.getSettings("viewHasDragMapTool") || de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable")){
					btn.getEl().dom.click();
				}else{
					featureInfoControl.deactivate();
				}
			}
		}
	}));


	// b) history tool
	// create the OpenLayers control
	var historyCtrl = new OpenLayers.Control.NavigationHistory();
	this.map.addControl(historyCtrl);

	toolbarItems.push(new GeoExt.Action({
		control : historyCtrl.previous,
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasHistoryTool") ? false : true,
		disabled : true,
		iconCls : 'iconZoomPrev',
		tooltip : i18n('tZurueck')
	}));
	toolbarItems.push(new GeoExt.Action({
		control : historyCtrl.next,
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasHistoryTool") ? false : true,
		disabled : true,
		iconCls : 'iconZoomNext',
		tooltip : i18n('tVor')
	}));

	toolbarItems.push(new Ext.Button({
		iconCls : 'iconZoom',
		tooltip : i18n('tKarteZoomen'),
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasZoomTool") ? false : true,
		enableToggle : false, 
		handler : function(btn) {
			var newProjection = new OpenLayers.Projection(self.map.projection);
			var newMaxExtent = de.ingrid.mapclient.frontend.data.MapUtils.getMaxExtent(newProjection);
			self.map.zoomToExtent(newMaxExtent);
		}
	}));

	// c) measure tool
	// create the OpenLayers control
	if (de.ingrid.mapclient.Configuration.getSettings("viewHasMeasureTool")) {
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
			id: 'measureButton',
			iconCls : 'iconMeassure',
			tooltip : i18n('tMessen'),
			toggleGroup : 'toggleGroupMapPanel',
			menu : [new Ext.menu.CheckItem({
						id : 'measurePath',
						text : i18n('tStrecke'),
						toggleGroup : 'measure',
						cls: 'font-menu',
						listeners : {
							checkchange : function(item, checked) {
								if (checked) {
									var button = Ext.getCmp('measureButton');
									var dom = button.getEl().dom;
									if(!button.pressed){
										dom.click();	
									}
									// Deactivate controls
									featureInfoControl.deactivate();
									positionControl.deactivate();
									
									Ext.getCmp('measurePolygon').setChecked(false);
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
					cls: 'font-menu',
					listeners : {
						checkchange : function(item, checked) {
							if (checked) {
								var button = Ext.getCmp('measureButton');
								var dom = button.getEl().dom;
								if(!button.pressed){
									dom.click();	
								}
								// Deactivate controls
								featureInfoControl.deactivate();
								positionControl.deactivate();
								
								Ext.getCmp('measurePath').setChecked(false);
								measurePolygonCtrl.activate();
							} else {
								measurePolygonCtrl.deactivate();
							}
						}
					}
				})],
				handler: function(btn){
					if(btn.pressed){
						self.deactivateRedlining();
						
					}else{
						if(de.ingrid.mapclient.Configuration.getSettings("viewHasDragMapTool") || de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable")){
							btn.getEl().dom.click();
						}
					}
				},
				listeners:{
					menushow: function (){
						var button = Ext.getCmp('measureButton');
						var dom = button.getEl().dom;
						if(!button.pressed){
							dom.click();	
						}
						
						self.deactivateRedlining();
					}
				},
				toggleHandler: function(button, state){
		            var me = this;
		            if(!me.pressed){
		            	Ext.getCmp('measurePath').setChecked(false);
		            	Ext.getCmp('measurePolygon').setChecked(false);
						measurePathCtrl.deactivate();
						measurePolygonCtrl.deactivate();
		            }
		        }
		}));
	}
	
	toolbarItems.push(new Ext.Button({
		id:'mapPin',
		iconCls : 'iconMapPin',
		tooltip : i18n('tPositionAnzeigen'),
		toggleGroup : 'toggleGroupMapPanel',
		enableToggle : true,
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewPositionButtonEnable") ? false : true,
		handler : function(btn) {
			if (btn.pressed) {
				// Deactivate featureInfoControl
				measurePathCtrl.deactivate();
				measurePolygonCtrl.deactivate();
				Ext.getCmp('measurePath').setChecked(false);
				Ext.getCmp('measurePolygon').setChecked(false);
				self.deactivateRedlining();
				featureInfoControl.deactivate();
				positionControl.deactivate();

				positionControl.activate(true);
			} else {
				if(de.ingrid.mapclient.Configuration.getSettings("viewHasDragMapTool") || de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable")){
					btn.getEl().dom.click();
				}else{
					positionControl.deactivate();
				}
			}
		}
	}));
	
	var countTools = 0;
	
	if(de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable")){
		countTools++;
	}
	if(de.ingrid.mapclient.Configuration.getSettings("viewNominatimEnable")){
		countTools++;
	}
	if(de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchEnable")){
		countTools++;
	}
	
	// Create All
	toolbarItems.push({
		id:'allsearchcombobox',
		xtype: "gx_allsearchcombobox",
		hideTrigger: true,
		url: "/ingrid-webmap-client/rest/jsonCallback/queryAll?",
		width: 300,
		map: this.map,
		emptyText: i18n("tSearchAllSearch"),
		zoom: 5,
		loadingText: i18n("tSearchAllLoading"),
		emptyClass: 'font-nominatim',
		listClass: 'font-nominatim',
		minChars: 1,
		hidden: countTools > 1 ? false : true,
		tpl: new Ext.XTemplate(
				'<tpl for=".">',
		        '<tpl if="this.group != values.group">',
		        '<tpl exec="this.group = values.group"></tpl>',
		        '<hr><h1><span>{displayPre}</span></h1><hr>',
		        '</tpl>',
		        '<div class="x-combo-list-item">{display_field}</div>',
		        '</tpl>'
	    ),
	    listeners: {
	    	'beforequery' : function(){
	    		this.tpl.group="";
	    	}
	    }
	});
	
	// Create BWaStrLocator
	toolbarItems.push({
		id:'bwastrlocator',
		xtype: "gx_bwastrlocator",
		hideTrigger: true,
		url: "/ingrid-webmap-client/rest/jsonCallback/query?searchID=searchterm&url=" + de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorParams"),
		width: 300,
		map: this.map,
		emptyText: i18n("tBWaStrLocatorSearch"),
		zoom: 5,
		loadingText: i18n("tBWaStrLocatorLoading"),
		emptyClass: 'font-nominatim',
		listClass: 'font-nominatim',
		minChars: 1,
		hidden: countTools > 1 ? true : de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable") ? false : true
	});
	
	// Create Nominatim
	toolbarItems.push({
		id:'nominatim',
		xtype: "gx_geocodercombo",
		hideTrigger: true,
		// To restrict the search to a bounding box, uncomment the following
		// line and change the viewboxlbrt parameter to a left,bottom,right,top
		// bounds in EPSG:4326:
		url: "" + de.ingrid.mapclient.Configuration.getSettings("viewNominatimParams").trim(),
		width: 300,
		map: this.map,
		emptyText: i18n("tNominatimSearch"),
		zoom: 5,
		loadingText: i18n("tNominatimLoading"),
		emptyClass: 'font-nominatim',
		listClass: 'font-nominatim',
		minChars: 1,
		hidden: countTools > 1 ? true : de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable") ? true : (de.ingrid.mapclient.Configuration.getSettings("viewNominatimEnable") ? false : true)
	});
	
    // Create PortalSearch
	toolbarItems.push({
		id:'portalsearch',
		xtype: "gx_portalsearch",
		hideTrigger: true,
		url: "" + de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchParams"),
		width: 300,
		map: this.map,
		emptyText: i18n("tPortalSearchSearch"),
		zoom: 5,
		loadingText: i18n("tPortalSearchSearch"),
		emptyClass: 'font-nominatim',
		listClass: 'font-nominatim',
		minChars: 1,
		hidden: countTools > 1 ? true : de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable") ? true : (de.ingrid.mapclient.Configuration.getSettings("viewNominatimEnable") ? true : (de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchEnable") ? false : true)),
		tpl: new Ext.XTemplate(
		        '<tpl for="."><div class="x-combo-list-item">{name}</div></tpl>'
	    )
	});
    
	var searchToolStoreData = [];

	if(countTools > 1){
		searchToolStoreData.push(['all', i18n('tSearchToolAll')]);
	}
	
	if(de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable")){
		searchToolStoreData.push(['bwastrlocator', i18n('tSearchToolBWaStrLocator')]);
	}
	if(de.ingrid.mapclient.Configuration.getSettings("viewNominatimEnable")){
		searchToolStoreData.push(['nominatim', i18n('tSearchToolNominatim')]);
	}
	if(de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchEnable")){
		searchToolStoreData.push(['portalsearch', i18n('tSearchToolPortalSearch')]);
	}
	
	var searchToolStore = new Ext.data.ArrayStore({
        fields: ['searchToolValue', 'searchToolName'],
        data : searchToolStoreData
    });
	
	if(de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchEnable")
			|| de.ingrid.mapclient.Configuration.getSettings("viewNominatimEnable")
			|| de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable")){
		
		if(countTools > 1){
			var combo = new Ext.form.ComboBox({
		    	id:'searchTool',
				store: searchToolStore,
				valueField: 'searchToolValue',
				displayField:'searchToolName',
		        editable: false,
		        mode: 'local',
		        triggerAction: 'all',
		        width: 80
		    });
			combo.setValue('all');
			/*
			if(de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable")){
				combo.setValue('bwastrlocator');
			} else if(de.ingrid.mapclient.Configuration.getSettings("viewNominatimEnable")){
				combo.setValue('nominatim');
			} else if(de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchEnable")){
				combo.setValue('portalsearch');
			} 
			*/
			combo.on('select', function(comboBox, record, index) {
				var nominatimCB = Ext.getCmp("nominatim"); 
				var bwastrlocatorCB = Ext.getCmp("bwastrlocator");
				var portalsearchCB = Ext.getCmp("portalsearch");
				var allsearchcombobox = Ext.getCmp("allsearchcombobox");
				
				if(comboBox.value == "all"){
					bwastrlocatorCB.hide();
					bwastrlocatorCB.reset();
					nominatimCB.hide();
					nominatimCB.reset();
					portalsearchCB.hide();
					portalsearchCB.hide();
					
					allsearchcombobox.show();
				} else if(comboBox.value == "portalsearch"){
					bwastrlocatorCB.hide();
					bwastrlocatorCB.reset();
					nominatimCB.hide();
					nominatimCB.reset();
					allsearchcombobox.hide();
					allsearchcombobox.reset();
					
					portalsearchCB.show();
				}else if(comboBox.value == "nominatim"){
					bwastrlocatorCB.hide();
					bwastrlocatorCB.reset();
					portalsearchCB.hide();
					portalsearchCB.reset();
					allsearchcombobox.hide();
					allsearchcombobox.reset();
					
					nominatimCB.show();
				}else if(comboBox.value == "bwastrlocator"){
					nominatimCB.hide();
					nominatimCB.reset();
					portalsearchCB.hide();
					portalsearchCB.reset();
					allsearchcombobox.hide();
					allsearchcombobox.reset();
					
					bwastrlocatorCB.show();
				}
			}, this);
			toolbarItems.push(combo);
			
			toolbarItems.push(new Ext.Button({
				id: 'btnBWaStrClear',
				iconCls : 'iconRemove',
				tooltip : 'BWaStr-Layer/-Marker entfernen',
				enableToggle : false,
				hidden: de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable") ? false : true,
				handler: function(btn) {
					de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVector");
					de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVectorTmp");
					de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");
				}
			}));
		}
	}
	
	toolbarItems.push(new Ext.Toolbar.Fill());

	// Setting tool
	if (de.ingrid.mapclient.Configuration.getSettings("viewHasSettings")) {
		toolbarItems.push(new Ext.Button({
			iconCls : 'iconSettings',
			tooltip : i18n('tSettingsToolBar'),
			text : i18n('tSettingsToolBar'),				
			enableToggle : false, 
			handler: function(btn) {
				var settingsDialog = Ext.getCmp('settingsDialog');
				if(settingsDialog == undefined){
					settingsDialog = new de.ingrid.mapclient.frontend.controls.SettingsDialog({
						map : self.map,
						viewConfig : {
							hasProjectionsList: de.ingrid.mapclient.Configuration.getSettings("viewHasProjectionsList"),
							hasScaleList: de.ingrid.mapclient.Configuration.getSettings("viewHasScaleList")
						},
						ctrls: self.ctrls
					});
					settingsDialog.anchorTo(centerPanel.el, 'tr-tr', [-20, 50]);
				}else if(settingsDialog.hidden){
					settingsDialog.show();
				}else{
					settingsDialog.hide();
				}
			}
		}));
		
		toolbarItems.push({
            xtype: 'tbseparator'
        });
	}
	
	// d) print tool
	var printActive = false;
	var printDia = null;
	toolbarItems.push(new Ext.Button({
		enableToggle:false,
		iconCls : 'iconPrint',
		toggleGroup : de.ingrid.mapclient.Configuration.getSettings("viewHasDragMapTool") || de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable") ? 'toggleGroupMapPanel' : null,
		tooltip : i18n('tDrucken'),
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasPrintTool") ? false : true,
		handler : function(btn) {
			measurePathCtrl.deactivate();
			measurePolygonCtrl.deactivate();
			Ext.getCmp('measurePath').setChecked(false);
			Ext.getCmp('measurePolygon').setChecked(false);
			featureInfoControl.deactivate();
			positionControl.deactivate();
			self.deactivateRedlining();
	        if(!printActive){
				printDia = new de.ingrid.mapclient.frontend.controls.PrintDialog({
							mapPanel : mapPanel,
							legendPanel : new GeoExt.LegendPanel({
								layerStore : self.activeServicesPanel.getLayerStore(),
								autoScroll : true,
								border : false,
								dynamic : true,
								cls: "mapclientLegendPanel"
							})
						});
						printActive = true;
						self.ctrls['keyboardControl'].deactivate();
			}
			printDia.on('close', function(){
				printActive = false;
				self.ctrls['keyboardControl'].activate();
				if(de.ingrid.mapclient.Configuration.getSettings("viewHasDragMapTool") || de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable")){
					var btnDragMap = Ext.getCmp("btnDragMap");
					btnDragMap.getEl().dom.click();
				}
			})
		}
	}));

	// e) load tool
	toolbarItems.push(new Ext.Button({
		iconCls : 'iconLoad',
		tooltip : i18n('tLaden'),
		disabled : !this.session.hasUserId(),
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasLoadTool") ? false : true,
		handler : function(btn) {
			var dlg = new de.ingrid.mapclient.frontend.controls.LoadDialog(
					{
						id: 'loadDialog',
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

	// f) save tool
	toolbarItems.push(new Ext.Button({
		iconCls : 'iconSave',
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasSaveTool") ? false : true,
		tooltip : this.session.hasUserId() ? i18n('tSpeichern'):i18n('tZumSpeichernErstEinloggen') ,
		disabled : !this.session.hasUserId(),
		handler : function(btn) {
			var dlg = new de.ingrid.mapclient.frontend.controls.SaveDialog({id: 'saveDialog', ctrls: self.ctrls});
			dlg.on('close', function(p) {
				if (dlg.isSave()) {
					self.save(false, dlg.getTitle(), dlg.getDescription());
				}
			});
		}
	}));

	// g) download tool
	toolbarItems.push(new Ext.Button({
		iconCls : 'iconDownload',
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasDownloadTool") ? false : true,
		tooltip : i18n('tKarteHerunterladen'),
		handler : function(btn) {
			var dia = new de.ingrid.mapclient.frontend.controls.DownloadDialog({id: 'downloadDialog', ctrls: self.ctrls});
			dia.on('close', function(p) {
						if (dia.isSave()) {
							self.download(dia.getTitle());
						}
					});
			}
	
		}
	));
	
	if(typeof isFullScreen !== "undefined"){
		toolbarItems.push(new Ext.Button({
			iconCls : 'iconPortal',
			hidden: de.ingrid.mapclient.Configuration.getSettings("viewPortalButton") ? false : true,
			tooltip : i18n('tPortal'),
			handler : function(btn) {
				var win=window.open(de.ingrid.mapclient.Configuration.getSettings("viewPortalURL"), '_blank');
				win.focus();
			}
		}));
	}else{
		toolbarItems.push(new Ext.Button({
			iconCls : 'iconFullScreen',
			hidden: de.ingrid.mapclient.Configuration.getSettings("viewFullScreenButton") ? false : true,
			tooltip : i18n('tFullScreen'),
			handler : function(btn) {
				var url = de.ingrid.mapclient.Configuration.getSettings("viewFullScreenURL");
				if(url.indexOf("?") < 0){
					url = url + "?";
				}
				url = url + "lang=" + languageCode;
				
				var win=window.open(url, '_blank');
				win.focus();
			}
		}));

	}
	
	// h) help tool
	toolbarItems.push(new Ext.Button({
		iconCls : 'iconHelp',
		hidden: de.ingrid.mapclient.Configuration.getSettings("viewHasInfoTool") ? false : true,
		tooltip : i18n('tHilfe'),
		handler : function(btn) {
			popupWin = window.open(de.ingrid.mapclient.HELP_URL, "InternalWin", 'width=750,height=550,resizable=yes,scrollbars=yes,location=no,toolbar=yes');
			popupWin.focus();
		}
	}));
	
	// create the toolbar
	var toolbar = new Ext.Toolbar({
				items : toolbarItems
			});

	// welcome dialog
	if (de.ingrid.mapclient.Configuration.getSettings("viewHasWelcomeDialog")) {
		// show only if cookies do not prevent this
		var showWelcomeDialog = Ext.util.Cookies.get("ingrid.webmap.client.welcome.dialog.hide") !== "true";
		if (showWelcomeDialog) {
	        var welcomeDialog = new de.ingrid.mapclient.frontend.controls.WelcomeDialog({
                map : this.map,
                ctrls: self.ctrls
            });
	
		}
	}
	
	var centerPanel = new Ext.Panel({
		region : 'center',
		id: 'centerPanel',
		layout : 'fit',
		items : mapPanel,
		tbar : toolbar,
		bbar : de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable") ? new Ext.Toolbar() : null
	});

	// dummy panel for the header
	var northPanel = new Ext.Panel({
		region : 'north',
		baseCls : '',
		height : de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop") && this.viewConfig != "default"						
				? parseInt(de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop").trim())
				: 0
	});

	// add the items according to the selected configuration
	// (center panel is mandatory)
	var items;
	if (de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop")) {
		items = [centerPanel, northPanel];
	} else {
		items = [centerPanel];
	}
	if (de.ingrid.mapclient.Configuration.getSettings("viewHasServicesPanel")) {
		items.push(westPanel);
	}else if(de.ingrid.mapclient.Configuration.getSettings("viewHasServicesPanel") == false && de.ingrid.mapclient.Configuration.getSettings("viewHasCollapseTool")){
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
		var selectedLayers = de.ingrid.mapclient.Configuration.getValue("layers");
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
		var baseLayerSet = false;
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
			console.debug("Error!! BaseLayer '"+baseLayerName+"' does not match any layer.");
		}

		// set initial projection, if no projection has been defined,
		// use default projection from map

		// initialize the projections list
		var projections = de.ingrid.mapclient.Configuration.getValue('projections');
		if (projections && projections.length > 0) {
			de.ingrid.mapclient.frontend.data.MapUtils.assureProj4jsDef(projections[0].epsgCode,
				function() {
					de.ingrid.mapclient.frontend.data.MapUtils.changeProjection(projections[0].epsgCode, self.map, this, true);
					self.map.events.triggerEvent("zoomend");
			});
		} else {
			// set initial bounding box for the map (expected to be WGS
			// 84)
			// note: this must be done after layouting the map!
			var bbox = de.ingrid.mapclient.Configuration.getValue("mapExtend");
			var bounds = new OpenLayers.Bounds.fromArray([bbox.west, bbox.south, bbox.east, bbox.north]);
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

	if(de.ingrid.mapclient.Configuration.getSettings("viewMinimapEnable")){
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
			minRatio: 30, 
			maxRatio: 30,
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
	this.map.events.register('changelayer', self.map, function(evt) {
        if(this.sessionWriteEnable) {
            self.onStateChanged();
        }
	});	
	this.activeServicesPanel.on('datachanged', this.onStateChanged, this);

	this.listenToStateChanges = true;
	this.map.sessionWriteEnable = true;
	// this is to manually invoke the method, we do this at last, cause we dont have the checkboxes before
	this.map.setCenter();
	
	// Redlining
	if (de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable")) {
		var cntrPanel = Ext.getCmp('centerPanel');
		var cntrPanelBbar = cntrPanel.getBottomToolbar();
		if(this.redliningControler == null){
			this.redliningControler = new GeoExt.ux.FeatureEditingControler({
		        cosmetic: true,
		        map: this.map,
		        toggleGroup : 'toggleGroupMapPanel',
		        // TODO: Check Styles import export
		        styler: de.ingrid.mapclient.Configuration.getSettings("viewRedliningStyleEnable"),
		        popupOptions: {map: this.map, anchored: false, unpinnable: false, draggable: true},
		        triggerAutoSave: function() {
		            if (this.autoSave) {
		                this.featurePanel.triggerAutoSave();
		            }
		            self.kmlRedlining = GeoExt.ux.data.Export(this.map, 'KML', this.layers, null);
		            if(this.layers[0].features.length == 0){
		            	self.kmlRedlining = "";
		            }
		            self.save(true);
		        },
		        reactivateDrawControl: function() {
		            if (this.lastDrawControl && this.activeLayer.selectedFeatures.length === 0) {
		                this.featureControl.deactivate();
		                this.lastDrawControl.activate();
		            }else{
		            	this.triggerAutoSave();
		            }
		            
		        },
		        deleteAllFeatures: function() {
		        	var messageBox = Ext.MessageBox;
		        	messageBox.buttonText = {ok: OpenLayers.i18n('Ok'), cancel: OpenLayers.i18n('Cancel'), yes: OpenLayers.i18n('Yes'), no: OpenLayers.i18n('No')};
		        	messageBox.confirm(OpenLayers.i18n('Delete All Features'), OpenLayers.i18n('Do you really want to delete all features ?'), function(btn) {
		                if (btn == 'yes') {
		                    if (this.popup) {
		                        this.popup.close();
		                        this.popup = null;
		                    }

		                    for (var i = 0; i < this.layers.length; i++) {
		                        this.layers[i].destroyFeatures();
		                    }
		                    self.kmlRedlining = "";
		    	            self.save(true);
		                }
		            },
		                    this);
		        },
		        onFeatureAdded: function(event) {
		        	Ext.getCmp("featureInfoControl").deactivate();
		        	Ext.getCmp("positionControl").deactivate();
		        	
		            var feature, drawControl, featureTyp, featureCmp, hasEnoughCmp;

		            feature = event.feature;
		            featureTyp = feature.geometry.CLASS_NAME;
	            	feature.state = OpenLayers.State.INSERT;
		            hasEnoughCmp = true;
		            
		            drawControl = this.getActiveDrawControl();
		            if (drawControl) {
		                drawControl.deactivate();
		                this.lastDrawControl = drawControl;
		            }
		            
		            if(featureTyp === "OpenLayers.Geometry.Polygon"){
		            	if(feature.geometry){
			            	if(feature.geometry.components){
			            		if(feature.geometry.components[0]){
			            			if(feature.geometry.components[0].components){
			            				if(feature.geometry.components[0].components.length < 4){
			            					hasEnoughCmp = false
			            				}
			            			}
			            		}
			            	}
			            }
		            }
		            if(hasEnoughCmp){
		            	this.featureControl.activate();
			            this.getSelectControl().select(feature);
		            }else{
		            	drawControl.activate();
		            	feature.layer.destroyFeatures([feature]);
		            }
		        }
		    });
			cntrPanelBbar.addItem(this.redliningControler.actions);
			cntrPanelBbar.doLayout();
		}
		
		if(self.kmlRedlining){
			GeoExt.ux.data.Import(self.map, this.redliningControler.activeLayer, 'KML', self.kmlRedlining, null);
		}
	}
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
				kmlArray : this.kmlArray,
				kmlRedlining : this.kmlRedlining,
				selectedLayersByService: this.activeServicesPanel.selectedLayersByService,
				url: window.location.href,
				treeState: this.activeServicesPanel.treeState
				
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
			de.ingrid.mapclient.Message.showInfo(de.ingrid.mapclient.Message.MAP_SAVE_SUCCESS);
		},
		failure : function(responseText) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.MAP_SAVE_FAILURE);
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
				kmlArray : [],
				kmlRedlining: "",
				selectedLayersByService: []
			});
	var self = this;
	this.session.load(state, shortUrl, {
		success : function(responseText) {
			// restore map state
			if (!(typeof(state.selectedLayersByService) === "undefined") && state.selectedLayersByService.length > 0){
				for (var i = 0, count = state.selectedLayersByService.length; i < count; i++) {
					var selectedLayer = state.selectedLayersByService[i];
					var id = null;
					var capabilitiesUrl = null;
					var checked = null;
					var cls = null;
					var leaf = null;
					for (var j = 0, countJ = selectedLayer.length; j < countJ; j++) {
						var entry = selectedLayer[j];
						if(entry[0] == "id"){
							id = entry[1];
						}else if(entry[0] == "capabilitiesUrl"){
							capabilitiesUrl = entry[1];
						}else if(entry[0] == "checked"){
							checked = entry[1];
						}else if(entry[0] == "cls"){
							cls = entry[1];
						}else if(entry[0] == "leaf"){
							leaf = entry[1];
						}
					}
					self.activeServicesPanel.selectedLayersByService.push({
						id:id,
						capabilitiesUrl:capabilitiesUrl,
						checked:checked,
						cls:cls,
						leaf:leaf
					});
				}
			}
			
			if (!(typeof(state.treeState) === "undefined") && state.treeState.length > 0){
				for (var i = 0, count = state.treeState.length; i < count; i++) {
					var treeState = state.treeState[i];
					var name = null;
					var capabilitiesUrl = null;
					var isService = null;
					var layer = null;
					for (var j = 0, countJ = treeState.length; j < countJ; j++) {
						var entry = treeState[j];
						if(entry[0] == "name"){
							name = entry[1];
						}else if(entry[0] == "capabilitiesUrl"){
							capabilitiesUrl = entry[1];
						}else if(entry[0] == "isService"){
							isService = entry[1];
						}else if(entry[0] == "layer"){
							layer = entry[1];
						}
					}
					self.activeServicesPanel.treeState.push({
						name:name,
						capabilitiesUrl:capabilitiesUrl,
						isService:isService,
						layer:layer
					});
				}
			}
			
			
			// do this first to make sure the map has it's base layer
			// BEFORE any other layer (KML, AddWms via URL) is loaded
			state.restoreMapState(function() {
				// restore active services
				if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceAddReversal") == false){
					if(state.capabilitiesUrlOrder){
						for (var j = 0, countJ = state.capabilitiesUrlOrder.length; j < countJ; j++) {
							var capabilitiesUrl = state.capabilitiesUrlOrder[j];
							for (var i = 0, count = state.activeServices.length; i < count; i++) {
								var serviceCapabilitiesUrl = state.activeServices[i].capabilitiesUrl;
								if(capabilitiesUrl === serviceCapabilitiesUrl){
									self.activeServicesPanel.state = state;
									self.activeServicesPanel.addService(state.activeServices[i],false,true);
									break;
								}
							}
						}
						
					}else{
						for (var i = 0, count = state.activeServices.length; i < count; i++) {
							self.activeServicesPanel.state = state;
							self.activeServicesPanel.addService(state.activeServices[i],false,true);
						}
						
					}
				}else{
					if(state.capabilitiesUrlOrder){
						for (var j = state.capabilitiesUrlOrder.length - 1; j >= 0; j--) {
							var capabilitiesUrl = state.capabilitiesUrlOrder[j];
							for (var i = 0, count = state.activeServices.length; i < count; i++) {
								var serviceCapabilitiesUrl = state.activeServices[i].capabilitiesUrl;
								if(capabilitiesUrl === serviceCapabilitiesUrl){
									self.activeServicesPanel.state = state;
									self.activeServicesPanel.addService(state.activeServices[i],false,true);
									break;
								}
							}
						}
						
					}else{
						for (var i = state.activeServices.length - 1; i >= 0; i--) {
							self.activeServicesPanel.state = state;
							self.activeServicesPanel.addService(state.activeServices[i],false,true);
						}
					}
				}
	
				if(state.kmlRedlining != ""){
					self.kmlRedlining = state.kmlRedlining;
				}
				
				// Load WMS by "Zeige Karte" from Session
				if (wms != null) {
					var serviceWMS = de.ingrid.mapclient.frontend.data.Service
							.createFromCapabilitiesUrl(wms);
					var callback = Ext.util.Functions.createDelegate(self.activeServicesPanel.addService, self.activeServicesPanel);
					de.ingrid.mapclient.frontend.data.Service.load(serviceWMS.getCapabilitiesUrl(), callback);
				}
	
                // initial zoom via request ?
                de.ingrid.mapclient.frontend.data.MapUtils.zoomTo(self.map, inBbox, inSrs);

				self.finishInitMap();
				if (safeStateAfterLoad) {
					self.save(true);
				}
			});
			
			
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
		},
		failure : function(responseText) {
			var callback = Ext.util.Functions.createDelegate( function() {
				self.finishInitMap();
				
				var wmsActiveServices = de.ingrid.mapclient.Configuration.getValue("wmsActiveServices");
				var calls = [];
				if(wmsActiveServices){
					if(de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceAddReversal") == false){
						for (var j = 0; j < wmsActiveServices.length; j++) {
							var wmsActiveService = wmsActiveServices[j];
							var serviceWMS = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(wmsActiveService.capabilitiesUrl);
							var callback = Ext.util.Functions.createDelegate(self.activeServicesPanel.addService, self.activeServicesPanel);
							calls.push([serviceWMS.getCapabilitiesUrl(), wmsActiveService.checkedLayers, callback, false, de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpand"), false]);
						}
					}else{
						for (var j = wmsActiveServices.length - 1; j >= 0; j--) {
							var wmsActiveService = wmsActiveServices[j];
							var serviceWMS = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(wmsActiveService.capabilitiesUrl);
							var callback = Ext.util.Functions.createDelegate(self.activeServicesPanel.addService, self.activeServicesPanel);
							calls.push([serviceWMS.getCapabilitiesUrl(), wmsActiveService.checkedLayers, callback, false, de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpand"), false]);
						}
					}
				}

				if(calls.length > 0){
					de.ingrid.mapclient.frontend.data.Service.loadCalls(calls, 0);
				}
				
				// Add WMS "Zeige Karte"
				if (wms != null) {
					var serviceWMS = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(wms);
					var callback = Ext.util.Functions.createDelegate(self.activeServicesPanel.addService, self.activeServicesPanel);
					de.ingrid.mapclient.frontend.data.Service.load(serviceWMS.getCapabilitiesUrl(), callback, true, true, true);
				}

                // initial zoom via request ?
                de.ingrid.mapclient.frontend.data.MapUtils.zoomTo(self.map, inBbox, inSrs);

				// Add KML "Zeige Punktkoordinaten"
				if (kml != null) {
					self.kmlArray.push(kml);
					self.activeServicesPanel.addKml(self.kmlArray);
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
			}, self);
			self.initDefaultMap(callback);
		}
	});
};

de.ingrid.mapclient.frontend.Workspace.prototype.getElementsByClassName = function (node, classname) {
    var a = [];
    var re = new RegExp('(^| )'+classname+'( |$)');
    var els = node.getElementsByTagName("*");
    for(var i=0,j=els.length; i<j; i++)
        if(re.test(els[i].className))a.push(els[i]);
    return a;
};

de.ingrid.mapclient.frontend.Workspace.prototype.deactivateRedlining = function () {
	var self = this;
	if(self.redliningControler){
		if(self.redliningControler.lastDrawControl){
			self.redliningControler.lastDrawControl.deactivate();
			self.redliningControler.lastDrawControl = null;
		}
	}
}

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

        var styleNames = layer.params.STYLES && [layer.params.STYLES].join(",").split(",");
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
        if(this.useScaleParameter === true && url.toLowerCase().indexOf("request=getlegendgraphic") != -1) {
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
    
    /**
     * @overwrite Openlayers.Layer.setVisibility  
     * the problem is that we give random names to our layers,
     * that dont have one, to make them visible in tree view.
     * This gives us another problem, now every layer has a node,
     * but in GeoExt every node also is a layer with a request when 
     * checked. Every check triggers this(setVisibility) function,
     * our random layer names are all prefixed with "INGRID-".
     * There are several ways to deal with this matter, but this one 
     * seems to be the cheapest, since every other involves overwriting
     * even more api functions.
     *
  
     * 
     * 
     * basically a hack until a better solution is found 
     * @param {} visibility
     */
    //TODO if OpenLayers is updated check if this still makes sense
    OpenLayers.Layer.prototype.setVisibility = function(visibility){
    	
	    // check for NON WMS layers first (KML Layer)
	    if (this.params) {
	    	if(this.params['LAYERS']){
	    		if(this.params['LAYERS'].indexOf('INGRID-') != -1){
		    		visibility = false;
		    	}
	    	}
	    }
	
        if (visibility != this.visibility) {
            this.visibility = visibility;
            this.display(visibility);
            this.redraw();
            if (this.map != null) {
                this.map.events.triggerEvent("changelayer", {
                    layer: this,
                    property: "visibility"
                });
            }
            this.events.triggerEvent("visibilitychanged");
        }
    }
    
