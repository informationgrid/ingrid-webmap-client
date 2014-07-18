/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.data");

/**
 * @class CategoryStoreManager is used to organize related hierarchical stores.
 * Each store is located by a path. Different store managers can be used
 * together in an application. Use de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.getInstance()
 * method to obtain a store manager instance.
 * @param id The unique id of the store manager
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager = function(id) {

	/**
	 * The is of the store manager instance
	 */
	this.id = id;

	/**
	 * The store registry
	 */
	this.stores = new Ext.util.MixedCollection();
};

/**
 * Register a store at the registry for later retrieval.
 * @param path An array of category names locating the store
 * @param store Ext.data.DataStore instance
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.prototype.registerStore = function(path, store) {
	var key = Ext.encode(path);
	this.stores.add(key, store);
};

/**
 * Remove a store from the registry.
 * @param path An array of category names locating the store
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.prototype.removeStore = function(path) {
	var key = Ext.encode(path);
	this.stores.removeAtKey(key);
};

/**
 * Relocate a store in the registry.
 * @param oldPath The old path
 * @param newPath The new path
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.prototype.relocateStore = function(oldPath, newPath) {
	var oldKey = Ext.encode(oldPath);
	var newKey = Ext.encode(newPath);
	var store = this.getStore(oldKey);
	this.removeStore(oldKey);
	this.registerStore(newKey, store);
};

/**
 * Get a store from the registry.
 * @param path An array of category names locating the store
 * @return Ext.data.DataStore instance
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.prototype.getStore = function(path) {
	var key = Ext.encode(path);
	if (this.stores.containsKey(key)) {
		return this.stores.get(key);
	}
	return undefined;
};

/**
 * Get all stores from the registry.
 * @return Ext.util.MixedCollection instance
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.prototype.getStores = function() {
	return this.stores;
};

/**
 * Depth first iteration over all stores.
 * @param callback Callback function to call on each store (parameters: path, store, context; returns: context)
 * @param context Object to be passed to each call of callback and returned by it
 * @param path Used internally only
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.prototype.iterate = function(callback, context, path) {
	if (path == undefined) {
		path = ["root"];
	}
	var store = this.getStore(path);
	if (store != undefined) {
		if (callback instanceof Function) {
			context = callback(path, store, context);
		}
		store.each(function(record) {
			var subPath = path.copy();
			subPath.push(record.get("name"));
			this.iterate(callback, context, subPath);
		}, this);
	}
};

/**
 * Check if a store manager with the given id exists.
 * @param id The id of the store manager.
 * @returns Boolean
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.exists = function(id) {
	return (de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.instances != undefined &&
			de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.instances.containsKey(id));
};

/**
 * Get a store manager instance.
 * @param id The id of the store manager.
 * @returns de.ingrid.mapclient.admin.data.CategoryStoreManager instance
 */
de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.getInstance = function(id) {
	if (de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.instances == undefined) {
		de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.instances = new Ext.util.MixedCollection();
	}
	if (!de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.instances.containsKey(id)) {
		var manager = new de.ingrid.mapclient.admin.modules.data.CategoryStoreManager(id);
		de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.instances.add(id, manager);
	}
	return de.ingrid.mapclient.admin.modules.data.CategoryStoreManager.instances.get(id);
};
