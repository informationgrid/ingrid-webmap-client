/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules");

/**
 * @class ModuleBase is the base class for administration modules.
 * Each module is represented by a tab panel in the administration tab container and is required to call the
 * de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule() method to register itself.
 *
 * According to the Extjs component lifecycle two methods are useful to implement:
 * - initComponent: Use this method to define the items contained in the module's panel
 * - onRender: Use this method to initialize the items contained in the module's panel
 * Note that the de.ingrid.mapclient.Configuration instance is not initialized before onRender
 */
de.ingrid.mapclient.admin.modules.ModuleBase = Ext.extend(Ext.Panel, {
});

/**
 * Get the id of the module. Subclasses must implement this method
 * to provide a unique module id.
 * @return String
 */
de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId = function() {
	throw "Method getId is not implemented";
};
