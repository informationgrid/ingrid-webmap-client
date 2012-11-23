/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.areas");

/**
 * @class ServicesModule provides configuration for predefined map areas.
 */
de.ingrid.mapclient.admin.modules.areas.AreasModule = Ext.extend(de.ingrid.mapclient.admin.modules.ModuleBase, {

	title: 'Vordefinierte Bereiche',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,
	padding: 10,
	autoScroll:true

});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.areas.AreasModule.prototype.initComponent = function() {

	var categoryPanel = new de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel();

	Ext.apply(this, {
		items: categoryPanel
	});
	de.ingrid.mapclient.admin.modules.areas.AreasModule.superclass.initComponent.call(this);
};

/**
 * @see de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId
 */
de.ingrid.mapclient.admin.modules.areas.AreasModule.prototype.getId = function() {
	return "areas";
};

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(new de.ingrid.mapclient.admin.modules.areas.AreasModule());
