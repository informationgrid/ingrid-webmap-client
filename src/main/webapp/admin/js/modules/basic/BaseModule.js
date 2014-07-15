/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class BaseModule provides configuration for the default
 * map parameters.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.BaseModule',  { 
	extend:'de.ingrid.mapclient.admin.modules.ModuleBase',
	id: 'basic',
	title: 'Basiseinstellungen',
	xtype: 'layout-accordion',
	layout: 'accordion',
	layoutConfig: {
		titleCollapse: true,
		animate: false
	},
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		// add the accordion panels
		Ext.apply(this, {
			items: [
		        Ext.create('de.ingrid.mapclient.admin.modules.basic.DefaultServicePanel'),
		        Ext.create('de.ingrid.mapclient.admin.modules.basic.DefaultActiveServicesPanel'),
		        Ext.create('de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel'),
		        Ext.create('de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel'),
		        Ext.create('de.ingrid.mapclient.admin.modules.basic.ScalesPanel'),
		        Ext.create('de.ingrid.mapclient.admin.modules.basic.ProxyPanel'),
		        Ext.create('de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel'),
		        Ext.create('de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel')
			]
		});
		de.ingrid.mapclient.admin.modules.basic.BaseModule.superclass.initComponent.call(this);
	}
});

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(Ext.create('de.ingrid.mapclient.admin.modules.basic.BaseModule'));
