/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin");

/**
 * @class AdminWorkspace is the main gui component for the administration application.
 */
de.ingrid.mapclient.admin.AdminWorkspace = Ext.extend(Ext.Viewport, {

	layout: 'border'
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.AdminWorkspace.prototype.initComponent = function() {

	var moduleContainer = new de.ingrid.mapclient.admin.modules.ModuleContainer();
    var toolbar = new Ext.Toolbar({
        items: [{
			xtype: 'tbtext',
			text: 'InGrid Map Client Administration',
			cls: 'title'
		}/*, '->', {
			text: 'Abmelden'
		}*/],
        height: 40
    });

	Ext.apply(this, {
		items: [{
			region: 'north',
			tbar: toolbar
		}, {
			region: 'center',
			layout: 'fit',
			items: moduleContainer
		}]
	});
	de.ingrid.mapclient.admin.AdminWorkspace.superclass.initComponent.call(this);
};
