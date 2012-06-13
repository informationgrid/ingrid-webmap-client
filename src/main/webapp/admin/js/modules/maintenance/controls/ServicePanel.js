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
        	xtype: 'label'
        }
	}],
	serviceGrid: null,
	services: null,
	selectedService: null,
	copyServiceBtn:null,
	deleteServiceBtn:null,
	reloadServiceBtn:null,
	addServiceBtn:null,
	jsonColumn: ['name', 'capabilitiesUrl', 'mapServiceCategories', 'originalCapUrl']
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
	
	this.serviceGrid.getSelectionModel().on('selectionchange', function(selModel, node) {
		if(selModel.selection){
			var serviceRecord = selModel.selection.record; 
			if(self.selectedService != serviceRecord){
				if(serviceRecord){
					self.copyServiceBtn.enable();
					self.reloadServiceBtn.enable();
					self.deleteServiceBtn.enable(),
					self.remove(self.items.get('serviceDetailBorderPanel'));
					
					var myBorderPanel = new Ext.Panel({
						id: 'serviceDetailBorderPanel',
						itemId: 'serviceDetailBorderPanel',
					    height: 550,
					    layout: 'border',
					    items: [
					       new de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel({
						    	//capabilities: de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(serviceRecord.data.capabilitiesUrl),
					    	   	capabilities: serviceRecord.data.capabilitiesUrl,
								region:'center'
								}),
						    new de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel({
						    	selectedCategory: serviceRecord,
						    	serviceStore: self.serviceStore,
								region:'west',
								width: 400
								})]
					});
					
					self.add(myBorderPanel);
					self.doLayout();
					self.selectedService = serviceRecord;
				}
			}
		}
	});
	
	this.serviceGrid.on('afteredit', function(store) {
		de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.updateService(store, self.selectedService);
	});
	
	self.copyServiceBtn = new Ext.Button({
		tooltip: 'Kopieren',
		text: 'Kopieren',
		disabled: true,
		handler: function(btn) {
			de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.copyService(self);
		}
	});
	self.reloadServiceBtn = new Ext.Button({
		tooltip: 'Neu einlesen',
		text: 'Neu einlesen',
		disabled: true,
		handler: function(btn) {
			de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.reloadService(self);
		}
	});
	self.deleteServiceBtn = new Ext.Button({
		tooltip: 'L&ouml;schen',
		text: 'L&ouml;schen',
		disabled: true,
		handler: function(btn) {
			de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.deleteService(self);
		}
	});
	self.addServiceBtn = new Ext.Button({
		tooltip: 'Hinzuf&uuml;gen',
		text: 'Hinzuf&uuml;gen',
		disabled: false,
		handler: function(btn) {
			de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.addService(self);
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
	if (preventEvents == undefined) {
		preventEvents = true;
	}
	// convert item objects into record arrays
	var records = [];
	for (var i=0, countI=items.length; i<countI; i++) {
		var item = items[i];
		var record = [];
		for (var j=0, countJ=attributes.length; j<countJ; j++) {
			var attribute = attributes[j];
			if(attribute != 'mapServiceCategories'){
				record.push(item[attribute]);
			}else{
				var mapServiceCategories = item[attribute];
				var categories = ''
				var categoryIds = new Array();
				for (var k=0, countK=mapServiceCategories.length; k<countK; k++) {
					var mapServiceCategory = mapServiceCategories[k]
					categories = categories + "" + mapServiceCategory.name;
					categoryIds.push(mapServiceCategory.id);
					if(k+1 != countK){
						categories = categories + ", ";
					}
				}
				record.push(categories);
				record.push(categoryIds);
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
 * Save the services list on the server
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.updateService = function(updateService, selectedService) {
	if(selectedService){
		if(selectedService.data){
			var capabilitiesUrl = selectedService.data.capabilitiesUrl;
			if(capabilitiesUrl){
				var service = {
						   title: updateService.value,
						   capabilitiesUrl: capabilitiesUrl,
						   originalCapUrl: null,
						   categories: null,
						   layers: null,
						   checkedLayers: null
				   };
				de.ingrid.mapclient.Configuration.setValue('updateservice', Ext.encode(service), de.ingrid.mapclient.admin.DefaultSaveHandler);
			}
		}
	}
};


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
            },{
                fieldLabel: 'URL',
                name: 'url',
                id: 'url',
                allowBlank:false
            }
        ],

        buttons: [{
            text: 'Speichern',
            handler: function(btn) {
            	var name = simple.items.get('name').el.dom.value;
            	var url = simple.items.get('url').el.dom.value;
            	
            	if(name != '' && url != ''){
            		var service = { title:name, originalCapUrl:url, categories:[], layers:[] };
            		de.ingrid.mapclient.Configuration.setValue('addservice', Ext.encode(service), 
            			{
						success: function() {
							de.ingrid.mapclient.Configuration.load({
								success: function() {
									var services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
									de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.loadServices(self.serviceStore,
											services, self.jsonColumn);
									self.serviceGrid.getView().refresh();
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
	
	var win = new Ext.Window(
		    {
		        layout: 'fit',
		        width: 500,
		        height: 300,
		        modal: true,
		        closeAction: 'hide',
		        items: simple 
		     });
	win.show();
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.reloadService = function(reloadService, self) {
	var reloadService = self.selectedService;
	// TODO: Reload Service
};

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
				   de.ingrid.mapclient.Configuration.setValue('removeservice', Ext.encode(service), de.ingrid.mapclient.admin.DefaultSaveHandler);
				   self.serviceStore.data.removeKey(self.selectedService.id);
				   self.serviceGrid.getView().refresh();
				   self.remove(self.items.get('serviceDetailBorderPanel'));
			   }
		   	}
		});
};

de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.copyService = function(self) {
	var copyService = self.selectedService;
	Ext.Msg.show({
		   title:'Dienst kopieren',
		   msg: 'Soll dieser Dienst kopiert werden?',
		   buttons: Ext.Msg.OKCANCEL,
		   icon: Ext.MessageBox.QUESTION,
		   fn: function(btn){
			   if (btn == 'ok'){
				   	var title = '';
					var originalCapUrl = '';
					var capabilitiesUrl = '';
					var categories = [];
					var layers = [];
					var checkedLayers = [];
					
					if(copyService.json[0]){
						title = copyService.json[0];
					}
					if(copyService.json[1]){
						capabilitiesUrl = copyService.json[1];
					}
				
					if(copyService.json[3]){
						categories = copyService.json[3];
					}
					
					if(copyService.json[4]){
						originalCapUrl = copyService.json[4];
					}
					
					if(copyService.json[5]){
						layers = copyService.json[5];
					}
					
					if(copyService.json[6]){
						checkedLayers = copyService.json[6];
					}
					
					var service = {
						   title: title + " (Kopie)",
						   capabilitiesUrl: capabilitiesUrl,
						   originalCapUrl: (originalCapUrl) ? originalCapUrl : capabilitiesUrl,
						   categories: categories,
						   layers: layers,
						   checkedLayers: checkedLayers
				   };
				   de.ingrid.mapclient.Configuration.setValue('copyservice', Ext.encode(service),
						   	{
							success: function() {
								de.ingrid.mapclient.Configuration.load({
									success: function() {
										var services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
										de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.loadServices(self.serviceStore,
												services, self.jsonColumn);
										self.serviceGrid.getView().refresh();
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
			   }
		   	}
		});
};

