/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.services");

/**
 * @class ServicesModule provides configuration for additional services.
 */
de.ingrid.mapclient.admin.modules.services.ServicesModule = Ext.extend(de.ingrid.mapclient.admin.modules.ModuleBase, {

	title: 'Rubriken',
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
de.ingrid.mapclient.admin.modules.services.ServicesModule.prototype.initComponent = function() {

	var categoryPanel = new de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel();

	Ext.apply(this, {
		items: categoryPanel
	});
	de.ingrid.mapclient.admin.modules.services.ServicesModule.superclass.initComponent.call(this);
};

/**
 * @see de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId
 */
de.ingrid.mapclient.admin.modules.services.ServicesModule.prototype.getId = function() {
	return "services";
};

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(new de.ingrid.mapclient.admin.modules.services.ServicesModule());