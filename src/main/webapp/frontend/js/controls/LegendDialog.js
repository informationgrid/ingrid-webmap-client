/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class LegendDialog is the dialog for displaying meta data about a wms or wms layer.
 */
de.ingrid.mapclient.frontend.controls.LegendDialog = Ext.extend(Ext.Window, {
	id: 'legendDialog',
	bodyCls: 'mapclientLegendPanel',
	title: i18n('tLegende'),
	closable: true,
	draggable: true,
	resizable: true,
	width: 590,
	height:400,
	shadow: false,
	initHidden: false,
	autoScroll:true,
	constrain: true,
	windowContent: null,
	activeServicesPanel: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.LegendDialog.prototype.initComponent = function() {
	var self = this;
	
	var legendPanel = new GeoExt.LegendPanel({
		layerStore : self.activeServicesPanel.getLayerStore(),
		autoScroll : true,
		border : false,
		dynamic : true,
		cls: "mapclientLegendPanel"
	});
	
	Ext.apply(this, {
		items: legendPanel
	});

	de.ingrid.mapclient.frontend.controls.LegendDialog.superclass.initComponent.call(this);
};
