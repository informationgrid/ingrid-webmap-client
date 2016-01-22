/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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
		if(store){
			store.suspendEvents(false);
		}
	}
	
	if(store){
		store.loadData(records);	
	}

	if (preventEvents) {
		if(store){
			store.resumeEvents(false);
		}
	}
};
