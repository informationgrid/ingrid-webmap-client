/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.areas");

/**
 * @class ServicesModule provides configuration for predefined map areas.
 */
Ext.define('de.ingrid.mapclient.admin.modules.areas.AreasModule',  { 
	extend:'de.ingrid.mapclient.admin.modules.ModuleBase',
	title: 'Vordefinierte Bereiche',
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
			items: Ext.create('de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel')
		});
		de.ingrid.mapclient.admin.modules.areas.AreasModule.superclass.initComponent.call(this);
	},
	/**
	 * @see de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId
	 */
	getId: function() {
		return "areas";
	}
});

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(new de.ingrid.mapclient.admin.modules.areas.AreasModule());
