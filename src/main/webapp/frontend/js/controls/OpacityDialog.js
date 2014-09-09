/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class OpacityDialog is the dialog for setting a layers opacity.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.OpacityDialog', {
	extend:'Ext.Window',
	title: i18n('tLayerTransparenz'),
	closable: true,
	draggable: true,
	width: 300,
	height: 70,
	border: false,
	constrain: true,

	/**
	 * @cfg layer The OpenLayers.Layer instance to adjust the transparency for
	 */
	layer: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		this.title += ": "+this.layer.name;

		var slider = new GeoExt.LayerOpacitySlider({
			layer: this.layer,
	        aggressive: false,
	        autoWidth: true,
	        autoHeight: true,
	        minValue: 0,
	        maxValue: 100
	    });
		// set the value explicitly
		slider.setValue(0, slider.value);

		var panel = new Ext.Panel({
			border: false,
			bodyStyle: 'padding: 10px',
			items: slider
		});

		Ext.apply(this, {
			items: panel
		});

		this.superclass.initComponent.call(this);
	}
});