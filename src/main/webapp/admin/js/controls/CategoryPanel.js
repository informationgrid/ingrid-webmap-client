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
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class CategoryPanel is a grid control that allows to manage (modify/sort/insert/delete)
 * nested categories. The class is abstract and subclasses will extend it in order to manage
 * special content inside the categories.
 * @note Since panels will be destroyed/recreated when closed/opened, the appropriate
 * store instances must be kept in the registry.
 */
Ext.define('de.ingrid.mapclient.admin.controls.CategoryPanel', { 
	extend:'Ext.panel.Panel',
	layout: 'form',
	border: false,

	/**
	 * The grid panel
	 */
	grid: null,

	/**
	 * Registry for (sub-)category panels
	 */
	panels: new Ext.util.MixedCollection(),

	/**
	 * Array of category names defining the path to this category panel (defaults to root panel configuration)
	 */
	path: ["root"],
	
	/**
	 *  Drop box title
	 */
	dropBoxTitle: null,
	/**
	 * Render callback (called by Ext)
	 */
	drop: false,
	onRender: function(container, position) {

		// we build the ui in onRender, because this is the first time the configuration is available.
		// the configuration is needed, because the categories are defined there.
		this.add(this.buildContent());

		de.ingrid.mapclient.admin.controls.CategoryPanel.superclass.onRender.apply(this, arguments);
	},
	/**
	 * Build the panel content
	 * @return Object used as items property of the panel
	 */
	buildContent: function() {
		var self = this;

		// initialize the store manager if not done yet
		if (!de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.exists(this.getCategoriesName())) {
			this.buildStores();
		}

		// get the store
		var store = this.store;
		if (store == undefined) {
			store = this.getStoreManager().getStore(this.path);
		}

		// create the contained GridPanel instance
		var columns = [{
			header: 'Unterrubrik',
			sortable: true,
			dataIndex: 'name',
			editor: {
			   xtype: 'textfield',
			   allowBlank: false,
			   columnWidth: 0.95
			},
			flex: 1
		}];

		this.gridConfigCb = function(config) {
			// add the expander column
			//config.columns.unshift(self.expander);
			config.plugins = [
			    {
					ptype:'rowexpander',
			    	rowBodyTpl: '<div class="ux-row-expander-box"></div>',
			    	expandOnEnter: true,
			        expandOnDblClick: false
				},
				Ext.create('Ext.grid.plugin.CellEditing', {
		            clicksToEdit: 1
		        }
			)];
			config.hideHeaders = true;
			config.listeners = {
					afterrender: function(el, ev){
						el.getView().refresh();
					}
			}
			return config;
		};
		
		// create the grid
		this.grid = Ext.create('de.ingrid.mapclient.admin.controls.GridPanel', {
			store: store,
			columns: columns,
			gridConfigCb: self.gridConfigCb,
			dropBoxTitle: self.dropBoxTitle
		});
		
		this.grid.gridPanel.getView().on({
			resize: function(node, record, eNode) {
				if(self.panel){
					self.panel.fireEvent("resize");
				}
			},
			expandbody: function(node, record, eNode) {
				var element = Ext.get(eNode).down('.ux-row-expander-box');
				self.panel = self.getSubPanel(record, element);
			},
			beforedrop: function(node, data, overModel, dropPosition, dropHandlers) {
				self.drop = true;
				var panelItems = self.panels.items;
				if(self.path.length == 1){
					for (var i = 0; i < panelItems.length; i++) {
						var panelItem = panelItems[i];
						if(panelItem.path){
							if(panelItem.path.toString().indexOf(self.path.toString() + "," + data.records[0].get("name")) > -1){
								self.panels.remove(panelItem);
								i = i - 1;
							}
						}
					}
					if(self.panels.get(data.records[0].id)){
						self.panels.removeAtKey(data.records[0].id);
					}
				}else{
					self.panels.removeAtKey(data.records[0].id);
				}
		    },
		    drop: function(node, data, overModel, dropPosition) {
		    	self.drop = false;
		    	store.fireEvent('datachanged');
		    }
		});
		
		// listen to category stores in order to update the store registry on any change
		// and store the changes
		store.on({
			'add': function(store, records, index) {
				if(self.drop == false){
					// create a new store for the category and save
					var path = self.path.copy();
					var name = records[0].get("name");
					path.push(name);
					var initialCategory = self.createCategory(name);
					self.buildStore(path, initialCategory);
					if(initialCategory.mapServiceCategories != undefined){
						self.saveAndReload(store, records);				
					}else{
						self.save();
					}
				}
			},
			'update': function(store, record, operation) {
				// relocate the store of the category and save
				if (record.dirty) {
					var oldPath = self.path.copy();
					oldPath.push(record.modified.name);
					var newPath = self.path.copy();
					newPath.push(record.get('name'));
					self.getStoreManager().relocateStore(oldPath, newPath);
					this.panels.removeAtKey(record.id);

					// Update path
					var panel = Ext.getCmp('categoryPanel-'+oldPath);
					if(panel){
						panel.path[1] = record.get('name');
						
						var panels = this.panels.items.copy();
						for(var i=0; i<panels.length; i++){
							var panelTmp = panels[i];
							if(panelTmp.path){
								if(panelTmp.path[1] == record.modified.name){
									this.panels.remove(panelTmp);
								}
							}
						}
					}
					
					self.save();
					record.commit();
				}
			},
			'remove': function(store, record, index) {
				if(self.drop == false){// delete the store of the category and save
					var path = self.path.copy();
					var name = record.get("name");
					path.push(name);
					self.getStoreManager().removeStore(path);
					self.save();
				}
			},
			'datachanged': function(store) {
				if(self.drop == false){
					self.save();
				}
			},
			scope: self
		});

		return this.grid;
	},
	/**
	 * Get a child panel for this panel.
	 * @param record The Ext.data.Record to which the panel belongs
	 * @param element The element to render the panel to
	 * @return Ex.Panel subclass
	 */
	getSubPanel: function(record, element) {

		// define a unique key for the panel
		var key = record.id;

		// create the panel if it doesn't exist yet
		var panel = null;
		if (!this.panels.containsKey(key)) {
			var path = this.path.copy();
			path.push(record.get('name'));
			panel = this.createPanel(path);
			// initial rendering
			panel.render(element);
			this.panels.add(key, panel);
			this.bindEventHandlers(panel);
		}
		/*
		// get the panel from the registry
		panel = this.panels.get(key);

		// check if the rows were reordered and re-render if necessary
		var parentElementId = panel.getEl().parent().id;
		if (parentElementId != element.id) {
			panel = this.relocatePanel(panel, element);
			this.panels.add(key, panel);
		}
		*/
		panel = this.panels.get(key);
		return panel;
	},
	/**
	 * Get the store of the panel
	 * @return Ext.data.Store
	 */
	getStore: function() {
		return this.grid.getStore();
	},
	/**
	 * Get the name of the categories managed by this class. This name must be equal to the configuration property
	 * which contains the managed categories.
	 * @note Subclasses must implement this method.
	 * @return String
	 */
	getCategoriesName: function() {
		throw "getCategoriesName method must be implemented by de.ingrid.mapclient.admin.controls.CategoryPanel subclasses";
	},
	/**
	 * Save the category data
	 */
	save: function() {
		var result = {};
		var self = this;
		var categoriesName = this.getCategoriesName();
		this.getStoreManager().iterate(function(path, store, context) {
			// find the next parent for the current item
			var parent = context;
			var categories = parent[categoriesName];
			if (categories != undefined) {
				for (var j=0, countJ=categories.length; j<countJ; j++) {
					if (categories[j].name == path[path.length-1]) {
						parent = categories[j];
						break;
					}
				}
			}
			// create items of store record type from the store content
			var items = [];
			store.each(function(record) {
				var item = record.raw;
				if(record.get("name")){
					item.name = record.get("name");
				}
				items.push(item);
			}, this);
			// create item
			parent.name = path[path.length-1];
			parent[store.params.type] = items;
			return parent;
		},
		// initial context
		result);
		de.ingrid.mapclient.Configuration.setValue(categoriesName, Ext.encode(result), {success: self.success, failure: self.failure});
	},
	/**
	 * Save the category data
	 */
	saveAndReload: function(storeFromAdd, records) {
		var result = {};
		var self = this;
		var categoriesName = this.getCategoriesName();
		this.getStoreManager().iterate(function(path, store, context) {
			// find the next parent for the current item
			var parent = context;
			var categories = parent[categoriesName];
			if (categories != undefined) {
				for (var j=0, countJ=categories.length; j<countJ; j++) {
					if (categories[j].name == path[path.length-1]) {
						parent = categories[j];
						break;
					}
				}
			}
			// create items of store record type from the store content
			var items = [];
			store.each(function(record) {
				var item = record.raw;
				if(record.get("name")){
					item.name = record.get("name");
				}
				items.push(item);
			}, this);
			// create item
			parent.name = path[path.length-1];
			parent[store.params.type] = items;
			return parent;
		},
		// initial context
		result);
		var highest = 0;
		var catReference = null;
		if(result.mapServiceCategories){
			for (var i = 0; i < result.mapServiceCategories.length; i++){
				if(result.mapServiceCategories[i].idx || result.mapServiceCategories[i].idx == 0){
					if(result.mapServiceCategories[i].idx > highest)
						highest = result.mapServiceCategories[i].idx; 
				}else{
					catReference = result.mapServiceCategories[i]
				}
				if(result.mapServiceCategories[i].mapServiceCategories){
					for (var j = 0; j < result.mapServiceCategories[i].mapServiceCategories.length; j++){
						if(result.mapServiceCategories[i].mapServiceCategories[j].idx){
							if(result.mapServiceCategories[i].mapServiceCategories[j].idx > highest)
								highest = result.mapServiceCategories[i].mapServiceCategories[j].idx; 
						}else{
							catReference = result.mapServiceCategories[i].mapServiceCategories[j];						
						}
					}
				}
			}
			if(catReference){
				catReference.idx = highest + 1;
			}
		}
		de.ingrid.mapclient.Configuration.setValue(categoriesName, Ext.encode(result), de.ingrid.mapclient.admin.DefaultSaveHandler);

	},
	/**
	 * Relocate the panel to another parent element. This is necessary after reordering
	 * @param panel
	 * @param element
	 * @returns Ext.Panel subclass
	 */
	relocatePanel: function(panel, element) {
		var newPanel = panel.cloneConfig();
		// render the new panel and destroy the old
		newPanel.render(element);
		// copy store items
		var store = this.getStoreManager().getStore(panel.path);
		if (store != undefined) {
			try {
				newPanel.getStore().add(store.getRange());
			}
			catch (e) {
				// exception thrown while rendering is ignored here
			}
		}
		panel.destroy();
		return newPanel;
	},
	/**
	 * Create a panel for the given path. The default implementation creates
	 * an instance of the current class for every path. The returned panel must have a method called 'getStore'
	 * which returns a Ext.data.Store instance containing the managed panel content.
	 * @note Subclasses will override this method to create specialized panels for several paths.
	 * @param path Array of category names defining the path to the requested panel
	 * @return Ex.Panel subclass instance
	 */
	createPanel: function(path) {

		var panel = this.createInstance({
			id:'categoryPanel-' + path,
			store: this.getStoreManager().getStore(path),
			path: path,
			autoWidth: true,  
	        autoHeight: true,  
	        listeners:{
				afterrender: function(p, eOpts){
					this.el.swallowEvent([ 'mouseover', 'mouseout', 'mousedown', 'click', 'dblclick', 'cellclick' ]);
				}
			}
		});
		return panel;
	},
	/**
	 * Create a category with the given name
	 * @param name The name of the category
	 * @param categories Array of sub categories (optional)
	 * @return Object with properties 'name' and an array property named like this.getCategoriesName
	 */
	createCategory: function(name, categories) {
		var category = {name:name};
		if (categories == undefined) {
			categories = [];
		}
		category[this.getCategoriesName()] = categories;
		return category;
	},
	/**
	 * Create an instance of the current panel class.
	 * @note Subclasses must implement this method.
	 * @param config The configuration object
	 * @return Ext.Panel subclass instance
	 */
	createInstance: function(config) {
		throw "createInstance method must be implemented by de.ingrid.mapclient.admin.controls.CategoryPanel subclasses";
	},
	/**
	 * Bind the required event handlers to the given panel. This is required each time the panel is
	 * shown, because event handlers seem to be lost at that moment. The default implementation does nothing
	 * @note Subclasses will override this method to handle specialized panels.
	 * @param panel Ext.Panel instance
	 */
	bindEventHandlers: function(panel) {
	},
	/**
	 * Get the store manager instance for the panel
	 * @return de.ingrid.mapclient.admin.data.CategoryStoreManager instance
	 */
	getStoreManager: function() {
		var manager = de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.getInstance(this.getCategoriesName());
		return manager;
	},
	/**
	 * Build all stores from the configuration
	 */
	buildStores: function() {
		var categoriesName = this.getCategoriesName();
		var rootCategories = de.ingrid.mapclient.Configuration.getValue(categoriesName);
		var rootCategory = this.createCategory("root", rootCategories);
		this.buildStore([rootCategory.name], rootCategory);
	},
	/**
	 * Build the store for a category instance.
	 * @param path Array of category names locating the category
	 * @param category Object with at least the properties 'name'
	 */
	buildStore: function(path, category) {

		var store = this.createStore(path, category);

		// iterate over sub-categories of a category store
		var categoriesName = this.getCategoriesName();
		if (store.params.type == categoriesName) {
			var subCategories = category[categoriesName];
			if (subCategories != undefined) {
				for (var i=0, countI=subCategories.length; i<countI; i++) {
					var subCategory = subCategories[i];
					var subPath = path.copy();
					subPath.push(subCategory.name);
					this.buildStore(subPath, subCategory);
				}
			}
		}

		if (store) {
			// register the store
			this.getStoreManager().registerStore(path, store);
		}
	},
	/**
	 * Actually create a store instance for the given path and category. The default implementation creates
	 * a store for categories for every path. Each store must get a type property in baseParams, which defines
	 * the contained record type used for serialization. The default implementation sets this property to the name obtained by getCategoriesName.
	 * The returned store must have the autoDestroy property set to false. The store is supposed to be filled with
	 * data already using the initializeStore method.
	 * @note Subclasses will override this method to create specialized stores for several paths.
	 * @param path Array of category names locating the category
	 * @param category Object with at least the properties 'name'
	 * @return Ext.data.Store instance
	 */
	createStore: function(path, category) {

		var categoriesName = this.getCategoriesName();
		var store = Ext.create('Ext.data.ArrayStore', {
			autoDestroy: false, // the component will be destroyed when categories are sorted, but the store should remain
			fields: [{
				name: 'name',
				type: 'string'
			}],
			params: {
				type: categoriesName
			}
		});
		this.initializeStore(store, category[categoriesName]);
		return store;
	},
	/**
	 * Initialize the given store from the configuration.
	 * @param store Ext.data.Store instance
	 * @param items Array of objects containing the store data
	 */
	initializeStore: function(store, items) {
		if (items != undefined) {
			// load the data into the store (avoid any events fired)
			store.suspendEvents(false);
			for (var i=0, count=items.length; i<count; i++) {
				// construct the record from the item
				var recordData = {};
				var item = items[i];
				for (var key in item) {
					recordData[key] = item[key];
				}
				//var record = new store.recordType(recordData);
				store.add(recordData);
			}
			store.resumeEvents(false);
		}
	}
});