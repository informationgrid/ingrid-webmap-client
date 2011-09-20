/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultExtendPanel is used to define the map's default extend.
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel = Ext.extend(Ext.Panel, {

	title: 'Initiale Kartenausdehnung',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,

	/**
	 * The map extend panel
	 */
	mapExtendPanel: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.prototype.initComponent = function() {

	this.mapExtendPanel = new de.ingrid.mapclient.admin.controls.MapExtendPanel({
	});

	var self = this;
	Ext.apply(this, {
		items: this.mapExtendPanel,
		buttons: [{
			xtype: 'button',
			id: 'saveBtn',
			text: 'Speichern',
			handler: function() {
				if (self.mapExtendPanel.validate()) {
					self.saveMapExtend();
				}
			}
		}]
	});
	de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.superclass.onRender.apply(this, arguments);

	// initialize the mapExtend fields
	var mapExtend = de.ingrid.mapclient.Configuration.getValue("mapExtend");
	this.mapExtendPanel.setExtend(mapExtend.north, mapExtend.west, mapExtend.east, mapExtend.south);
};

/**
 * Save the map extend on the server
 */
de.ingrid.mapclient.admin.modules.basic.DefaultExtendPanel.prototype.saveMapExtend = function() {
	var mapExtend = this.mapExtendPanel.getExtend();
	de.ingrid.mapclient.Configuration.setValue('mapExtend', Ext.encode(mapExtend), de.ingrid.mapclient.admin.DefaultSaveHandler);
};