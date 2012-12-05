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
de.ingrid.mapclient.admin.controls.CategoryPanel = Ext.extend(Ext.Panel, {

	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
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
	path: ["root"]
});

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.onRender = function(container, position) {

	// we build the ui in onRender, because this is the first time the configuration is available.
	// the configuration is needed, because the categories are defined there.
	if (this.items == undefined) {
		this.add(this.buildContent());
	}

	de.ingrid.mapclient.admin.controls.CategoryPanel.superclass.onRender.apply(this, arguments);
};

/**
 * Build the panel content
 * @return Object used as items property of the panel
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.buildContent = function() {
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
		header: 'Neue Rubrik',
		sortable: true,
		dataIndex: 'name',
		editor: {
		   xtype: 'textfield',
		   allowBlank: false
		}
	}];

	this.expander = new Ext.ux.grid.RowExpander({
		tpl: '<div class="ux-row-expander-box"></div>',
		actAsTree: true,
		treeLeafProperty: 'is_leaf',
		lazyRender: false,
		destroyNestedGrids: function(gridEl) {},
		listeners: {
			expand: function(expander, record, body, rowIndex) {
				var element = Ext.get(expander.grid.getView().getRow(rowIndex)).child('.ux-row-expander-box');
				self.getSubPanel(record, element);
			}
		}
	});

	this.gridConfigCb = function(config) {
		// add the expander column
		config.columns.unshift(self.expander);
		config.plugins = self.expander;
		config.hideHeaders = true;
		return config;
	};

	// create the grid
	this.grid = new de.ingrid.mapclient.admin.controls.GridPanel({
		store: store,
		columns: columns,
		gridConfigCb: self.gridConfigCb
	});

	// listen to category stores in order to update the store registry on any change
	// and store the changes
	store.on({
		'add': function(store, records, index) {
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
		},
		'update': function(store, record, operation) {
			// relocate the store of the category and save
			if (record.dirty) {
				var oldPath = self.path.copy();
				oldPath.push(record.modified.name);
				var newPath = self.path.copy();
				newPath.push(record.get('name'));
				self.getStoreManager().relocateStore(oldPath, newPath);
				self.save();
			}
		},
		'remove': function(store, record, index) {
			// delete the store of the category and save
			var path = self.path.copy();
			var name = record.get("name");
			path.push(name);
			self.getStoreManager().removeStore(path);
			self.save();
		},
		'datachanged': function(store) {
			self.save();
		},
		scope: self
	});

	return this.grid;
};

/**
 * Get a child panel for this panel.
 * @param record The Ext.data.Record to which the panel belongs
 * @param element The element to render the panel to
 * @return Ex.Panel subclass
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.getSubPanel = function(record, element) {

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
	}

	// get the panel from the registry
	panel = this.panels.get(key);

	// check if the rows were reordered and re-render if necessary
	var parentElementId = panel.getEl().parent().id;
	if (parentElementId != element.id) {
		panel = this.relocatePanel(panel, element);
		this.panels.add(key, panel);
	}
	panel = this.panels.get(key);
	this.bindEventHandlers(panel);
	return panel;
};

/**
 * Get the store of the panel
 * @return Ext.data.Store
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.getStore = function() {
	return this.grid.getStore();
};

/**
 * Get the name of the categories managed by this class. This name must be equal to the configuration property
 * which contains the managed categories.
 * @note Subclasses must implement this method.
 * @return String
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.getCategoriesName = function() {
	throw "getCategoriesName method must be implemented by de.ingrid.mapclient.admin.controls.CategoryPanel subclasses";
};

/**
 * Save the category data
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.save = function() {
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
			items.push(record.data);
		}, this);
		// create item
		parent.name = path[path.length-1];
		parent[store.baseParams.type] = items;
		return parent;
	},
	// initial context
	result);
	de.ingrid.mapclient.Configuration.setValue(categoriesName, Ext.encode(result), {success: self.success, failure: self.failure});
};

/**
 * Save the category data
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.saveAndReload = function(storeFromAdd, records) {
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
			items.push(record.data);
		}, this);
		// create item
		parent.name = path[path.length-1];
		parent[store.baseParams.type] = items;
		return parent;
	},
	// initial context
	result);
	var highest = 0;
	var catReference = null;
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
	catReference.idx = highest + 1;
	de.ingrid.mapclient.Configuration.setValue(categoriesName, Ext.encode(result), de.ingrid.mapclient.admin.DefaultSaveHandler);

};

/**
 * Relocate the panel to another parent element. This is necessary after reordering
 * @param panel
 * @param element
 * @returns Ext.Panel subclass
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.relocatePanel = function(panel, element) {
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
};

/**
 * Create a panel for the given path. The default implementation creates
 * an instance of the current class for every path. The returned panel must have a method called 'getStore'
 * which returns a Ext.data.Store instance containing the managed panel content.
 * @note Subclasses will override this method to create specialized panels for several paths.
 * @param path Array of category names defining the path to the requested panel
 * @return Ex.Panel subclass instance
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.createPanel = function(path) {

	var panel = this.createInstance({
		store: this.getStoreManager().getStore(path),
		path: path
	});
	return panel;
};

/**
 * Create a category with the given name
 * @param name The name of the category
 * @param categories Array of sub categories (optional)
 * @return Object with properties 'name' and an array property named like this.getCategoriesName
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.createCategory = function(name, categories) {
	var category = {name:name};
	if (categories == undefined) {
		categories = [];
	}
	category[this.getCategoriesName()] = categories;
	return category;
};

/**
 * Create an instance of the current panel class.
 * @note Subclasses must implement this method.
 * @param config The configuration object
 * @return Ext.Panel subclass instance
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.createInstance = function(config) {
	throw "createInstance method must be implemented by de.ingrid.mapclient.admin.controls.CategoryPanel subclasses";
};

/**
 * Bind the required event handlers to the given panel. This is required each time the panel is
 * shown, because event handlers seem to be lost at that moment. The default implementation does nothing
 * @note Subclasses will override this method to handle specialized panels.
 * @param panel Ext.Panel instance
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.bindEventHandlers = function(panel) {
};

/**
 * Get the store manager instance for the panel
 * @return de.ingrid.mapclient.admin.data.CategoryStoreManager instance
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.getStoreManager = function() {
	var manager = de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.getInstance(this.getCategoriesName());
	return manager;
};

/**
 * Build all stores from the configuration
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.buildStores = function() {
	var categoriesName = this.getCategoriesName();
	var rootCategories = de.ingrid.mapclient.Configuration.getValue(categoriesName);
	var rootCategory = this.createCategory("root", rootCategories);
	this.buildStore([rootCategory.name], rootCategory);
};

/**
 * Build the store for a category instance.
 * @param path Array of category names locating the category
 * @param category Object with at least the properties 'name'
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.buildStore = function(path, category) {

	var store = this.createStore(path, category);

	// iterate over sub-categories of a category store
	var categoriesName = this.getCategoriesName();
	if (store.baseParams.type == categoriesName) {
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
};

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
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.createStore = function(path, category) {

	var store = new Ext.data.ArrayStore({
		autoDestroy: false, // the component will be destroyed when categories are sorted, but the store should remain
		fields: [{
			name: 'name',
			type: 'string'
		}]
	});
	var categoriesName = this.getCategoriesName();
	store.setBaseParam("type", categoriesName);
	this.initializeStore(store, category[categoriesName]);

	return store;
};

/**
 * Initialize the given store from the configuration.
 * @param store Ext.data.Store instance
 * @param items Array of objects containing the store data
 */
de.ingrid.mapclient.admin.controls.CategoryPanel.prototype.initializeStore = function(store, items) {
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
			var record = new store.recordType(recordData);
			store.add(record);
		}
		store.resumeEvents(false);
	}
};



