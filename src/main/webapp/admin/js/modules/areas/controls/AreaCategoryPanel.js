/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.areas");

/**
 * @class AreaCategoryPanel is used to manage map areas in hierarchical categories.
 */
de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel = Ext.extend(de.ingrid.mapclient.admin.controls.CategoryPanel, {
	dropBoxTitle: 'Vordefinierte Bereiche l&ouml;schen'
});

/**
 * @see de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.getCategoriesName
 */
de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.prototype.getCategoriesName = function() {
	return de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.CATEGORIES_NAME;
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createPanel
 */
de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.prototype.createPanel = function(path) {
	var panel = null;

	if (path.length == 2) {
		// for paths of length 2 we build a AreaPanel instance for managing areas
		panel = new de.ingrid.mapclient.admin.modules.areas.AreaPanel({
			store: this.getStoreManager().getStore(path)
		});
	}
	else {
		// for other paths we build a CategoryPanel instance for managing sub categories
		panel = de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.superclass.createPanel.call(this, path);
	}

	return panel;
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createInstance
 */
de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.prototype.createInstance = function(config) {
	return new de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel(config);
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.bindEventHandlers
 */
de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.prototype.bindEventHandlers = function(panel) {
	if (panel instanceof de.ingrid.mapclient.admin.controls.GridPanel) {
		var self = this;

		panel.on('datachanged', function(e) {
			self.save();
		});
		// prevent propagating events up to parent grid
		panel.gridPanel.getEl().swallowEvent(['click', 'mousedown', 'keydown', 'mouseover', 'contextmenu', 'dblclick'], true);
	}
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createStore
 */
de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.prototype.createStore = function(path, category) {
	var store = null;

	if (path.length == 2) {
		// create the area store for path length 2
		store = new Ext.data.ArrayStore({
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
			}]
		});
		store.setBaseParam("type", "areas");
		this.initializeStore(store, category.areas);
	}
	else {
		// for other paths we create a categories store
		store = de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.superclass.createStore.call(this, path, category);
	}

	return store;
};

de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel.CATEGORIES_NAME = 'areaCategories';
