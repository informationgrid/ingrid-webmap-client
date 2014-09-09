/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend");

/**
 * @class Workspace is the main gui component for the frontend.
 */
Ext.define('de.ingrid.mapclient.frontend.Workspace', {
	extend : 'Ext.panel.Panel',
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
	redliningControler : null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		if (this.session == null) {
			throw "Workspace has to be created with a Session instance";
		}
		var self = this;
		this.loadConfig();
		var navigationControl = new OpenLayers.Control.Navigation();
		this.ctrls['navigationControl'] = navigationControl;
		// create the map (default projection read from config)
		this.map = new OpenLayers.Map(self.mapConfig);
		

		// create the map container
		var mapPanel = Ext.create('GeoExt.panel.Map', {
			border : false,
			map : this.map
		});

		// create the accordion for the west panel
		var accordionItems = [];

		// layer tree
		this.activeServicesPanel = Ext.create('de.ingrid.mapclient.frontend.controls.ActiveServicesPanel', {
			map : this.map,
			ctrls: self.ctrls
		});
		accordionItems.push(this.activeServicesPanel);

		// available service categories
		var mapServiceCategories = de.ingrid.mapclient.Configuration.getValue("mapServiceCategories");
		if (mapServiceCategories) {
			for (var i = 0, count = mapServiceCategories.length; i < count; i++) {
				var panel = Ext.create('de.ingrid.mapclient.frontend.controls.ServiceCategoryPanel', {
					id : "serviceCategory_" + mapServiceCategories[i].name,
					mapServiceCategory : mapServiceCategories[i],
					activeServicesPanel : this.activeServicesPanel,
					metadataWindowStartY: 50 + (50*i)
				});
				accordionItems.push(panel);
			}
		}

		// Externen Dienst hinzufügen
		var externServicePanel = Ext.create('de.ingrid.mapclient.frontend.controls.NewServicePanel', {});
		accordionItems.push(externServicePanel);
		
		// search panel
		
		if(self.configPortalSearchEnable == false){
			var searchPanel = Ext.create('de.ingrid.mapclient.frontend.controls.SearchPanel', {});
			accordionItems.push(searchPanel);
		}
		
		var activeItem = 0;
		var activeAccordion = accordionItems[activeItem];
		if (self.configWestAccordion) {
			activeItem = self.configWestAccordion;
			if(accordionItems[activeItem])
				activeAccordion = accordionItems[activeItem];
		}

		// create the panel for the west region
		var westPanel = Ext.create('Ext.panel.Panel', {
			id : 'west',
			region : 'west',
			width : 250,
			layout     : 'fit',
			collapsible : false,
			collapsed: (self.configServicePanel == false && self.configCollapseTool) ? true : false, 
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

		//controls are done in finishinitmap
		// but we need the keybiard control earlier
		var keyboardControl = new OpenLayers.Control.KeyboardDefaults();
		this.ctrls['keyboardControl'] = keyboardControl;
		
		// Collapse Tool
		var collapseTool = Ext.create('Ext.button.Button', {
			iconCls : (self.configServicePanel == false && self.configCollapseTool) ? 'iconCollapseExpand x-tool-img x-tool-expand-right' : 'iconCollapseExpand x-tool-img x-tool-expand-left',
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
							this.setIconCls('iconCollapseExpand x-tool-img x-tool-expand-left');	
						}else{
							this.setIconCls('iconCollapseExpand x-tool-img x-tool-expand-right');
						}
						
	            } 
			},
			hidden: self.configCollapseTool ? false : true
		});

		var collapseToolSpacer = {
			xtype: 'tbspacer', 
			width: 50,
			hidden: self.configCollapseTool ? false : true
		};
		
		// Legend tool
		var legendTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconLegend',
			tooltip : i18n('tLegendToolBar'),
			text : i18n('tLegendToolBar'),
			enableToggle : false, 
			handler: function(btn) {
				var legendDialog = Ext.getCmp('legendDialog');
				if(legendDialog == undefined){
					legendDialog = Ext.create('de.ingrid.mapclient.frontend.controls.LegendDialog', {
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
			},
			hidden: self.configLegendTool ? false : true
		});
			
		var legendToolSeperator = {
	        xtype: 'tbseparator',
	        hidden: self.configLegendTool ? false : true
	    };
		
		// BBOX select tool
		if (self.configSearchBBoxTool) {
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
								}
							}
						}
					});  

			this.map.addControl(coordinatesCtrl);
			coordinatesCtrl.activate();
		}
		

		// b.1) area tool
		var administrativeFeatureInfoControl = Ext.create('de.ingrid.mapclient.frontend.controls.FeatureInfoDialog', {
			id: 'featureInfoControl',
			map: this.map,
			title: i18n('tAdministrativeAuswahl'),
			callbackAreaId:self.callbackAreaId
		});
		this.map.events.on({
			'click': administrativeFeatureInfoControl.checkAdministrativeUnits,
			scope: administrativeFeatureInfoControl
		});
		
		var bboxSearchTool = Ext.create('Ext.button.Button', {
			id : 'bboxButton',
			iconCls : 'iconSelectCoordinates',
			tooltip : i18n('tGebietAuswaehlen'),
			toggleGroup : 'mygroup',
			enableToggle : true,
			pressed: true,
			hidden: self.configSearchBBoxTool ? false : true,
			handler : function(btn) {
				if (btn.pressed) {
					coordinatesCtrl.activate();
					administrativeFeatureInfoControl.deactivate();

				} else {
					coordinatesCtrl.deactivate();

				}
			}
		});
		
		var featureSearchTool = Ext.create('Ext.button.Button', {
			xtype : 'button',
			iconCls : 'iconInfo',
			tooltip : i18n('tIdAuswaehlen'),
			enableToggle : true,
			hidden: self.configSearchFeatureInfoTool ? false : true,
			toggleGroup : 'mygroup',
			handler : function(btn) {
				if (btn.pressed) {
					coordinatesCtrl.deactivate();
					administrativeFeatureInfoControl.activate();
				} else {
					administrativeFeatureInfoControl.deactivate();
				}
			}
		});
		
		var dragSearchTool = Ext.create('Ext.button.Button', {
			xtype : 'button',
			iconCls : 'iconDefault',
			tooltip : i18n('tKarteVerschieben'),
			enableToggle : true,
			hidden: self.configSearchDragMapTool ? false : true,
			toggleGroup : 'mygroup',
			handler : function(btn) {
				if (btn.pressed) {
					coordinatesCtrl.deactivate();
					administrativeFeatureInfoControl.deactivate();
				}
			}
		});
		
		// feature tool
		var featureInfoControl = Ext.create('de.ingrid.mapclient.frontend.controls.FeatureInfoDialog', {
			id: 'featureInfoControl',
			map : this.map
		}); 

		this.map.events.on({
			'click' : featureInfoControl.query,
			scope : featureInfoControl
		});

		var positionControl = Ext.create('de.ingrid.mapclient.frontend.controls.PositionDialog', {
			id: 'positionControl',
			map : this.map,
			y: self.configSpacerTop && this.viewConfig != "default"						
					? parseInt(self.configSpacerTop.trim()) + 75 : 75 
		}); 
		this.map.events.on({
			'click' : positionControl.point,
			scope : positionControl
		});
		
		// drag tool
		var dragTool = Ext.create('Ext.button.Button', {
			id : 'btnDragMap',
			iconCls : 'iconDrag',
			tooltip : i18n('tKarteVerschieben'),
			toggleGroup : 'toggleGroupMapPanel',
			enableToggle : true,
			hidden: self.configDragMapTool || self.configRedliningEnable ? false : true,
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
		});
		
		var infoTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconInfo',
			tooltip : i18n('tObjektinformationen'),
			toggleGroup : 'toggleGroupMapPanel',
			enableToggle : true, 
			hidden: self.configInfoTool ? false : true,
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
					if(self.configDragMapTool || self.configRedliningEnable){
						btn.getEl().dom.click();
					}else{
						featureInfoControl.deactivate();
					}
				}
			}
		});


		// history tool
		// create the OpenLayers control
		var historyCtrl = new OpenLayers.Control.NavigationHistory();
		this.map.addControl(historyCtrl);

		var preHistoryTool = Ext.create('Ext.button.Button', 
			Ext.create('GeoExt.Action', {
				control : historyCtrl.previous,
				hidden: self.configHistoryTool ? false : true,
				disabled : true,
				iconCls : 'iconZoomPrev',
				tooltip : i18n('tZurueck')
			})
		);
		
		var nextHistoryTool = Ext.create('Ext.button.Button', 
			Ext.create('GeoExt.Action', {
				control : historyCtrl.next,
				hidden: self.configHistoryTool ? false : true,
				disabled : true,
				iconCls : 'iconZoomNext',
				tooltip : i18n('tVor')
			})
		);

		var zoomTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconZoom',
			tooltip : i18n('tKarteZoomen'),
			hidden: self.configZoomTool ? false : true,
			enableToggle : false, 
			handler : function(btn) {
				var newProjection = self.map.projection;
				var newMaxExtent = de.ingrid.mapclient.frontend.data.MapUtils.getMaxExtent(newProjection);
				self.map.zoomToExtent(newMaxExtent);
			}
		});

		// measure tool
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
		
		var measureTool = Ext.create('Ext.button.Split', {
			id: 'measureButton',
			iconCls : 'iconMeassure',
			tooltip : i18n('tMessen'),
			toggleGroup : 'toggleGroupMapPanel',
			hidden: self.configMeasureTool ? false : true,
			menu : [Ext.create('Ext.menu.CheckItem', {
						id : 'measurePath',
						text : i18n('tStrecke'),
						toggleGroup : 'measure',
						cls: 'font-menu',
						listeners : {
							checkchange : function(item, checked) {
								if (checked) {
									// Deactivate controls
									featureInfoControl.deactivate();
									
									Ext.getCmp('measurePolygon').setChecked(false);
									measurePathCtrl.activate();
								} else {
									measurePathCtrl.deactivate();
								}
							}
						}
				}), Ext.create('Ext.menu.CheckItem', {
					id : 'measurePolygon',
					text : i18n('tFlaeche'),
					toggleGroup : 'measure',
					cls: 'font-menu',
					listeners : {
						checkchange : function(item, checked) {
							if (checked) {
								// Deactivate controls
								featureInfoControl.deactivate();
								
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
						if(self.configDragMapTool || self.configRedliningEnable){
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
		});
		
		var mapPin = Ext.create('Ext.button.Button', {
			id:'mapPin',
			iconCls : 'iconMapPin',
			tooltip : i18n('tPositionAnzeigen'),
			toggleGroup : 'toggleGroupMapPanel',
			enableToggle : true,
			hidden: self.configPositionButtonEnable ? false : true,
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
					if(self.configDragMapTool || self.configRedliningEnable){
						btn.getEl().dom.click();
					}else{
						positionControl.deactivate();
					}
				}
			}
		});
		
		var countTools = 0;
		
		if(self.configBWaStrLocatorEnable){
			countTools++;
		}
		if(self.configNominatimEnable){
			countTools++;
		}
		if(self.configPortalSearchEnable){
			countTools++;
		}
		
		// Create All
		var allsearchcombobox = Ext.create('GeoExt.form.AllSearchComboBox', {
			id:'allsearchcombobox',
			hideTrigger: true,
			url: "/ingrid-webmap-client/rest/jsonCallback/queryAll?",
			width: 300,
			map: this.map,
			emptyText: i18n("tSearchAllSearch"),
			zoom: 5,
			loadingText: i18n("tSearchAllLoading"),
			emptyClass: 'font-nominatim',
			listClass: 'font-nominatim',
			minChars: 3,
			hidden: countTools > 1 ? false : true,
			tpl: Ext.create('Ext.XTemplate',
					'<tpl for=".">',
			        '<tpl if="this.group != values.group">',
			        '<tpl exec="this.group = values.group"></tpl>',
			        '<hr><h1><span>{displayPre}</span></h1><hr>',
			        '</tpl>',
			        '<div class="x-boundlist-item">{display_field}</div>',
			        '</tpl>'
		    ),
		    listeners: {
		    	'beforequery' : function(){
		    		this.tpl.group="";
		    	}
		    }
		});
		
		// Create BWaStrLocator
		var bwastrlocator = Ext.create('GeoExt.form.BWaStrLocator', {
			id:'bwastrlocator',
			hideTrigger: true,
			url: "/ingrid-webmap-client/rest/jsonCallback/query?searchID=searchterm&url=" + self.configBWaStrLocatorParams,
			width: 300,
			map: this.map,
			emptyText: i18n("tBWaStrLocatorSearch"),
			zoom: 5,
			loadingText: i18n("tBWaStrLocatorLoading"),
			emptyClass: 'font-nominatim',
			listClass: 'font-nominatim',
			minChars: 3,
			hidden: countTools > 1 ? true : self.configBWaStrLocatorEnable ? false : true
		});
		
		// Create Nominatim
		var nominatimTool = Ext.create('GeoExt.form.field.GeocoderComboBox', {
			id:'nominatim',
			hideTrigger: true,
			// To restrict the search to a bounding box, uncomment the following
			// line and change the viewboxlbrt parameter to a left,bottom,right,top
			// bounds in EPSG:4326:
			url: "" + self.configNominatimParams.trim(),
			width: 300,
			map: this.map,
			emptyText: i18n("tNominatimSearch"),
			zoom: 5,
			loadingText: i18n("tNominatimLoading"),
			emptyClass: 'font-nominatim',
			listClass: 'font-nominatim',
			minChars: 3,
			hidden: countTools > 1 ? true : self.configBWaStrLocatorEnable ? true : (self.configNominatimEnable ? false : true)
		});
		
	    // Create PortalSearch
		var portalsearch = Ext.create('GeoExt.form.PortalSearch', {
			id:'portalsearch',
			hideTrigger: true,
			width: 300,
			map: this.map,
			emptyText: i18n("tPortalSearchSearch"),
			zoom: 5,
			loadingText: i18n("tPortalSearchSearch"),
			emptyClass: 'font-nominatim',
			listClass: 'font-nominatim',
			minChars: 1,
			hidden: countTools > 1 ? true : self.configBWaStrLocatorEnable ? true : (self.configNominatimEnable ? true : (self.configPortalSearchEnable ? false : true)),
			tpl: Ext.create('Ext.XTemplate',
			        '<tpl for="."><div class="x-boundlist-item">{name}</div></tpl>'
		    )
		});
	    
		var searchToolStoreData = [];

		if(countTools > 1){
			searchToolStoreData.push(['all', i18n('tSearchToolAll')]);
		}
		
		if(self.configBWaStrLocatorEnable){
			searchToolStoreData.push(['bwastrlocator', i18n('tSearchToolBWaStrLocator')]);
		}
		if(self.configNominatimEnable){
			searchToolStoreData.push(['nominatim', i18n('tSearchToolNominatim')]);
		}
		if(self.configPortalSearchEnable){
			searchToolStoreData.push(['portalsearch', i18n('tSearchToolPortalSearch')]);
		}
		
		var searchToolStore = Ext.create('Ext.data.ArrayStore', {
	        fields: ['searchToolValue', 'searchToolName'],
	        data : searchToolStoreData
	    });
		
		if(self.configPortalSearchEnable
				|| self.configNominatimEnable
				|| self.configBWaStrLocatorEnable){
			
			var combo = Ext.create('Ext.form.ComboBox', {
		    	id:'searchTool',
				store: searchToolStore,
				valueField: 'searchToolValue',
				displayField:'searchToolName',
		        editable: false,
		        mode: 'local',
		        triggerAction: 'all',
		        width: 80,
		        hidden: countTools > 1 ? false : true
		    });
			combo.setValue('all');
			/*
			if(self.configBWaStrLocatorEnable){
				combo.setValue('bwastrlocator');
			} else if(self.configNominatimEnable){
				combo.setValue('nominatim');
			} else if(self.configPortalSearchEnable){
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
			
			var btnBWaStrClear = Ext.create('Ext.button.Button', {
				id: 'btnBWaStrClear',
				iconCls : 'iconErase',
				tooltip : 'BWaStr-Layer/-Marker entfernen',
				enableToggle : false,
				hidden: self.configBWaStrLocatorEnable ? false : true,
				handler: function(btn) {
					de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVector");
					de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVectorTmp");
					de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");
				}
			});
		}
		
		// setting tool
		var settingTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconSettings',
			tooltip : i18n('tSettingsToolBar'),
			text : i18n('tSettingsToolBar'),				
			enableToggle : false, 
			hidden: self.configSettings ? false : true,
			handler: function(btn) {
				var settingsDialog = Ext.getCmp('settingsDialog');
				if(settingsDialog == undefined){
					settingsDialog = Ext.create('de.ingrid.mapclient.frontend.controls.SettingsDialog', {
						map : self.map,
						viewConfig : {
							hasProjectionsList: self.configProjectionsList,
							hasScaleList: self.configScaleList
						},
						ctrls: self.ctrls
					});
					settingsDialog.show();
					settingsDialog.anchorTo(centerPanel.el, 'tr-tr', [-20, 50]);
				}else if(settingsDialog.hidden){
					settingsDialog.show();
				}else{
					settingsDialog.hide();
				}
			}
		});
		
		
		var settingToolSeperator = {
			xtype: 'tbseparator',
			hidden: self.configSettings ? false : true
		};
		
		// print tool
		var printActive = false;
		var printDia = null;
		var printTool = Ext.create('Ext.button.Button', {
			enableToggle:false,
			iconCls : 'iconPrint',
			toggleGroup : self.configDragMapTool || self.configRedliningEnable ? 'toggleGroupMapPanel' : null,
			tooltip : i18n('tDrucken'),
			hidden: self.configPrintTool ? false : true,
			handler : function(btn) {
				measurePathCtrl.deactivate();
				measurePolygonCtrl.deactivate();
				Ext.getCmp('measurePath').setChecked(false);
				Ext.getCmp('measurePolygon').setChecked(false);
				featureInfoControl.deactivate();
				positionControl.deactivate();
				self.deactivateRedlining();
		        if(!printActive){
					printDia = Ext.create('de.ingrid.mapclient.frontend.controls.PrintDialog', {
								mapPanel : mapPanel,
								legendPanel : Ext.getCmp('legendDialog').legendPanel
							});
							printActive = true;
							self.ctrls['keyboardControl'].deactivate();
				}
				printDia.on('close', function(){
					printActive = false;
					self.ctrls['keyboardControl'].activate();
					if(self.configDragMapTool || self.configRedliningEnable){
						var btnDragMap = Ext.getCmp("btnDragMap");
						btnDragMap.getEl().dom.click();
					}
				})
			}
		});

		// load tool
		var loadTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconLoad',
			tooltip : i18n('tLaden'),
			disabled : !this.session.hasUserId(),
			hidden: self.configLoadTool ? false : true,
			handler : function(btn) {
				var dlg = Ext.create('de.ingrid.mapclient.frontend.controls.LoadDialog', {
					id: 'loadDialog',
					session : self.session
				});
				dlg.show();
				self.ctrls.keyboardControl.deactivate();
				dlg.on('close', function(p) {
					if (dlg.isLoad()) {
						var supressMsgs = true;
						self.load(undefined, dlg.getFileId(), supressMsgs);
					}
					self.ctrls.keyboardControl.activate();
				});
			}
		});

		// save tool
		var saveTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconSave',
			hidden: self.configSaveTool ? false : true,
			tooltip : this.session.hasUserId() ? i18n('tSpeichern'):i18n('tZumSpeichernErstEinloggen') ,
			disabled : !this.session.hasUserId(),
			handler : function(btn) {
				var dlg = Ext.create('de.ingrid.mapclient.frontend.controls.SaveDialog', {
					id: 'saveDialog', 
					ctrls: self.ctrls}
				);
				dlg.show();
				dlg.on('close', function(p) {
					if (dlg.isSave()) {
						self.save(false, dlg.getTitle(), dlg.getDescription());
					}
				});
			}
		});

		// download tool
		var downloadTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconDownload',
			hidden: self.configDownloadTool ? false : true,
			tooltip : i18n('tKarteHerunterladen'),
			handler : function(btn) {
				var dia = Ext.create('de.ingrid.mapclient.frontend.controls.DownloadDialog', {
					id: 'downloadDialog', 
					ctrls: self.ctrls}
				);
				dia.show();
				dia.on('close', function(p) {
					if (dia.isSave()) {
						self.download(dia.getTitle());
					}
				});
			}
		});
		
		// portal tool
		var portalScreenTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconPortal',
			hidden: typeof isFullScreen !== "undefined" ? (self.configPortalButton ? false : true) : true,
			tooltip : i18n('tPortal'),
			handler : function(btn) {
				var win=window.open(self.configPortalURL, '_blank');
				win.focus();
			}
		});
		
		// fullscreen tool
		var fullScreenTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconFullScreen',
			hidden: typeof isFullScreen === "undefined" ? (self.configScreenButton ? false : true) : true,
			tooltip : i18n('tFullScreen'),
			handler : function(btn) {
				var url = self.configFullScreenURL;
				if(url.indexOf("?") < 0){
					url = url + "?";
				}
				url = url + "lang=" + languageCode;
				
				var win=window.open(url, '_blank');
				win.focus();
			}
		});
		
		// help tool
		var helpTool = Ext.create('Ext.button.Button', {
			iconCls : 'iconHelp',
			hidden: self.configHelpTool ? false : true,
			tooltip : i18n('tHilfe'),
			handler : function(btn) {
				popupWin = window.open(de.ingrid.mapclient.HELP_URL, "InternalWin", 'width=750,height=550,resizable=yes,scrollbars=yes,location=no,toolbar=yes');
				popupWin.focus();
			}
		});
		
		// create the toolbar
		var toolbar = Ext.create('Ext.toolbar.Toolbar', {
			items : [
			         collapseTool,
			         collapseToolSpacer,	
			         legendTool,
			         legendToolSeperator,
			         bboxSearchTool,
			         featureSearchTool,
			         dragSearchTool,
			         dragTool,
			         infoTool,
			         preHistoryTool,
			         nextHistoryTool,
			         measureTool,
			         zoomTool,
			         mapPin,
			         allsearchcombobox,
			         bwastrlocator,
			         nominatimTool,
			         portalsearch,
			         combo,
			         btnBWaStrClear,
			         {xtype: 'tbfill'},
			         settingTool,
			         settingToolSeperator, 
			         printTool, 
			         loadTool, 
			         saveTool, 
			         downloadTool, 
			         portalScreenTool, 
			         fullScreenTool, 
			         helpTool
	         ]
		});
		// welcome dialog
		if (self.configWelcomeDialog) {
			// show only if cookies do not prevent this
			var showWelcomeDialog = Ext.util.Cookies.get("ingrid.webmap.client.welcome.dialog.hide") !== "true";
			if (showWelcomeDialog) {
		        var welcomeDialog = Ext.create('de.ingrid.mapclient.frontend.controls.WelcomeDialog', {
	                map : this.map,
	                ctrls: self.ctrls
	            });
		        welcomeDialog.show();
			}
		}
		
		var centerPanel = Ext.create('Ext.panel.Panel', {
			region : 'center',
			id: 'centerPanel',
			layout : 'fit',
			items : mapPanel,
			tbar : toolbar,
			bbar : self.configRedliningEnable ? Ext.create('Ext.toolbar.Toolbar', {id: 'cntrPanelBBar'}) : null
		});

		var items;
		items = [centerPanel];

		if (self.configServicePanel) {
			items.push(westPanel);
		}else if(self.configServicePanel == false && self.configCollapseTool){
			items.push(westPanel);
		}

		Ext.apply(this, {
			items : items
		});

		this.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		var self = this;
		this.superclass.onRender.apply(this, arguments);
		if (this.mapUrl) {
			// load the map defined in the mapUrl
			this.load(this.mapUrl);
		} else {
			// try to load existing session data
			this.load();
			// always init default map
			this.activeServicesPanel.on('datachanged', this.onStateChanged, this);
			this.listenToStateChanges = true;
			if (self.configInfoDialog) {
				var searchShowInfoDialog = Ext.util.Cookies.get("ingrid.webmap.client.search.info.dialog.hide") !== "true";
				if(searchShowInfoDialog){
					de.ingrid.mapclient.Message.showInfo(i18n('tUmDerSucheEinenRaumbezugHinzuzufuegenBitteEineAuswahlTreffen'),{width:450, delay:900000}, "ingrid.webmap.client.search.info.dialog.hide");
				}
			}
		}
	},
	loadConfig: function(){
		var self = this;
		
		var projection =  de.ingrid.mapclient.Configuration.getValue('projections');
		var epsg = projection[0].epsgCode;
		
		this.configWestAccordion 	= de.ingrid.mapclient.Configuration.getSettings("viewActiveAccordionWestPanel");
		this.configServicePanel		= de.ingrid.mapclient.Configuration.getSettings("viewHasServicesPanel");
		this.configCollapseTool		= de.ingrid.mapclient.Configuration.getSettings("viewHasCollapseTool");
		this.configLegendTool		= de.ingrid.mapclient.Configuration.getSettings("viewHasLegendTool");
		this.configSpacerTop		= de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop");
		this.configDragMapTool		= de.ingrid.mapclient.Configuration.getSettings("viewHasDragMapTool");
		this.configRedliningEnable	= de.ingrid.mapclient.Configuration.getSettings("viewRedliningEnable");
		this.configInfoTool			= de.ingrid.mapclient.Configuration.getSettings("viewHasInfoTool");
		this.configHistoryTool		= de.ingrid.mapclient.Configuration.getSettings("viewHasHistoryTool");
		this.configZoomTool			= de.ingrid.mapclient.Configuration.getSettings("viewHasZoomTool");
		this.configMeasureTool		= de.ingrid.mapclient.Configuration.getSettings("viewHasMeasureTool");
		this.configPositionButtonEnable = de.ingrid.mapclient.Configuration.getSettings("viewPositionButtonEnable");
		this.configNominatimEnable	= de.ingrid.mapclient.Configuration.getSettings("viewNominatimEnable");
		this.configNominatimParams	= de.ingrid.mapclient.Configuration.getSettings("viewNominatimParams");
		this.configPortalSearchEnable = de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchEnable");
		this.configBWaStrLocatorParams = de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorParams");
		this.configBWaStrLocatorEnable = de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable");
		this.configSettings			= de.ingrid.mapclient.Configuration.getSettings("viewHasSettings");
		this.configProjectionsList	= de.ingrid.mapclient.Configuration.getSettings("viewHasProjectionsList");
		this.configScaleList		= de.ingrid.mapclient.Configuration.getSettings("viewHasScaleList");
		this.configPrintTool		= de.ingrid.mapclient.Configuration.getSettings("viewHasPrintTool");
		this.configLoadTool			= de.ingrid.mapclient.Configuration.getSettings("viewHasLoadTool");
		this.configSaveTool			= de.ingrid.mapclient.Configuration.getSettings("viewHasSaveTool");
		this.configHelpTool			= de.ingrid.mapclient.Configuration.getSettings("viewHasHelpTool");
		this.configDownloadTool		= de.ingrid.mapclient.Configuration.getSettings("viewHasDownloadTool");
		this.configPortalButton		= de.ingrid.mapclient.Configuration.getSettings("viewPortalButton");
		this.configPortalURL		= de.ingrid.mapclient.Configuration.getSettings("viewPortalURL");
		this.configScreenButton		= de.ingrid.mapclient.Configuration.getSettings("viewFullScreenButton");
		this.configFullScreenURL	= de.ingrid.mapclient.Configuration.getSettings("viewFullScreenURL");
		this.configWelcomeDialog	= de.ingrid.mapclient.Configuration.getSettings("viewHasWelcomeDialog");
		this.configMinimapEnable	= de.ingrid.mapclient.Configuration.getSettings("viewMinimapEnable");
		this.configRedliningStyleEnable = de.ingrid.mapclient.Configuration.getSettings("viewRedliningStyleEnable");
		this.configActiveServiceAddReversal = de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceAddReversal");
		this.configActiveServiceTreeExpand = de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpand");
		this.configInfoDialog		= false;
		this.configSearchBBoxTool	= false;
		this.configSearchFeatureInfoTool = false;
		this.configSearchDragMapTool= false;
		
		// Configuration variable
		this.mapConfig = {
			containingViewport:self,
			fractionalZoom : true,
			projection : epsg ? new OpenLayers.Projection(epsg) : new OpenLayers.Projection("EPSG:4326"),
			displayProjection : epsg ? new OpenLayers.Projection(epsg) : new OpenLayers.Projection("EPSG:4326"),
			controls : [new OpenLayers.Control.Navigation(),
						new OpenLayers.Control.PanZoomBar(),
						new OpenLayers.Control.ScaleLine(),
						//new OpenLayers.Control.LayerSwitcher(),
						new OpenLayers.Control.MousePosition()]
		};
		
		if(this.viewConfig  == "search" || this.viewConfig  == "search-facets"){
			this.configWestAccordion 	= false;
			this.configServicePanel		= de.ingrid.mapclient.Configuration.getSettings("searchHasServicesPanel");
			this.configCollapseTool		= false;
			this.configLegendTool		= de.ingrid.mapclient.Configuration.getSettings("searchHasLegendTool");
			this.configSpacerTop		= null;
			this.configDragMapTool		= false;
			this.configRedliningEnable	= false;
			this.configInfoTool			= false;
			this.configHistoryTool		= de.ingrid.mapclient.Configuration.getSettings("searchHasHistoryTool");
			this.configZoomTool			= false;
			this.configMeasureTool		= de.ingrid.mapclient.Configuration.getSettings("searchHasMeasureTool");
			this.configPositionButtonEnable = false;
			this.configNominatimEnable	= de.ingrid.mapclient.Configuration.getSettings("searchNominatimEnable");
			this.configNominatimParams	= de.ingrid.mapclient.Configuration.getSettings("searchNominatimParams");
			this.configPortalSearchEnable = false;
			this.configBWaStrLocatorParams = de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorParams");
			this.configBWaStrLocatorEnable = false;
			this.configSettings			= de.ingrid.mapclient.Configuration.getSettings("searchHasSettings");
			this.configProjectionsList	= de.ingrid.mapclient.Configuration.getSettings("searchHasProjectionsList");
			this.configScaleList		= de.ingrid.mapclient.Configuration.getSettings("searchHasScaleList");
			this.configPrintTool		= de.ingrid.mapclient.Configuration.getSettings("searchHasPrintTool");
			this.configLoadTool			= de.ingrid.mapclient.Configuration.getSettings("searchHasLoadTool");
			this.configSaveTool			= de.ingrid.mapclient.Configuration.getSettings("searchHasSaveTool");
			this.configHelpTool			= de.ingrid.mapclient.Configuration.getSettings("searchHasHelpTool");
			this.configDownloadTool		= false;
			this.configPortalButton		= false;
			this.configPortalURL		= de.ingrid.mapclient.Configuration.getSettings("viewPortalURL");
			this.configScreenButton		= false;
			this.configFullScreenURL	= de.ingrid.mapclient.Configuration.getSettings("viewFullScreenURL");
			this.configWelcomeDialog	= false;
			this.configMinimapEnable	= de.ingrid.mapclient.Configuration.getSettings("searchMinimapEnable");
			this.configRedliningStyleEnable = de.ingrid.mapclient.Configuration.getSettings("viewRedliningStyleEnable");
			this.configActiveServiceAddReversal = de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceAddReversal");
			this.configActiveServiceTreeExpand = de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpand");
			this.configInfoDialog		= de.ingrid.mapclient.Configuration.getSettings("searchHasInfoDialog");
			this.configSearchBBoxTool			= de.ingrid.mapclient.Configuration.getSettings("searchHasBboxSelectTool");
			this.configSearchFeatureInfoTool	= de.ingrid.mapclient.Configuration.getSettings("searchHasFeatureInfoTool");
			this.configSearchDragMapTool= true;
		
			this.mapConfig = {
				fractionalZoom: true,
				projection: epsg ? new OpenLayers.Projection(epsg) : new OpenLayers.Projection("EPSG:4326"),
				displayProjection: epsg ? new OpenLayers.Projection(epsg) : new OpenLayers.Projection("EPSG:4326"),
				controls : [new OpenLayers.Control.Navigation(),
							new OpenLayers.Control.PanZoomBar(),
							new OpenLayers.Control.ScaleLine(),
							new OpenLayers.Control.MousePosition()]
			};			
		}
	},
	/**
	 * Initialize the map with the default service
	 * 
	 * @param callback
	 *            Function to be called after initialization finished
	 */
	initDefaultMap: function(callback) {
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
				var isDefaultLayer = selectedLayerNames.indexOf(layer.name) != -1 ? true : false;
				// set the baselayer attribute
				var isBaseLayer = (layer.name == baseLayerName) ? true : false;
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
				de.ingrid.mapclient.frontend.data.MapUtils.assureProj4jsDef(projections[0].epsgCode, function() {
						de.ingrid.mapclient.frontend.data.MapUtils.changeProjection(projections[0].epsgCode, self.map, this, true);
						self.map.events.triggerEvent("zoomend");
				});
			} else {
				// set initial bounding box for the map (expected to be WGS 84)
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
	},
	/**
	 * Create the OpenLayers controls for the map.
	 */
	finishInitMap: function() {
		var self = this;

		if(self.configMinimapEnable){
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
					var copyright = Ext.getCmp("copyright");
					if(copyright)
						copyright.style.right =  "25px";
				},
				maximizeControl: function(e) {
					this.element.style.display = '';
					this.showToggle(false);
					if (e != null) {
					OpenLayers.Event.stop(e);
					}
					var copyright = Ext.getCmp("copyright");
					if(copyright)
						copyright.style.right =  "220px";
				},
				mapOptions:mapOptions
			});
			this.map.addControl(ov);
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
		
		var welcomeDialog = Ext.getCmp("welcomeDialog");
		if(welcomeDialog){
			welcomeDialog.updateLayout();
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
		if (self.configRedliningEnable) {
			var cntrPanel = Ext.getCmp('centerPanel');
			var cntrPanelBbar = Ext.getCmp('cntrPanelBBar');
			
			this.redliningControler = Ext.create('GeoExt.ux.FeatureEditingControler', {
			        cosmetic: true,
			        map: this.map,
			        toggleGroup : 'toggleGroupMapPanel',
			        // TODO: Check Styles import export
			        styler: self.configRedliningStyleEnable,
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
			            	this.getSelectControl().selectFeature(feature);
			            }else{
			            	drawControl.activate();
			            	feature.layer.destroyFeatures([feature]);
			            }
			        }
			    });
				cntrPanelBbar.add(this.redliningControler.actions);
				cntrPanelBbar.doLayout();
			
			if(self.kmlRedlining){
				GeoExt.ux.data.Import(self.map, this.redliningControler.activeLayer, 'KML', self.kmlRedlining, null);
			}
		}
	},
	/**
	 * Display a measurement result
	 * 
	 * @param event
	 *            Event with measure, units, order, and geometry properties as
	 *            received from OpenLayers.Control.Measure
	 */
	measure: function(event) {
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
		Ext.create('Ext.window.Window', {
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
	},
	/**
	 * Method to be called, when any data changes that needs to be stored on the
	 * server. To prevent execution set listenToStateChanges to false
	 */


	onStateChanged: function() {
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
	    	self.stateChangeTimer = setTimeout(function(){
	    		self.save(true)
	    	}, 100);
		}
	},
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
	save: function(isTemporary, title, description) {
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
		// TODO ktt: Session saving
		this.session.save(data, isTemporary, responseHandler);
	},
	/**
	 * Store the current map state along with the given title and description on the
	 * server.
	 * 
	 * @param title
	 *            The map state title (optional)
	 * @param description
	 *            The map state description (optional)
	 */
	download: function(title) {
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
	},
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
	load: function(shortUrl, id, supressMsgs) {
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
						var leaf = null;
						for (var j = 0, countJ = selectedLayer.length; j < countJ; j++) {
							var entry = selectedLayer[j];
							if(entry[0] == "id"){
								id = entry[1];
							}else if(entry[0] == "capabilitiesUrl"){
								capabilitiesUrl = entry[1];
							}else if(entry[0] == "checked"){
								checked = entry[1];
							}else if(entry[0] == "leaf"){
								leaf = entry[1];
							}
						}
						self.activeServicesPanel.selectedLayersByService.push({
							id:id,
							capabilitiesUrl:capabilitiesUrl,
							checked:checked,
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
					if(self.configActiveServiceAddReversal == false){
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
						var callback = Ext.Function.bind(self.activeServicesPanel.addService, self.activeServicesPanel);
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
					if (kml) {
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
					if (kml) {
						self.kmlArray.push(kml);
						state.kmlArray.push(kml);
						self.activeServicesPanel.addKml(self.kmlArray);
					}
				}
			},
			failure : function(responseText) {
				var callback = Ext.Function.bind( function() {
					self.finishInitMap();
					
					var wmsActiveServices = de.ingrid.mapclient.Configuration.getValue("wmsActiveServices");
					var calls = [];
					if(wmsActiveServices){
						if(self.configActiveServiceAddReversal == false){
							for (var j = 0; j < wmsActiveServices.length; j++) {
								var wmsActiveService = wmsActiveServices[j];
								var serviceWMS = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(wmsActiveService.capabilitiesUrl);
								var callback = Ext.Function.bind(self.activeServicesPanel.addService, self.activeServicesPanel);
								calls.push([serviceWMS.getCapabilitiesUrl(), wmsActiveService.checkedLayers, callback, false, self.configActiveServiceTreeExpand, false]);
							}
						}else{
							for (var j = wmsActiveServices.length - 1; j >= 0; j--) {
								var wmsActiveService = wmsActiveServices[j];
								var serviceWMS = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(wmsActiveService.capabilitiesUrl);
								var callback = Ext.Function.bind(self.activeServicesPanel.addService, self.activeServicesPanel);
								calls.push([serviceWMS.getCapabilitiesUrl(), wmsActiveService.checkedLayers, callback, false, self.configActiveServiceTreeExpand, false]);
							}
						}
					}

					if(calls.length > 0){
						de.ingrid.mapclient.frontend.data.Service.loadCalls(calls, 0);
					}
					
					// Add WMS "Zeige Karte"
					if (wms != null) {
						var serviceWMS = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(wms);
						var callback = Ext.Function.bind(self.activeServicesPanel.addService, self.activeServicesPanel);
						de.ingrid.mapclient.frontend.data.Service.load(serviceWMS.getCapabilitiesUrl(), callback, true, true, true);
					}

	                // initial zoom via request ?
	                de.ingrid.mapclient.frontend.data.MapUtils.zoomTo(self.map, inBbox, inSrs);

					// Add KML "Zeige Punktkoordinaten"
					if (kml) {
						self.kmlArray.push(kml);
						self.activeServicesPanel.addKml(self.kmlArray);
					}
				}, self);
				self.initDefaultMap(callback);
			}
		});
	},
	getElementsByClassName: function (node, classname) {
	    var a = [];
	    var re = new RegExp('(^| )'+classname+'( |$)');
	    var els = node.getElementsByTagName("*");
	    for(var i=0,j=els.length; i<j; i++)
	        if(re.test(els[i].className))a.push(els[i]);
	    return a;
	},
	deactivateRedlining: function () {
		var self = this;
		if(self.redliningControler){
			if(self.redliningControler.lastDrawControl){
				self.redliningControler.lastDrawControl.deactivate();
				self.redliningControler.lastDrawControl = null;
			}
		}
	}
});

OpenLayers.Map.prototype.setCenter = function(lonlat, zoom, dragging, forceZoomChange) {
	if (this.panTween) {
        this.panTween.stop();
    }
    if (this.zoomTween) {
        this.zoomTween.stop();
    }            
    this.moveTo(lonlat, zoom, {
        'dragging': dragging,
        'forceZoomChange': forceZoomChange
    });
    
	//on each setcenter method(fired when zoomed), we check if our layers are in the right
    //scale to be displayed
    var servicesPanel = Ext.getCmp("activeServices");
    var root = servicesPanel.layerTree.getRootNode();
    servicesPanel.checkScaleRecursively(root, this.getScale());
};

// FIX TileManager for SingleTiles
OpenLayers.TileManager.prototype.addTile =  function(evt) {
    if (evt.tile instanceof OpenLayers.Tile.Image) {
    	if (!evt.tile.layer.singleTile) {
	        evt.tile.events.on({
	            beforedraw: this.queueTileDraw,
	            beforeload: this.manageTileCache,
	            loadend: this.addToCache,
	            unload: this.unloadTile,
	            scope: this
	        });
    	}
    } else {
        // Layer has the wrong tile type, so don't handle it any longer
        this.removeLayer({layer: evt.tile.layer});
    }
};