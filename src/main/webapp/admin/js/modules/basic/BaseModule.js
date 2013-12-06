/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class BaseModule provides configuration for the default
 * map parameters.
 */
de.ingrid.mapclient.admin.modules.basic.BaseModule = Ext.extend(de.ingrid.mapclient.admin.modules.ModuleBase, {

	title: 'Basiseinstellungen',
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
de.ingrid.mapclient.admin.modules.basic.BaseModule.prototype.initComponent = function() {
	// add the accordion panels
	Ext.apply(this, {
		items: [
	        new de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel(),
	        new de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel(),
	        new de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel(),
	        new de.ingrid.mapclient.admin.modules.basic.ScalesPanel(),
	        new de.ingrid.mapclient.admin.modules.basic.ProxyPanel(),
	        new de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel(),
	        new de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel()
		]
	});
	de.ingrid.mapclient.admin.modules.basic.BaseModule.superclass.initComponent.call(this);
};

/**
 * @see de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId
 */
de.ingrid.mapclient.admin.modules.basic.BaseModule.prototype.getId = function() {
	return "basic";
};

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(new de.ingrid.mapclient.admin.modules.basic.BaseModule());
