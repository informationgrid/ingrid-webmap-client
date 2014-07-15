/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");

/**
 * @class BaseModule provides configuration for the default
 * map parameters.
 */
Ext.define('de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule', { 
	extend:'de.ingrid.mapclient.admin.modules.ModuleBase', 
	id: 'maintenance',
	title: 'Dienste',
	layout: 'accordion',
	defaults: {
		autoScroll: true
	},
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		// add the accordion panels
		Ext.apply(this, {
			items: [
			        Ext.create('de.ingrid.mapclient.admin.modules.maintenance.ServicePanel')
			]
		});
		de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule.superclass.initComponent.call(this);
	},
	/**
	 * @see de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId
	 */
	getId: function() {
		return this.id;
	}
});

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(Ext.create('de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule'));
