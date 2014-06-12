/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class ScaleField is used to input scale values.
 */
Ext.define('de.ingrid.mapclient.admin.controls.ScaleField', { 
	extend: 'Ext.form.NumberField',
	alias: 'widget.scalefield',
    allowBlank: false,
	allowNegative: false,
 	decimalPrecision: 16
});