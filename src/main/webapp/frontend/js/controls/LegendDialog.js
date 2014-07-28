/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class LegendDialog is the dialog for displaying meta data about a wms or wms layer.
 */

Ext.define('de.ingrid.mapclient.frontend.controls.LegendDialog', {
	extend: 'Ext.Window',
	requires: [
       'GeoExt.panel.Map', 
       'GeoExt.container.WmsLegend',
       'GeoExt.container.UrlLegend',
       'GeoExt.container.VectorLegend',
       'GeoExt.panel.Legend'
    ],
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
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		this.on('close', function(){
			this.hide();
		});
		
		var legendPanel = Ext.create('GeoExt.panel.Legend', {
			autoScroll : true,
			border : false,
			dynamic : true,
			cls: "mapclientLegendPanel"
		});
		
		Ext.apply(this, {
			items: legendPanel,
			doClose : function(){
		        this.fireEvent('close', this);
		    }
		});

		this.superclass.initComponent.call(this);
	}
});


