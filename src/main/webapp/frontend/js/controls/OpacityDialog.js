/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
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

		var panel = Ext.create('Ext.panel.Panel', {
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
