/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");


/**
 * @class ServicePanel is used to manage a list of map projections.
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel = Ext.extend(de.ingrid.mapclient.admin.controls.CategoryPanel, {

	id: 'serviceGridPanel',
	itemId: 'serviceGridPanel',
    title: 'Dienste',
    
	/**
	 * The ArrayStore for the services
	 */
	serviceStore: new Ext.data.ArrayStore({
		autoDestroy: true,
		fields: [{
			name: 'name',
			type: 'string'
		}, {
			name: 'capabilitiesUrl',
			type: 'string'
		}, {
			name: 'capabilitiesUrlOrg',
			type: 'string'
		}, {
			name: 'mapServiceCategories',
			type: 'array'
		}, {
			name: 'originalCapUrl',
			type: 'string'
		}, {
			name: 'checkedLayers',
			type: 'array'
		}, {
			name: 'jsonLayers',
			type: 'string'
		}]
	}),

	/**
	 * The column configuration
	 */
	columns: [{
		header: 'Name',
		sortable: true,
		dataIndex: 'name', 
		editor:{
        	xtype: 'textfield'
        }
	}, {
		header: 'URL',
		sortable: true,
		dataIndex: 'capabilitiesUrl', 
		editor:{
        	xtype: 'textfield'
        }
	}, {
		header: 'Original URL',
		sortable: true,
		dataIndex: 'originalCapUrl', 
		editor:{
        	xtype: 'textfield'
        } 
	},{
    	header: 'Info',
		sortable: false,
		id: 'capabilities',
	    width: 10,
	    renderer: function(v, p, record, rowIndex){
	        return '<div class="iconInfo"></div>';
	    }
	}],
	serviceGrid: null,
	services: null,
	selectedService: null,
	selectedModel:null,
	copyServiceBtn:null,
	deleteServiceBtn:null,
	reloadServiceBtn:null,
	addServiceBtn:null,
	jsonColumn: ['name', 'capabilitiesUrl', 'capabilitiesUrlOrg', 'mapServiceCategories', 'originalCapUrl', 'checkedLayers'],
	isSave:false
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.initComponent = function() {
	var self = this;
	
	var filters = new Ext.ux.grid.GridFilters({
        // encode and local configuration options defined previously for easier reuse
        encode: false, // json encode the filter query
        local: true,   // defaults to false (remote filtering)
        menuFilterText: 'Filtern',
        filters: [{
            type: 'string',
            dataIndex: 'name'
        }, {
            type: 'string',
            dataIndex: 'capabilitiesUrl'
        }, {
            type: 'string',
            dataIndex: 'originalCapUrl'
        }]
    });
	
	self.serviceGrid = new  Ext.grid.EditorGridPanel({
		store: self.serviceStore,
		columns: self.columns,
		plugins:[filters],
		autoDestroy:false,
		viewConfig: {
			forceFit: true
		},
		height: 360
	});
	
	self.serviceGrid.on("filterupdate", function() {
		 // Remove categories and layer panel
		 self.remove(self.items.get('serviceDetailBorderPanel'));
	});
	
	self.serviceGrid.on("sortchange", function(grid) {
		if(self.selectedService){
			if(self.selectedService.data){
				if(self.selectedService.data.capabilitiesUrl){
					var capabilitiesUrl = self.selectedService.data.capabilitiesUrl;
					var service = {
							   title: self.selectedService.data.name,
							   capabilitiesUrl: self.selectedService.data.capabilitiesUrl,
							   originalCapUrl: self.selectedService.data.originalCapUrl
					   };
					self.reloadServiceFromConfig(service);
				}
			}else{
				self.remove(self.items.get('serviceDetailBorderPanel'));
			}
		}
	});

	self.serviceGrid.getSelectionModel().on('cellselect', function(selModel, node) {
		if(selModel.selection){
			self.selectedModel = selModel.selection; 
			var serviceRecord = selModel.selection.record;
			if(serviceRecord){
				var column = selModel.selection.cell[1];
				var selectedColumn = 0;
				
				for (var i=0, countI=self.columns.length; i<countI; i++) {
					var columnObj = self.columns[i]
					if(columnObj.id == "capabilities"){
						selectedColumn = i;
						break;
					}
				}
				if(column == selectedColumn){
					window.open(de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(serviceRecord.data.capabilitiesUrl));
				}else{
					if(self.selectedService != serviceRecord){
						self.selectedService = serviceRecord; 
						var orginalCapUrl = serviceRecord.json[self.getJsonIndex('originalCapUrl')];
						if(orginalCapUrl){
							self.loadServiceLayerFromFile(serviceRecord);
						}else{
							self.copyServiceToServer(serviceRecord);
					   }
					}
				}				
			}
		}
	});
	
	self.serviceGrid.on('afteredit', function(store) {
		if(store.field === "name"){
			self.updateService(store.value, store.record.data.capabilitiesUrl, store.record.data.capabilitiesUrlOrg, store.record.data.originalCapUrl);			
		}else{
			store.record.reject();
		}
	});
	
	self.copyServiceBtn = new Ext.Button({
		tooltip: 'Kopieren',
		text: 'Kopieren',
		disabled: true,
		handler: function(btn) {
			self.copyService();
		}
	});
	self.reloadServiceBtn = new Ext.Button({
		tooltip: 'Neu einlesen',
		text: 'Neu einlesen',
		disabled: true,
		handler: function(btn) {
			self.reloadService();
		}
	});
	self.deleteServiceBtn = new Ext.Button({
		tooltip: 'L&ouml;schen',
		text: 'L&ouml;schen',
		disabled: true,
		handler: function(btn) {
			self.deleteService('Sind Sie sicher, das der ausgew&auml;hlte Dienst entfernt werden soll?');
		}
	});
	self.addServiceBtn = new Ext.Button({
		tooltip: 'Hinzuf&uuml;gen',
		text: 'Hinzuf&uuml;gen',
		disabled: false,
		handler: function(btn) {
			self.addService();
		}
	});
	
	// create the final layout
	Ext.apply(this, {
		items: self.serviceGrid,
		tbar: items = [ self.addServiceBtn,
		                '-',
		                self.deleteServiceBtn,
		                '-',
		                self.copyServiceBtn,
		                '-',
		                self.reloadServiceBtn
		              ]
	});
	
	de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.superclass.onRender.apply(this, arguments);

	// initialize the service list
	this.services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
	de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.loadServices(this.serviceStore,
			this.services, this.jsonColumn);
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.loadServices = function(store, items, attributes, preventEvents) {
	var self = this;
	if (preventEvents == undefined) {
		preventEvents = true;
	}
	// convert item objects into record arrays
	var records = [];
	for (var i=0, countI=items.length; i<countI; i++) {
		var item = items[i];
		var record = [];
		self.layers = new Array();
		for (var j=0, countJ=attributes.length; j<countJ; j++) {
			var attribute = attributes[j];
			record.push(item[attribute]);	
		}
		records.push(record);
	}
	// load the data into the store (avoid any events fired)
	if (preventEvents) {
		store.suspendEvents(false);		
	}
	
	store.loadData(records);
	if (preventEvents) {
		store.resumeEvents(false);
	}
};

/**
 * Update services changes to config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.updateService = function (title, capabilitiesUrl, capabilitiesUrlOrg, originalCapUrl, categories, layers) {
	var self = this;
	if(capabilitiesUrl){
		var service = {
				   title: (title) ? title : null,
				   capabilitiesUrl: capabilitiesUrl,
				   capabilitiesUrlOrg: capabilitiesUrlOrg,
				   originalCapUrl: originalCapUrl,
				   categories: (categories) ? categories : null,
				   layers: (layers) ? layers : null
		   };
		// Update service
		self.setValue('updateservice', service, 'Bitte warten! &Auml;nderungen werden gespeichert!');
	}
};

/**
 * Add services to config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.addService = function() {
	var self = this;
	var simple = new Ext.FormPanel({
        labelWidth: 75, // label settings here cascade unless overridden
        frame:true,
        title: 'Dienst hinzuf&uuml;gen',
        bodyStyle:'padding:5px 5px 0',
        width: 350,
        defaults: {width: 350},
        defaultType: 'textfield',

        items: [{
                fieldLabel: '<b>URL</b>',
                name: 'url',
                id: 'url',
                emptyText: 'URL des Dienstes'
            },{
        	 	xtype: 'textfield',
             	fieldLabel: '<i>Name<i>',
                name: 'name',
                id: 'name',
                emptyText: 'Name des Dienstes (optional)'
            }
	],

        buttons: [{
            text: 'Speichern',
            handler: function(btn) {
            	var name = simple.items.get('name').el.dom.value;
            	var url = simple.items.get('url').el.dom.value;
            	
            	if(url != simple.items.get('url').emptyText && name != simple.items.get('name').emptyText){
            		var service = { 
            				title:name, 
            				originalCapUrl:url, 
            				capabilitiesUrlOrg:"",
            				categories:[],
            				layers:[] 
            		};
            		// Add service
            		self.setValue ('addservice', service, 'Bitte warten! Dienst wird hinzugef&uuml;gt!', false, true);
                	win.close();
            	}else if(url != simple.items.get('url').emptyText){
            		var service = { 
            				title:null,
            				originalCapUrl:url,
            				capabilitiesUrlOrg:"",
            				categories:[],
            				layers:[]
            		};
            		// Add service
            		self.setValue ('addservice', service, 'Bitte warten! Dienst wird hinzugef&uuml;gt!', false, true);
                	win.close();
            	}
    		}
        },{
            text: 'Abbrechen',
            handler: function(btn) {
            	win.close();
    		}
        }]
    });
	
	var win = new Ext.Window({
							layout: 'fit',
					        width: 500,
					        height: 300,
					        modal: true,
					        closeAction: 'hide',
					        items: simple
					        });
	win.show();
};

/**
 * Reload services
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.reloadService = function() {
	var self = this;
	var reloadService = self.selectedService;
	Ext.Msg.show({
	   title:'Dienst neu einlesen',
	   msg: 'Sind Sie sicher, das der ausgew&auml;hlte Dienst zur&uuml;ckgesetzt werden soll?',
	   buttons: Ext.Msg.OKCANCEL,
	   icon: Ext.MessageBox.QUESTION,
	   fn: function(btn){
		   if (btn == 'ok'){
			   if(reloadService.data){
				   var service = { 
						   title: reloadService.data.name,
						   capabilitiesUrl: reloadService.data.capabilitiesUrl,
						   capabilitiesUrlOrg: reloadService.data.capabilitiesUrlOrg,
						   originalCapUrl: reloadService.data.originalCapUrl, 
						   layers: [] };
				   // Reload service
				   self.setValue ('reloadservice', service, 'Bitte warten! Dienst wird neugeladen!');
			   }
		   }
	   	}
	});
};

/**
 * Delete services from config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.deleteService = function(msg) {
	var self = this;
	var deleteService = self.selectedService;
	Ext.Msg.show({
	   title:'Dienst l&ouml;schen',
	   msg: msg,
	   buttons: Ext.Msg.OKCANCEL,
	   icon: Ext.MessageBox.QUESTION,
	   fn: function(btn){
		   if (btn == 'ok'){
			   var service = { capabilitiesUrl: deleteService.data.capabilitiesUrl};
			   // Remove service from config
			   de.ingrid.mapclient.Configuration.setValue('removeservice', Ext.encode(service), de.ingrid.mapclient.admin.DefaultSaveHandler);
			   // Remove service from store
			   self.serviceStore.data.removeKey(self.selectedService.id);
			   // Refresh service panel
			   self.serviceGrid.getView().refresh();
			   // Disable copy, reload, delete Button
			   self.copyServiceBtn.disable();
			   self.reloadServiceBtn.disable();
			   self.deleteServiceBtn.disable(),
			   // Remove categories and layer panel
			   self.remove(self.items.get('serviceDetailBorderPanel'));
		   }else{
			// Refresh service panel
			   self.serviceGrid.getView().refresh();
			   // Disable copy, reload, delete Button
			   self.copyServiceBtn.disable();
			   self.reloadServiceBtn.disable();
			   self.deleteServiceBtn.disable(),
			   // Remove categories and layer panel
			   self.remove(self.items.get('serviceDetailBorderPanel'));
		   }
	   	}
	});
};


/**
 * Copy services from config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.copyService = function() {
	var self = this;
	var copyService = self.selectedService;

	var simple = new Ext.FormPanel({
        labelWidth: 75, // label settings here cascade unless overridden
        frame:true,
        title: 'Dienst kopieren',
        bodyStyle:'padding:5px 5px 0',
        width: 350,
        defaults: {width: '90%'},
        defaultType: 'textfield',

        items: [{
        	 	xtype: 'textfield',
             	fieldLabel: 'Name',
                name: 'name',
                id: 'name',
                emptyText: copyService.data.name + " (Kopie)"
            }
        ],

        buttons: [{
            text: 'Kopieren',
            handler: function(btn) {
            	var name = simple.items.get('name').el.dom.value;
            	if(name != ''){
            		var originalCapUrl = '';
            		var capabilitiesUrl = '';
            		var capabilitiesUrlOrg = '';
    				var categories = [];
    				var layers = [];
    				var checkedLayers = [];
    				
    				if(copyService.data.name){
    					title = copyService.data.name;
    				}
    				if(copyService.data.capabilitiesUrl){
    					capabilitiesUrl = copyService.data.capabilitiesUrl;
    				}
    				
    				if(copyService.data.capabilitiesUrlOrg){
    					capabilitiesUrlOrg = copyService.data.capabilitiesUrlOrg;
    				}
    			
    				if(copyService.data.mapServiceCategories){
    					for (var i=0, countI=copyService.data.mapServiceCategories.length; i<countI; i++) {
    						categories.push(copyService.data.mapServiceCategories[i].idx);
    					}
    				}
    				
    				if(copyService.data.originalCapUrl){
    					originalCapUrl = copyService.data.originalCapUrl;
    				}
    				
    				if(copyService.data.jsonLayers){
    					var layers = [];
    					for (var i=0, countI=copyService.data.jsonLayers.length; i<countI; i++) { 
    						var layer = copyService.data.jsonLayers[i];
    						var checkedLayers = copyService.data.checkedLayers;
    						if(checkedLayers && checkedLayers.length > 0){
    							var layerIsFound = false;
    							for (var j=0, countJ=checkedLayers.length; j<countJ; j++) { 
    								if(layer.index == checkedLayers[j]){
    									layerIsFound = true;
    									break;
    								}
    							}
    							copyService.data.jsonLayers[i].checked = layerIsFound;
    						}
    					}
    					layers = copyService.data.jsonLayers;
    				}
    				
    				var service = {
    					   title: name,
    					   capabilitiesUrl: capabilitiesUrl,
    					   capabilitiesUrlOrg: capabilitiesUrlOrg,
    					   originalCapUrl: (originalCapUrl) ? originalCapUrl : capabilitiesUrl,
    					   categories: categories,
    					   layers: layers
    				};
    				// Save copy to config
    				self.setValue ('copyservice', service, 'Bitte warten! Dienst wird kopiert!', false, true);
                	win.close();
            	}
    		}
        },{
            text: 'Abbrechen',
            handler: function(btn) {
            	win.close();
    		}
        }]
    });
	
	var win = new Ext.Window({
					layout: 'fit',
			        width: 500,
			        height: 300,
			        modal: true,
			        closeAction: 'hide',
			        items: simple
			        });
	win.show();
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.getJsonIndex = function(name) {
	var self = this;
	var columnIndex = 0;
	for (var i=0, countI=self.jsonColumn.length; i<countI; i++) {
		var jsonColumnName = self.jsonColumn[i];
		if(name == jsonColumnName){
			columnIndex = i;
			break;
		}
	}
	return columnIndex;
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.reloadServiceFromConfig = function(service, doServiceNew){
	var self = this;
	var services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
	// Set services to store
	self.loadServices(self.serviceStore, services, self.jsonColumn);
	// Refresh service panel
	self.serviceGrid.getView().refresh();
	var ds = self.serviceGrid.getView().ds;
	var title = service.title;
	var originalCapUrl = service.originalCapUrl;
	var capabilitiesUrlService = service.capabilitiesUrl;
	
	
	if(doServiceNew){
		if(services){
			var newService = services[services.length - 1];
			if(newService){
				var capabilitiesUrl = newService.capabilitiesUrl;
				if(capabilitiesUrl){
					var dsData = ds.data;
					if(dsData){
						var dsDataItems = dsData.items;
						if(dsDataItems){
							var row = 0;
							var column = 0;
							for (var i=0, countI=dsDataItems.length; i<countI; i++) {
								var item = dsDataItems[i];
								if(item.data){
									var itemCapabilitiesUrl = item.data.capabilitiesUrl;
									if(itemCapabilitiesUrl){
										if(itemCapabilitiesUrl == capabilitiesUrl){
											row = i;
											break;
										}
									}
								}
							}
							self.serviceGrid.getSelectionModel().select(row, column);
						}
					}
				}
			}
		}
	}else{
		if(ds && title && originalCapUrl && capabilitiesUrlService){
			var dsData = ds.data;
			if(dsData){
				var dsDataItems = dsData.items;
				if(dsDataItems){
					var row = 0;
					var column = 0;
					for (var i=0, countI=dsDataItems.length; i<countI; i++) {
						var item = dsDataItems[i];
						if(item.data){
							var itemTitle = item.data.name;
							var itemOriginalCapUrl = item.data.originalCapUrl;
							var itemCapabilitiesUrl = item.data.capabilitiesUrl;
							if(itemTitle && itemOriginalCapUrl){
								if(itemTitle == title && itemOriginalCapUrl == originalCapUrl && itemCapabilitiesUrl == capabilitiesUrlService){
									row = i;
									break;
								}
							}
						}
					}
					self.serviceGrid.getSelectionModel().select(row, column);
				}
			}
		}
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.loadServiceLayerFromFile  = function (serviceRecord){
	var self = this;
	
	self.copyServiceBtn.enable();
	self.reloadServiceBtn.enable();
	self.deleteServiceBtn.enable();
	
	if(serviceRecord.data.capabilitiesUrlOrg){
		var xmlStore = new Ext.data.Store({
	        // load using HTTP
	        url: serviceRecord.data.capabilitiesUrlOrg,
			// the return will be XML, so lets set up a reader
	        reader: new Ext.data.XmlReader({
	               record: 'Layer'
	           }, [
	               // set up the fields mapping into the xml doc
	               // The first needs mapping, the others are very basic
	               {name: 'title', mapping: '/Title'},
	               {name: 'name', mapping: '/Name'},
	               {name: 'featureInfo', mapping: '/@queryable', type: 'int'},
	               {name: 'legend', mapping: '/Style/LegendURL/OnlineResource'}
	               
	           ]),
	           listeners : {
	               load: function(store, records, succesful, operation){
	            	   var layerRecord = [];
	            	   for (var i=0, countI=records.length; i<countI; i++) {
							var layerObj = records[i];
							// Get parent node name
							var layerObjNode = layerObj.node;
							var parent = null; 
							var is_leaf = true;
							if(layerObjNode){
								var layerObjParentNode = layerObjNode.parentNode;
								if(layerObjParentNode){
									if(layerObjParentNode.tagName == "Layer"){
										var layerObjParentChildNodes = layerObjParentNode.childNodes;
										if(layerObjParentChildNodes){
											for (var j=0, countJ=layerObjParentChildNodes.length; j<countJ; j++) {
												var node = layerObjParentChildNodes[j];
												if(node.tagName == "Name"){
													parent = node.textContent;
													if(!parent){
														parent = node.text;
													}
												}
											}
										}
									}
								}
							}
							
							if(layerObjNode){
								var childNodes = layerObjNode.childNodes;
								if(childNodes){
									for (var j=0, countJ=childNodes.length; j<countJ; j++) {
										var childNode = childNodes[j];
										if(childNode.tagName == "Layer"){
											is_leaf = false;
											break;
										}
									}
								}
							}
							if(layerObj.data){
								layerRecord.push({ 
									index: layerObj.data.name,
									title: layerObj.data.title,
									featureInfo: (layerObj.data.featureInfo == "1") ? true : false,
									deactivated: (layerObj.data.name) ? false : true,
									checked: false,
									legend: false,
									id:layerObj.data.name,
									parent: parent,
									is_leaf: is_leaf
									});
							}
	            	  }
	            	  var myBorderPanel = new Ext.Panel({
							id: 'serviceDetailBorderPanel',
							itemId: 'serviceDetailBorderPanel',
						    height: 550,
						    layout: 'border',
						    items: [
						            new de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel({
						            	selectedService: serviceRecord,
						            	layerRecord: layerRecord,
								    	region:'center',
								    	mainPanel: self
									}),
									new de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel({
								    	selectedService: serviceRecord,
								    	region:'west',
										width: 400,
								    	mainPanel: self
									})]
						});
						
	            	self.remove(self.items.get('serviceDetailBorderPanel'));
	            	self.add(myBorderPanel);
					self.doLayout();
					self.selectedService = serviceRecord;
					self.selectedService.data.jsonLayers = layerRecord;
	               }
	           }
	    	});
		xmlStore.load();
	}else{
		if(serviceRecord.data){
			var service = { 
					title:serviceRecord.data.name, 
					capabilitiesUrl:serviceRecord.data.capabilitiesUrl, 
					originalCapUrl:serviceRecord.data.originalCapUrl 
					};
			// Add service
			self.setValue ('addServiceOrgCopy', service, 'Bitte warten! Dienst wird aktualisiert!', true, false);
		}
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.copyServiceToServer  = function (serviceRecord){
	var self = this;
	Ext.Msg.show({
	   title:'Dienst neu laden',
	   msg: 'Der Dienst muss lokal vorliegen! Soll dies nun durchgef&uuml;hrt werden?',
	   buttons: Ext.Msg.OKCANCEL,
	   icon: Ext.MessageBox.QUESTION,
	   fn: function(btn){
		   if (btn == 'ok'){
			   var tmpService = { 
					   title:serviceRecord.data.name, 
					   capabilitiesUrl:serviceRecord.data.capabilitiesUrl, 
					   originalCapUrl:serviceRecord.data.capabilitiesUrl 
					   };
			   // Refresh service
			   self.setValue ('refreshservice', tmpService, 'Bitte warten! Dienst wird auf dem Server gespeichert!', true);
		   }
	   	}
	});
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.setValue = function (key, service, loadMessage, doServiceDelete, doServiceNew){
	var self = this;
	Ext.getBody().mask(loadMessage, 'x-mask-loading');
	de.ingrid.mapclient.Configuration.setValue(key, Ext.encode(service), 
			{
			success: function() {
				de.ingrid.mapclient.Configuration.load({
					success: function() {
						self.reloadServiceFromConfig(service, doServiceNew);
						de.ingrid.mapclient.Message.showInfo(de.ingrid.mapclient.Message.SAVE_SUCCESS);
						self.pausecomp(2000);
						Ext.getBody().unmask();
					},
					failure: function() {
						de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
						Ext.getBody().unmask();
					}
				});
			},
			failure: function() {
				if(doServiceDelete){
					self.deleteService('Dienst kann nicht geladen werden, da dieser nicht mehr zur Verf&uuml;gung steht! Soll dieser Dienst entfernt werden?');
				}else{
					de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE);
				}
				Ext.getBody().unmask();
				} 
		   	}
		);
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.pausecomp = function (millis){
	var date = new Date();
	var curDate = null;
	
	do { curDate = new Date(); }
	while(curDate-date < millis);
};