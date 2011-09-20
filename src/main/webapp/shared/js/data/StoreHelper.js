/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.data");

/**
 * @class StoreHelper provides utility methods for working with Ext.data.Store instances.
 *
 * @constructor
 */
de.ingrid.mapclient.data.StoreHelper = function() {};

/**
 * Load items provided as objects into the given store.
 * @param store Ext.data.Store the store instance
 * @param items Array of objects
 * @param attributes Array of attribute names used as record columns
 * @param preventEvents Boolean indicating, if store events should be fired or not (optional, default: true) 
 */
de.ingrid.mapclient.data.StoreHelper.load = function(store, items, attributes, preventEvents) {
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
