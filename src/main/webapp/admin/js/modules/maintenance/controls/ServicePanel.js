/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");

/**
 * @class ServicePanel is used to manage a list of map projections.
 */
Ext.define('de.ingrid.mapclient.admin.modules.maintenance.ServicePanel', {
	extend: 'Ext.panel.Panel',
	id: 'serviceGridPanel',
	itemId: 'serviceGridPanel',
    title: 'Dienste',
    layout: {
	    type: 'vbox',
	    pack: 'start',
	    align: 'stretch'
	},
	border: false,
	autoScroll: true,
	/**
	 * The ArrayStore for the services
	 */
	serviceStore: null,

	/**
	 * The column configuration
	 */
	columns: null,
	serviceGrid: null,
	services: null,
	selectedService: null,
	selectedModel:null,
	copyServiceBtn:null,
	deleteServiceBtn:null,
	reloadServiceBtn:null,
	addServiceBtn:null,
	comboFields: ['value', 'display'],
	comboData: [['an', 'an'], ['aus', 'aus'], ['mail', 'per Mail']],
    jsonColumn: ['name', 'capabilitiesUrl', 'capabilitiesUrlOrg', 'mapServiceCategories', 'originalCapUrl', 'checkedLayers', 'capabilitiesHash', 'capabilitiesHashUpdate', 'capabilitiesUpdateImage', 'capabilitiesUpdateFlag' ],
	isSave:false,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
		self.serviceStore = Ext.create('Ext.data.ArrayStore', {
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
				name: 'capabilitiesHash',
				type: 'string'
			}, {
				name: 'capabilitiesHashUpdate',
				type: 'string'
			}, {
				name: 'capabilitiesUpdateImage',
				type: 'string'
			}, {
				name: 'capabilitiesUpdateFlag',
				type: 'string'
			}, {
				name: 'jsonLayers',
				type: 'string'
			}],
			listeners: {
				update: function(store, record, operation) {
					if(record.modified["name"]){
						self.updateService(record.data.name, record.data.capabilitiesUrl, record.data.capabilitiesUrlOrg, record.data.originalCapUrl, null, null, record.data.capabilitiesUpdateFlag);			
					}else{
						record.reject(true);
					}
				}
			}
		});
		
		var combo = Ext.create('Ext.form.ComboBox', {
			id: 'servicePanelCombo',
			typeAhead: true,
		    triggerAction: 'all',
		    lazyRender:true,
		    mode: 'local',
		    store: Ext.create('Ext.data.ArrayStore', {
	            fields: self.comboFields,
	            data: self.comboData,
	            autoLoad: false
	        }),
	        valueField: 'value',
	        displayField: 'display',
	        listeners: { 
	    		select: function(combo, record) {
	    			var selectedRecords = self.serviceGrid.getSelectionModel().getSelection();
	    			if(selectedRecords.length > 0){
	    				var selectedRecord = selectedRecords[0];
	    				self.updateService(null, selectedRecord.data.capabilitiesUrl, selectedRecord.data.capabilitiesUrlOrg, selectedRecord.data.originalCapUrl, null, null, combo.value);
	    			}
	    		}
	    	}
		});
		
		this.columns = {
			items: [{
				header: 'Name',
				sortable: true,
				dataIndex: 'name', 
				editor:{
		        	xtype: 'textfield'
		        },
		        flex: 1
			}, {
				header: 'URL',
				sortable: true,
				dataIndex: 'capabilitiesUrl', 
				editor:{
		        	xtype: 'textfield'
		        },
		        flex: 1
			}, {
				header: 'Original URL',
				sortable: true,
				dataIndex: 'originalCapUrl', 
				editor:{
		        	xtype: 'textfield'
		        },
		        flex: 1
			},{
				header: 'Info',
		    	xtype: 'actioncolumn',
	            sortable: false,
				id: 'capabilities',
				align: 'center',
			    width: 30,
			    items: [{
					iconCls: 'iconInfo',
	                scope: this,
	                handler: function(grid, rowIndex){
	                	var row = grid.getStore().getAt(rowIndex);
	                	if(row.data){
	                		window.open(de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(row.data.capabilitiesUrl));
	                	}
	                },
	    		    getTip: function (val, meta, rec) {
	    				return 'Capabilities anzeigen';		
	    		    }
	            }]
			}, {
				header: 'Status',
				xtype: 'actioncolumn',
	            sortable: true,
				id: 'update',
				align: 'center',
				width: 50,
				dataIndex: 'capabilitiesUpdateImage',
			    items: [{
	                scope: this,
	                handler: function(grid, rowIndex){
	                	var row = grid.getStore().getAt(rowIndex);
	                	if(row.data){
	                		if(row.data.capabilitiesUpdateFlag == "mail"){
								if(row.data.capabilitiesHash != row.data.capabilitiesHashUpdate){
									self.reloadService(row, 'Soll der Dienst aktualisiert werden?');
								}
							}
	                	}
	                },
	                getClass: function (val, meta, rec) {
	    				if(val == "1_offline"){
	    					return 'iconUpdateOffline';		
	    				}else if(val == "2_update"){
	    					return 'iconUpdate';				
	    				}else if(val == "3_ok"){
	    					return 'iconUpdateNo';		
	    				}else if(val == "4_off"){
	    					return 'iconUpdateOff';		
	    				}
	    		    },
	    		    getTip: function (val, meta, rec) {
	    				if(val == "1_offline"){
	    					return 'GetCap offline';		
	    				}else if(val == "2_update"){
	    					return 'Update vorhanden: Hier klicken, um URL neu einzulesen!';				
	    				}else if(val == "3_ok"){
	    					return 'OK';		
	    				}else if(val == "4_off"){
	    					return 'URL-Check deaktiviert';		
	    				}
	    		    }
	            }]
			}, {
				header: 'autom. Update',
				sortable: true,
				dataIndex: 'capabilitiesUpdateFlag', 
				width: 100,
				editor: combo,
				renderer: Ext.util.Format.comboRenderer(combo)
			}],
	        columnsText: 'Spalten',
            sortAscText: 'A-Z sortieren',
            sortDescText: 'Z-A sortieren'
		};
		
		var filters = {
			ftype: 'filters',
			autoReload: false, //don't reload automatically
			local: true,  // defaults to false (remote filtering)
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
	    };
		
		self.serviceGrid = Ext.create('Ext.grid.Panel', {
			id:'serviceGrid',
			store: self.serviceStore,
			xtype: 'cell-editing',
		    columns: self.columns,
		    selModel: Ext.create('Ext.selection.RowModel', {mode: "SINGLE"}),
		    plugins:[
		        Ext.create('Ext.grid.plugin.CellEditing', {
		        	clicksToEdit: 2
		        })
	        ],
	        features: [filters],
	        autoScroll: true,
	        flex:1
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

		self.serviceGrid.getSelectionModel().on('selectionchange', function(rowModel, selections) {
			if(selections.length > 0){
				var selection = selections[0];
				if(selection){
					var serviceRecord = selection;
					if(serviceRecord){
						self.selectedService = serviceRecord; 
						var orginalCapUrl = serviceRecord.data.originalCapUrl;
						if(orginalCapUrl){
							self.loadServiceLayerFromFile(serviceRecord);
						}else{
							self.copyServiceToServer(serviceRecord);
					   }
					}
				}
			}
		});
		
		self.copyServiceBtn = Ext.create('Ext.Button', {
			id: 'serviceGridPanelBtnCopy',
			tooltip: 'Kopieren',
			text: 'Kopieren',
			disabled: true,
			handler: function(btn) {
				self.copyService();
			}
		});
		self.reloadServiceBtn = Ext.create('Ext.Button', {
			id: 'serviceGridPanelBtnReload',
			tooltip: 'Neu einlesen',
			text: 'Neu einlesen',
			disabled: true,
			handler: function(btn) {
				self.reloadService(self.selectedService, 'Sind Sie sicher, das der ausgew&auml;hlte Dienst zur&uuml;ckgesetzt werden soll?');
			}
		});
		self.deleteServiceBtn = Ext.create('Ext.Button', {
			id: 'serviceGridPanelBtnDelete',
			tooltip: 'L&ouml;schen',
			text: 'L&ouml;schen',
			disabled: true,
			handler: function(btn) {
				self.deleteService('Sind Sie sicher, das der ausgew&auml;hlte Dienst entfernt werden soll?');
			}
		});
		self.addServiceBtn = Ext.create('Ext.Button', {
			id: 'serviceGridPanelBtnAdd',
			tooltip: 'Hinzuf&uuml;gen',
			text: 'Hinzuf&uuml;gen',
			disabled: false,
			handler: function(btn) {
				self.addService();
			}
		});
		
		// create the final layout
		Ext.apply(this, {
			items: [
				       self.serviceGrid
				    ,
				  {
					id: 'serviceDetailBorderPanelExtend',
					border: false,
					height: 350,
					items:[]
				}],
			tbar: [ self.addServiceBtn,
                '-',
                self.deleteServiceBtn,
                '-',
                self.copyServiceBtn,
                '-',
                self.reloadServiceBtn
             ]
		});
		
		de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.superclass.onRender.apply(this, arguments);

		// initialize the service list
		this.services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
		de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.loadServices(this.serviceStore,
				this.services, this.jsonColumn);
	},
	loadServices: function(store, items, attributes, preventEvents) {
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
	},
	/**
	 * Update services changes to config
	 */
	updateService: function (title, capabilitiesUrl, capabilitiesUrlOrg, originalCapUrl, categories, layers, updateFlag) {
		var self = this;
		if(capabilitiesUrl){
			var service = {
			   title: (title) ? title : null,
			   capabilitiesUrl: capabilitiesUrl,
			   capabilitiesUrlOrg: capabilitiesUrlOrg,
			   originalCapUrl: originalCapUrl,
			   categories: (categories) ? categories : null,
			   layers: (layers) ? layers : null,
			   updateFlag: (updateFlag) ? updateFlag : false
			};
			// Update service
			self.setValue('updateservice', service, 'Bitte warten! &Auml;nderungen werden gespeichert!');
		}
	},
	/**
	 * Add services to config
	 */
	addService: function() {
		var self = this;
		var simple = Ext.create('Ext.form.Panel', {
			id:'servicePanelAddServiceFormPanel',
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
	                id: 'servicePanelAddServiceFormPanel_url',
	                emptyText: 'URL des Dienstes'
	            },{
	        	 	xtype: 'textfield',
	             	fieldLabel: '<i>Name<i>',
	                name: 'name',
	                id: 'servicePanelAddServiceFormPanel_name',
	                emptyText: 'Name des Dienstes (optional)'
	            },{
	            	xtype: 'combo',
	            	fieldLabel: '<i>Update<i>',
	                name: 'update',
	            	id: 'servicePanelAddServiceFormPanel_update',
	            	store: new Ext.data.SimpleStore({
	                    fields: self.comboFields,
	                    data: self.comboData,
	                    autoLoad: false
	                }),
	            	displayField: 'display',
	                valueField: 'value',
	                typeAhead: true,
	                forceSelection: true,
	                mode: 'local',
	                triggerAction: 'all',
	                selectOnFocus: true,
	                editable: false,
	                value: 'an'
	            }
		 ],

	        buttons: [{
	        	id: 'servicePanelAddServiceFormPanel_save',
                text: 'Speichern',
	            handler: function(btn) {
	            	var name = Ext.getCmp('servicePanelAddServiceFormPanel_name').value;
	            	var url = Ext.getCmp('servicePanelAddServiceFormPanel_url').value;
	            	var update =  Ext.getCmp('servicePanelAddServiceFormPanel_update').value;
	            	if(url != Ext.getCmp('servicePanelAddServiceFormPanel_url').emptyText 
	            			&& name != Ext.getCmp('servicePanelAddServiceFormPanel_name').emptyText){
	            		var service = { 
            				title:name, 
            				originalCapUrl:url, 
            				capabilitiesUrlOrg:"",
            				categories:[],
            				layers:[],
            				updateFlag: update,
            				protocol: location.protocol
	            		};
	            		// Add service
	            		self.setValue ('addservice', service, 'Bitte warten! Dienst wird hinzugef&uuml;gt!', false, true);
	                	win.close();
	            	}else if(url != Ext.getCmp('servicePanelAddServiceFormPanel_url').emptyText){
	            		var service = { 
            				title:null,
            				originalCapUrl:url,
            				capabilitiesUrlOrg:"",
            				categories:[],
            				layers:[],
            				updateFlag: update,
            				protocol: location.protocol
	            		};
	            		// Add service
	            		self.setValue ('addservice', service, 'Bitte warten! Dienst wird hinzugef&uuml;gt!', false, true);
	            		win.close();
	            	}
	    		}
	        },{
	        	id: 'servicePanelAddServiceFormPanel_cancel',
                text: 'Abbrechen',
	            handler: function(btn) {
	            	win.close();
	    		}
	        }]
	    });
		
		var win = Ext.create('Ext.window.Window', {
			layout: 'fit',
		    width: 500,
		    height: 300,
		    modal: true,
		    closeAction: 'close',
		    items: simple,
		    listeners:{
		    	close: function ( panel, eOpts ){
		    		simple.destroy();
		    	}
		    }
	    });
		win.show();
	},
	/**
	 * Reload services
	 */
	reloadService: function(row, text) {
		var self = this;
		var msg = Ext.Msg;
		msg.buttonText = {ok: "OK", cancel: "Abbrechen", yes: "Ja", no: "Nein"};
		msg.show({
		   title:'Dienst neu einlesen',
		   msg: text,
		   buttons: Ext.Msg.OKCANCEL,
		   icon: Ext.MessageBox.QUESTION,
		   fn: function(btn){
			   if (btn == 'ok'){
				   if(row.data){
					   var service = { 
						   title: row.data.name,
						   capabilitiesUrl: row.data.capabilitiesUrl,
						   capabilitiesUrlOrg: row.data.capabilitiesUrlOrg,
						   originalCapUrl: row.data.originalCapUrl, 
						   layers: [],
						   protocol: location.protocol
	           			};
					   // Reload service
					   self.setValue ('reloadservice', service, 'Bitte warten! Dienst wird neugeladen!');
				   }
			   }
		   	}
		});
	},
	/**
	 * Delete services from config
	 */
	deleteService: function(text) {
		var self = this;
		var deleteService = self.selectedService;
		var msg = Ext.Msg;
		msg.buttonText = {ok: "OK", cancel: "Abbrechen", yes: "Ja", no: "Nein"};
		msg.show({
		   title:'Dienst l&ouml;schen',
		   msg: text,
		   buttons: Ext.Msg.OKCANCEL,
		   icon: Ext.MessageBox.QUESTION,
		   fn: function(btn){
			   if (btn == 'ok'){
				   var service = { capabilitiesUrl: deleteService.data.capabilitiesUrl, capabilitiesUrlOrg: deleteService.data.capabilitiesUrlOrg};
				   // Remove service from config
				   de.ingrid.mapclient.Configuration.setValue('removeservice', Ext.encode(service), de.ingrid.mapclient.admin.DefaultSaveHandler);
				   // Remove service from store
				   self.serviceStore.remove(self.selectedService);
				   // Refresh service panel
				   self.serviceGrid.getView().refresh();
				   // Disable copy, reload, delete Button
				   self.copyServiceBtn.disable();
				   self.reloadServiceBtn.disable();
				   self.deleteServiceBtn.disable();
				   // Remove categories and layer panel
				   var serviceDetailBorderPanelExtend = self.items.get('serviceDetailBorderPanelExtend');
				   if(serviceDetailBorderPanelExtend){
					   serviceDetailBorderPanelExtend.remove(serviceDetailBorderPanelExtend.items.get('serviceDetailBorderPanel'));					   
				   }
			   }
		   	}
		});
	},
	/**
	 * Copy services from config
	 */
	copyService: function() {
		var self = this;
		var copyService = self.selectedService;

		var simple = Ext.create('Ext.form.Panel', {
			id: 'servicePanelCopyServiceFormPanel',
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
	                id: 'servicePanelCopyServiceFormPanel_name',
	                emptyText: copyService.data.name + " (Kopie)"
	            }
	        ],

	        buttons: [{
	            text: 'Kopieren',
	            handler: function(btn) {
	            	var name = Ext.getCmp('servicePanelCopyServiceFormPanel_name').value;
	            	if(name == undefined){
	            		name = Ext.getCmp('servicePanelCopyServiceFormPanel_name').emptyText;
	            	}
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
	    								if(layer.name == checkedLayers[j]){
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
	    					   layers: layers,
	    					   updateFlag: copyService.data.capabilitiesUpdateFlag,
	    					   protocol: location.protocol 
	    					   
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
		
		var win = Ext.create('Ext.window.Window', {
			layout: 'fit',
	        width: 500,
	        height: 300,
	        modal: true,
	        closeAction: 'close',
	        items: simple,
	        listeners:{
		    	close: function ( panel, eOpts ){
		    		simple.destroy();
		    	}
		    }
        });
		win.show();
	},
	reloadServiceFromConfig: function(service, doServiceNew){
		var self = this;
		var services = de.ingrid.mapclient.Configuration.getValue('wmsServices');
		// Set services to store
		self.loadServices(self.serviceStore, services, self.jsonColumn);
		// Refresh service panel
		self.serviceGrid.getView().refresh();
		var title = service.title;
		var originalCapUrl = service.originalCapUrl;
		var capabilitiesUrlService = service.capabilitiesUrl;
		
		
		if(doServiceNew){
			if(services){
				var lastSelection = self.serviceGrid.getStore().getAt(self.serviceGrid.getStore().getCount() - 1);
				if(lastSelection){
					self.serviceGrid.getSelectionModel().select(lastSelection);
				}
			}
		}else{
			if(self.selectedService){
				var store = self.serviceGrid.getStore();
				var lastSelection;
				if(store){
					for(var i=0; i<store.getCount(); i++){
						var data = store.getAt(i);
						if(self.selectedService.data.capabilitiesUrl == data.data.capabilitiesUrl){
							lastSelection = data;
							break;
						}
					}
				}
				if(lastSelection){
					self.serviceGrid.getSelectionModel().select(lastSelection);
				}
			}
		}
	},
	loadServiceLayerFromFile: function (serviceRecord){
		var self = this;
		
		self.copyServiceBtn.enable();
		self.reloadServiceBtn.enable();
		self.deleteServiceBtn.enable();
		
		if(serviceRecord.data.capabilitiesUrlOrg){
			Ext.define('Layer',{
		        extend: 'Ext.data.Model',
		        fields: [
	               // set up the fields mapping into the xml doc
	               // The first needs mapping, the others are very basic
	               {name: 'title', mapping: '/Title'},
	               {name: 'name', mapping: '/Name'},
	               {name: 'featureInfo', mapping: '/@queryable', type: 'int'},
	               {name: 'legend', mapping: '/Style/LegendURL/OnlineResource'}
	               
	           ]
		    });
			
			var xmlStore = Ext.create('Ext.data.Store', {
				model: 'Layer',
				proxy:{
					type: 'ajax',
					url: serviceRecord.data.capabilitiesUrlOrg,
					reader: {
						type: 'xml',
						record: 'Layer'
			        }
				},
	           listeners : {
	               load: function(store, records, succesful, operation){
	            	   var layerRecord = [];
	            	   for (var i=0, countI=records.length; i<countI; i++) {
							var layerObj = records[i];
							// Get parent node name
							var layerObjNode = layerObj.raw;
							var parent = null; 
							var leaf = true;
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
											leaf = false;
											break;
										}
									}
								}
							}
							if(layerObj.data){
								layerRecord.push({ 
									name: layerObj.data.name,
									title: layerObj.data.title,
									featureInfo: (layerObj.data.featureInfo == "1") ? true : false,
									deactivated: (layerObj.data.name) ? false : true,
									checked: false,
									legend: false,
									id:layerObj.data.name,
									parent: parent,
									leaf: leaf
								});
							}
	            	  }
	            	  var extend = Ext.getCmp('serviceDetailBorderPanelExtend');
	            	  var extendPanel = Ext.create('Ext.panel.Panel', {
							id: 'serviceDetailBorderPanel',
							itemId: 'serviceDetailBorderPanel',
						    border: false,
						    layout: {
							    type: 'hbox',
							    pack: 'start',
							    align: 'stretch'
							},
						    items: [
								Ext.create('de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel', {
									selectedService: serviceRecord,
									flex: 0.5,
									mainPanel: self,
									height: extend.height
								}),
					            Ext.create('de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel', {
					            	selectedService: serviceRecord,
					            	autoScroll: true,
									layerRecord: layerRecord,
							    	flex: 2,
							    	mainPanel: self,
							    	height: extend.height
								})
							]
						});
					
	            	extend.removeAll();
	            	extend.add(extendPanel);
					self.doLayout();
	            	extend.doLayout();
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
	},
	copyServiceToServer: function (serviceRecord){
		var self = this;
		var msg = Ext.Msg;
		msg.buttonText = {ok: "OK", cancel: "Abbrechen", yes: "Ja", no: "Nein"};
		msg.show({
		   title:'Dienst neu laden',
		   msg: 'Der Dienst muss lokal vorliegen! Soll dies nun durchgef&uuml;hrt werden?',
		   buttons: Ext.Msg.OKCANCEL,
		   icon: Ext.MessageBox.QUESTION,
		   fn: function(btn){
			   if (btn == 'ok'){
				   var tmpService = { 
					   title:serviceRecord.data.name, 
					   capabilitiesUrl:serviceRecord.data.capabilitiesUrl, 
					   originalCapUrl:serviceRecord.data.capabilitiesUrl,
					   protocol: location.protocol 
				   };
				   // Refresh service
				   self.setValue ('refreshservice', tmpService, 'Bitte warten! Dienst wird auf dem Server gespeichert!', true);
			   }
		   	}
		});
	},
	setValue: function (key, service, loadMessage, doServiceDelete, doServiceNew){
		var self = this;
		Ext.getBody().mask(loadMessage, 'x-mask-loading');
		de.ingrid.mapclient.Configuration.setValue(key, Ext.encode(service), {
			success: function() {
				de.ingrid.mapclient.Configuration.load({
					success: function() {
						self.reloadServiceFromConfig(service, doServiceNew);
						de.ingrid.mapclient.Message.showInfo('Die &Auml;nderungen wurden gespeichert.');
						self.pausecomp(2000);
						Ext.getBody().unmask();
					},
					failure: function() {
						de.ingrid.mapclient.Message.showError('Das Laden der Konfiguration ist fehlgeschlagen.');
						Ext.getBody().unmask();
					}
				});
			},
			failure: function(e) {
				if(doServiceDelete){
					self.deleteService('Dienst kann nicht geladen werden, da dieser nicht mehr zur Verf&uuml;gung steht! Soll dieser Dienst entfernt werden?');
				}else{
					if(e.indexOf("Conflict") > -1){
						de.ingrid.mapclient.Message.showError('Capabilities Dokument ist fehlerhaft.');
					}else{
						de.ingrid.mapclient.Message.showError('Das Laden des Capabilities Dokuments ist fehlgeschlagen.');
					}
					
				}
				Ext.getBody().unmask();
				} 
		   	}
		);
	},
	pausecomp: function (millis){
		var date = new Date();
		var curDate = null;
		
		do { curDate = new Date(); }
		while(curDate-date < millis);
	}
});

Ext.util.Format.comboRenderer = function(combo){
    return function(value){
        var record = combo.findRecord(combo.valueField, value);
        return record ? record.get(combo.displayField) : combo.valueNotFoundText;
    }
}
