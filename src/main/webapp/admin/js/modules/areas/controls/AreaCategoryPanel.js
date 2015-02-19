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
Ext.namespace("de.ingrid.mapclient.admin.modules.areas");

/**
 * @class AreaCategoryPanel is used to manage map areas in hierarchical categories.
 */
Ext.define('de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel', { 
	extend: 'de.ingrid.mapclient.admin.controls.CategoryPanel',
	dropBoxTitle: 'Vordefinierte Bereiche l&ouml;schen',
	/**
	 * @see de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.getCategoriesName
	 */
	getCategoriesName: function() {
		return de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.CATEGORIES_NAME;
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createPanel
	 */
	createPanel: function(path) {
		var panel = null;
		var self = this;
		if (path.length == 2) {
			// for paths of length 2 we build a AreaPanel instance for managing areas
			panel = Ext.create('de.ingrid.mapclient.admin.modules.areas.AreaPanel', {
				store: this.getStoreManager().getStore(path),
				columns: [{
					header: 'Name',
					sortable: true,
					dataIndex: 'name',
					editor: {
					   xtype: 'textfield',
					   allowBlank: false,
					   validator: function(v) {
						   var valid = true;
						   panel.store.each(function(record) {
								if(v.trim() == record.get("name")){
									valid = false;
								}
							}, this);
						   if(!valid){
							   return "Rubrik existiert schon!";
						   }
			               return true;
			           }
					}
				}, {
					header: 'Norden',
					sortable: true,
					dataIndex: 'north',
					editor: {
					   xtype: 'coordinatefield',
					   allowBlank: false,
					   hideLabel: true
					}
				}, {
					header: 'Westen',
					sortable: true,
					dataIndex: 'west',
					editor: {
					   xtype: 'coordinatefield',
					   allowBlank: false,
					   hideLabel: true
					}
				}, {
					header: 'Osten',
					sortable: true,
					dataIndex: 'east',
					editor: {
					   xtype: 'coordinatefield',
					   allowBlank: false,
					   hideLabel: true
					}
				}, {
					header: 'S&uuml;den',
					sortable: true,
					dataIndex: 'south',
					editor: {
					   xtype: 'coordinatefield',
					   allowBlank: false,
					   hideLabel: true
					}
				}],
				listeners:{
					afterrender: function(p, eOpts){
						this.el.swallowEvent([ 'mouseover', 'mouseout', 'mousedown', 'click', 'dblclick', 'cellclick' ]);
					},
					resize: function(){
						self.resizeMainLayout();
					}
				}
			});
		}
		else {
			// for other paths we build a CategoryPanel instance for managing sub categories
			panel = de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.superclass.createPanel.call(this, path);
		}

		return panel;
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createInstance
	 */
	createInstance: function(config) {
		return new de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel(config);
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.bindEventHandlers
	 */
	bindEventHandlers: function(panel) {
		if (panel instanceof de.ingrid.mapclient.admin.controls.GridPanel) {
			var self = this;

			panel.on('datachanged', function(e) {
				self.save();
			});
			// prevent propagating events up to parent grid
			panel.gridPanel.getEl().swallowEvent(['click', 'mousedown', 'keydown', 'mouseover', 'contextmenu', 'dblclick'], true);
		}
	},
	/**
	 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createStore
	 */
	createStore: function(path, category) {
		var store = null;

		if (path.length == 2) {
			// create the area store for path length 2
			store = Ext.create('Ext.data.ArrayStore', {
				autoDestroy: false, // the component will be destroyed when categories are sorted, but the store should remain
				fields: [{
					name: 'name',
					type: 'string'
				}, {
					name: 'north',
					type: 'float'
				}, {
					name: 'west',
					type: 'float'
				}, {
					name: 'east',
					type: 'float'
				}, {
					name: 'south',
					type: 'float'
				}],
				params: {
					type: "areas"
				}
			});
			this.initializeStore(store, category.areas);
		}
		else {
			// for other paths we create a categories store
			store = de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.superclass.createStore.call(this, path, category);
		}

		return store;
	},
	resizeMainLayout: function(){
		var areasModule = Ext.getCmp("areas");
		if(areasModule){
			var parentPanel = areasModule.items;
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
	}
});

de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.CATEGORIES_NAME = 'areaCategories';