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
Ext.namespace("de.ingrid.mapclient.admin.modules.services");

/**
 * @class ServiceCategoryPanel is used to manage WMS servers in hierarchical categories.
 */
Ext.define('de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel', {
	extend: 'de.ingrid.mapclient.admin.controls.CategoryPanel',
	dropBoxTitle: 'Rubrik l&ouml;schen',
	/**
	 * Display the wms capabilities for the given url
	 * @return url Url of a WMS server
	 */
	showCapabilities: function(url) {
		window.open(de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(url));
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.getCategoriesName
	 */
	getCategoriesName: function() {
		return de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.CATEGORIES_NAME;
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createPanel
	 */
	createPanel: function(path) {
		var panel = null;

		if (path.length == 3) {
			// for paths of length 3 we build a GridPanel instance for managing services
			var self = this;
			var columns = [{
				header: 'Name',
				sortable: true,
				dataIndex: 'name',
				editor: {
				   xtype: 'textfield',
				   disabled: true,
				   validator: function(v) {
					   var valid = true;
					   store.each(function(record) {
							if(v.trim() == record.get("name")){
								valid = false;
							}
						}, this);
					   if(!valid){
						   return "Rubrik existiert schon!";
					   }
	                   return true;
	               }
				},
				flex: 1
			}, {
				header: 'Capabilities Url',
				sortable: true,
				dataIndex: 'capabilitiesUrl',
				editor: {
				   xtype: 'textfield',
				   disabled: true
				},
				flex: 1
			}, {
				header: 'Info',
				sortable: false,
				id: 'capabilities',
			    width: 10,
			    renderer: function(v, p, record, rowIndex){
			        return '<div class="iconInfo"></div>';
			    },
				flex: 1
			}];

			panel = Ext.create('Ext.grid.Panel', {
				id:'categoryPanel-' + path,
				path: path,
				store: this.getStoreManager().getStore(path),
				columns: { 
					items:columns,
			        columnsText: 'Spalten',
		            sortAscText: 'A-Z sortieren',
		            sortDescText: 'Z-A sortieren'
		        },
				autoScroll:true,
				autoHeight: true,
				autoWidth:true,
				listeners:{
					afterrender: function(el){
						this.getView().refresh();
					}
				}
			});

		}
		else {
			// for other paths we build a CategoryPanel instance for managing sub categories
			panel = de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.superclass.createPanel.call(this, path);
		}

		return panel;
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createInstance
	 */
	createInstance: function(config) {
		return new de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel(config);
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.bindEventHandlers
	 */
	bindEventHandlers: function(panel) {
		if (panel instanceof Ext.grid.GridPanel) {
			var self = this;

			panel.on({
				resize: function(){
					var serviceModule = Ext.getCmp("services");
					if(serviceModule){
						var parentPanel = serviceModule.items;
						if(parentPanel){
							var parentPanelItem = parentPanel.items[0];
							if(parentPanelItem){
								var subPanel = parentPanelItem.items;
								if(subPanel){
									var subPanelItem = subPanel.items[0];
									if(subPanelItem){
										if(subPanelItem.gridPanel){
											subPanelItem.gridPanel.doLayout();
										}
									}
								}
							}
						}
					}
				},
				datachanged: function(e) {
					self.save();
				},
				cellclick: function(grid, body, columnIndex, record) {
					// show capabilities if clicking the capabilities icon
					if(columnIndex == 2){
			    		var url = record.get('capabilitiesUrl');
						self.showCapabilities(url);
			    	}
			    }
			});
			// prevent propagating events up to parent grid
			panel.getEl().swallowEvent(['click', 'mousedown', 'keydown', 'mouseover', 'contextmenu', 'dblclick'], true);
		}
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createStore
	 */
	createStore: function(path, category) {
		var store = null;

		if (path.length == 3) {
			// create the service store for path length 3
			// we do this by hand now, since categories dont maintain services anymore
			var services = [];
			var wmsServices = de.ingrid.mapclient.Configuration.getValue("wmsServices");
				for(var j = 0; j < wmsServices.length; j++){
					for(var k = 0;k < wmsServices[j].mapServiceCategories.length; k++)
					if(category.idx == wmsServices[j].mapServiceCategories[k].idx){
					var tempService = new Object();
					tempService.name = wmsServices[j].name;
					tempService.capabilitiesUrl = wmsServices[j].capabilitiesUrl;
					services.push(tempService);
					
					}
				}
					
			store = Ext.create('Ext.data.ArrayStore', {
				autoDestroy: false, // the component will be destroyed when categories are sorted, but the store should remain
				fields: [{
					name: 'name',
					type: 'string'
				}, {
					name: 'capabilitiesUrl',
					type: 'string'
				}],
				params: {
					type: "services"
				}
			});
			this.initializeStore(store, services);
		}
		else {
			// for other paths we create a categories store
			store = de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.superclass.createStore.call(this, path, category);
		}

		return store;
	}
});

de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.CATEGORIES_NAME = 'mapServiceCategories';