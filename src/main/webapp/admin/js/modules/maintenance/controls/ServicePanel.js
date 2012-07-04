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
        	xtype: 'textfield',
        	disabled: true
        }
	},{
    	header: 'Info',
		sortable: false,
		id: 'capabilities',
	    width: 10,
	    renderer: function(v, p, record, rowIndex){
	        return '<div class="iconInfo"></div>';
	    }, 
	    listeners: {
	        'click': function(store) {
	        	window.open(de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(url));
	        }   
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
	jsonColumn: ['name', 'capabilitiesUrl', 'mapServiceCategories', 'originalCapUrl', 'checkedLayers']
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.initComponent = function() {
	var self = this;
	this.serviceGrid = new  Ext.grid.EditorGridPanel({
		store: self.serviceStore,
		columns: self.columns,
		viewConfig: {
			forceFit: true
		},
		height: 360
	});
	
	self.serviceGrid.getSelectionModel().on('cellselect', function(selModel, node) {
		if(selModel.selection){
			self.selectedModel = selModel.selection; 
			var serviceRecord = selModel.selection.record;
			if(serviceRecord){
				if(selModel.selection.cell[1] == 2){
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
		self.updateService(store.value, self.selectedService.data.capabilitiesUrl, null, null);
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
		                self.deleteServiceBtn,
		                self.copyServiceBtn,
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
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.updateService = function (title, capabilitiesUrl, originalCapUrl, categories, layers) {
	var self = this;
	if(capabilitiesUrl){
		var service = {
				   title: (title) ? title : null,
				   capabilitiesUrl: capabilitiesUrl,
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
        defaults: {width: 230},
        defaultType: 'textfield',

        items: [{
        	 	xtype: 'textfield',
             	fieldLabel: 'Name',
                name: 'name',
                id: 'name',
                emptyText: 'Name des Dienstes'
            },{
                fieldLabel: 'URL',
                name: 'url',
                id: 'url',
                emptyText: 'URL des Dienstes'
            }
	],

        buttons: [{
            text: 'Speichern',
            handler: function(btn) {
            	var name = simple.items.get('name').el.dom.value;
            	var url = simple.items.get('url').el.dom.value;
            	
            	if(name != simple.items.get('name').emptyText && url != simple.items.get('url').emptyText){
            		var service = { title:name, originalCapUrl:url, categories:[], layers:[] };
            		// Add service
            		self.setValue ('addservice', service, 'Bitte warten! Dienst wird hinzugefügt!', true);
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
				   var service = { title: reloadService.data.name, capabilitiesUrl: reloadService.data.capabilitiesUrl, originalCapUrl: reloadService.data.originalCapUrl, layers: [] };
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
                emptyText: copyService.data.name
            }
        ],

        buttons: [{
            text: 'Kopieren',
            handler: function(btn) {
            	var name = simple.items.get('name').el.dom.value;
            	if(name != ''){
            		var originalCapUrl = '';
    				var capabilitiesUrl = '';
    				var categories = [];
    				var layers = [];
    				var checkedLayers = [];
    				
    				if(copyService.data.name){
    					title = copyService.data.name;
    				}
    				if(copyService.data.capabilitiesUrl){
    					capabilitiesUrl = copyService.data.capabilitiesUrl;
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
    					   originalCapUrl: (originalCapUrl) ? originalCapUrl : capabilitiesUrl,
    					   categories: categories,
    					   layers: layers
    				};
    				// Save copy to config
    				self.setValue ('copyservice', service, 'Bitte warten! Dienst wird kopiert!', true);
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

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.reloadServiceFromConfig = function(scrollToBottom){
	var self = this;
	var services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
	// Set services to store
	self.loadServices(self.serviceStore, services, self.jsonColumn);
	// Refresh service panel
	self.serviceGrid.getView().refresh();
	if(scrollToBottom){
		self.serviceGrid.getSelectionModel().select(self.serviceStore.totalLength - 1, 0);
	}else{
		self.serviceGrid.getSelectionModel().select(self.selectedModel.cell[0], 0);
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.loadServiceLayerFromFile  = function (serviceRecord){
	var self = this;
	
	self.copyServiceBtn.enable();
	self.reloadServiceBtn.enable();
	self.deleteServiceBtn.enable(),
	self.remove(self.items.get('serviceDetailBorderPanel'));
	
	var xmlStore = new Ext.data.Store({
        // load using HTTP
        url: serviceRecord.data.capabilitiesUrl,
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
						if(layerObj.data){
							layerRecord.push({ 
								index: layerObj.data.name,
								title: layerObj.data.title,
								featureInfo: (layerObj.data.featureInfo == "1") ? true : false,
								deactivated: (layerObj.data.name) ? false : true,
								checked: false,
								legend: false
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
					
					self.add(myBorderPanel);
					self.doLayout();
					self.selectedService = serviceRecord;
					self.selectedService.data.jsonLayers = layerRecord;
               }
           }
    	});
	xmlStore.load();
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
			   var tmpService = { title:serviceRecord.data.name, capabilitiesUrl:serviceRecord.data.capabilitiesUrl, originalCapUrl:serviceRecord.data.capabilitiesUrl };
			   // Refresh service
			   self.setValue ('refreshservice', tmpService, 'Bitte warten! Dienst wird auf dem Server gespeichert!', false, true);
		   }
	   	}
	});
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.setValue = function (key, service, loadMessage, scrollToBottom, doServiceDelete){
	var self = this;
	Ext.getBody().mask(loadMessage, 'x-mask-loading');
	de.ingrid.mapclient.Configuration.setValue(key, Ext.encode(service), 
			{
			success: function() {
				de.ingrid.mapclient.Configuration.load({
					success: function() {
						self.reloadServiceFromConfig(scrollToBottom);
						de.ingrid.mapclient.Message.showInfo(de.ingrid.mapclient.Message.SAVE_SUCCESS);
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