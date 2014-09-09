/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.services");

/**
 * @class ServicesModule provides configuration for additional services.
 */
Ext.define('de.ingrid.mapclient.admin.modules.services.ServicesModule', { 
	extend:'de.ingrid.mapclient.admin.modules.ModuleBase',
	id: 'services',
	title: 'Rubriken',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,
	padding: 10,
	autoScroll:true,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {

		Ext.apply(this, {
			items: [
			        Ext.create('de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel', {})
			]
		});
		de.ingrid.mapclient.admin.modules.services.ServicesModule.superclass.initComponent.call(this);
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
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(Ext.create('de.ingrid.mapclient.admin.modules.services.ServicesModule'));