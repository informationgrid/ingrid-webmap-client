/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");

/**
 * @class BaseModule provides configuration for the default
 * map parameters.
 */
de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule = Ext.extend(de.ingrid.mapclient.admin.modules.ModuleBase, {

	title: 'Wartung',
	layout: 'accordion',
	layoutConfig: {
		titleCollapse: true,
		animate: false
	},
	defaults: {
		autoScroll: true,
		padding: 10
	}
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule.prototype.initComponent = function() {
	// add the accordion panels
	Ext.apply(this, {
		items: [
		        new de.ingrid.mapclient.admin.modules.maintenance.ServicePanel()
		        
		]
	});
	de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule.superclass.initComponent.call(this);
};

/**
 * @see de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId
 */
de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule.prototype.getId = function() {
	return "maintenance";
};

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(new de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule());
