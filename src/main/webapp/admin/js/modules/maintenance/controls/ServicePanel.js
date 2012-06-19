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
    height: 400,
	split: true,
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
	}],
	serviceGrid: null,
	services: null,
	selectedService: null,
	copyServiceBtn:null,
	deleteServiceBtn:null,
	reloadServiceBtn:null,
	addServiceBtn:null,
	jsonColumn: ['name', 'capabilitiesUrl', 'mapServiceCategories', 'originalCapUrl', 'checkedLayers'],
	rowModel:null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.initComponent = function() {
	var self = this;
	this.serviceGrid = new  Ext.grid.EditorGridPanel({
		store: this.serviceStore,
		columns: this.columns,
		viewConfig: {
			forceFit: true
		},
		height: 400
	});
	
	this.serviceGrid.getSelectionModel().on('cellselect', function(selModel, node) {
		this.rowModel = selModel;
		if(selModel.selection){
			var serviceRecord = selModel.selection.record; 
			if(self.selectedService != serviceRecord){
				var orginalCapUrl = serviceRecord.json[self.getJsonIndex('originalCapUrl')];
				
				if(serviceRecord){
					self.copyServiceBtn.enable();
					self.reloadServiceBtn.enable();
					self.deleteServiceBtn.enable(),
					self.remove(self.items.get('serviceDetailBorderPanel'));
					
					var xmlStore = new Ext.data.Store({
				        // load using HTTP
				        url: serviceRecord.data.capabilitiesUrl,
						// the return will be XML, so lets set up a reader
				        reader: new Ext.data.XmlReader({
				               // records will have an "Item" tag
				               record: 'Layer > Layer',
				               id: 'Title',
				               totalRecords: '@total'
				           }, [
				               // set up the fields mapping into the xml doc
				               // The first needs mapping, the others are very basic
				               {name: 'title', mapping: 'Title'},
				               {name: 'name', mapping: 'Name'},
				               {name: 'featureInfo', mapping: '@queryable', type: 'int'},
				               {name: 'legend', mapping: '@queryable', type: 'int'}
				               
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
												deactivated: false,
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
													width: 400
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
				}
			}
		}
	});
	
	this.serviceGrid.on('afteredit', function(store) {
		self.updateService(store.value, self.selectedService.data.capabilitiesUrl, null, null);
	});
	
	self.copyServiceBtn = new Ext.Button({
		tooltip: 'Kopieren',
		text: 'Kopieren',
		disabled: true,
		handler: function(btn) {
			self.copyService(self);
		}
	});
	self.reloadServiceBtn = new Ext.Button({
		tooltip: 'Neu einlesen',
		text: 'Neu einlesen',
		disabled: true,
		handler: function(btn) {
			self.reloadService(self);
		}
	});
	self.deleteServiceBtn = new Ext.Button({
		tooltip: 'L&ouml;schen',
		text: 'L&ouml;schen',
		disabled: true,
		handler: function(btn) {
			self.deleteService(self);
		}
	});
	self.addServiceBtn = new Ext.Button({
		tooltip: 'Hinzuf&uuml;gen',
		text: 'Hinzuf&uuml;gen',
		disabled: false,
		handler: function(btn) {
			self.addService(self);
		}
	});
	
	// create the final layout
	Ext.apply(this, {
		items: this.serviceGrid,
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
			if(attribute != 'mapServiceCategories'){
				//if(attribute != 'checkedLayers'){
					record.push(item[attribute]);	
				/*}else{
					var xmlUrl = item['capabilitiesUrl'];
					if(xmlUrl){
						var xmlLayers = item['checkedLayers'];
						if(xmlLayers == undefined || xmlLayers.length == 0){
							var xmlStore = new Ext.data.Store({
						        // load using HTTP
						        url: xmlUrl,
								// the return will be XML, so lets set up a reader
						        reader: new Ext.data.XmlReader({
						               // records will have an "Item" tag
						               record: 'Layer > Layer',
						               id: 'Title',
						               totalRecords: '@total'
						           }, [
						               // set up the fields mapping into the xml doc
						               // The first needs mapping, the others are very basic
						               {name: 'title', mapping: 'Title'},
						               {name: 'name', mapping: 'Name'},
						               {name: 'display', mapping: '@queryable', type: 'int'},
						               {name: 'select', mapping: '@queryable', type: 'int'},
						               {name: 'featureInfo', mapping: '@queryable', type: 'int'},
						               {name: 'legend', mapping: '@queryable', type: 'int'}
						               
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
														deactivated: false,
														checked: true,
														legend: true
														});
												}
						            	  }
						            	  if(layerRecord){
						            		  record.push(layerRecord);
						            		  self.updateService(item['name'], item['capabilitiesUrl'], item['originalCapUrl'], null, layerRecord);
						            	  }
						               }
						           }
						    	});
							xmlStore.load();
							}
						}else{
							record.push(item[attribute]);
						}
				}*/
			}else{
				var mapServiceCategories = item[attribute];
				var categories = new Array();
				for (var k=0, countK=mapServiceCategories.length; k<countK; k++) {
					var mapServiceCategory = mapServiceCategories[k]
					categories.push(mapServiceCategory.id);
				}
				record.push(categories);
			}
			
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
	if(capabilitiesUrl){
		var service = {
				   title: (title) ? title : null,
				   capabilitiesUrl: capabilitiesUrl,
				   originalCapUrl: originalCapUrl,
				   categories: (categories) ? categories : null,
				   layers: (layers) ? layers : null
		   };
		// Update service
		de.ingrid.mapclient.Configuration.setValue('updateservice', Ext.encode(service), de.ingrid.mapclient.admin.DefaultSaveHandler);
	}
};

/**
 * Add services to config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.addService = function(self) {
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
            		de.ingrid.mapclient.Configuration.setValue('addservice', Ext.encode(service), 
            			{
						success: function() {
							de.ingrid.mapclient.Configuration.load({
								success: function() {
									self.reloadServiceFromConfig(true);
								},
								failure: function() {
									de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
								}
							});
						},
						failure: function() {
							de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
							} 
					   	}
            		);
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
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.reloadService = function(self) {
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
				   de.ingrid.mapclient.Configuration.setValue('reloadservice', Ext.encode(service), {
						success: function() {
							de.ingrid.mapclient.Configuration.load({
								success: function() {
									// Save load services
									self.reloadServiceFromConfig(false);
								},
								failure: function() {
									de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
								}
							});
						},
						failure: function() {
							de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
							} 
					   	});
			   }
		   }
	   	}
	});
};

/**
 * Delete services from config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.deleteService = function(self) {
	var deleteService = self.selectedService;
	Ext.Msg.show({
	   title:'Dienst l&ouml;schen',
	   msg: 'Sind Sie sicher, das der ausgew&auml;hlte Dienst entfernt werden soll?',
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
			   de.ingrid.mapclient.Message.showInfo(de.ingrid.mapclient.Message.SAVE_SUCCESS);
		   }
	   	}
	});
};


/**
 * Copy services from config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.copyService = function(self) {
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
    					categories = copyService.data.mapServiceCategories;
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
    				de.ingrid.mapclient.Configuration.setValue('copyservice', Ext.encode(service),
    					   	{
    						success: function() {
    							de.ingrid.mapclient.Configuration.load({
    								success: function() {
    									// Save load services
    									self.reloadServiceFromConfig(true);
    								},
    								failure: function() {
    									de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
    								}
    							});
    						},
    						failure: function() {
    							de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
    							} 
    					   	}
    		   		);
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
	var services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
	// Set services to store
	this.loadServices(this.serviceStore, services, this.jsonColumn);
	// Refresh service panel
	this.serviceGrid.getView().refresh();
	if(scrollToBottom){
		this.serviceGrid.getView().focusRow(this.serviceStore.totalLength - 1);
	}
	de.ingrid.mapclient.Message.showInfo(de.ingrid.mapclient.Message.SAVE_SUCCESS);
};