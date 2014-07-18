/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class ScaleField is used to input scale values.
 */
Ext.define('de.ingrid.mapclient.admin.controls.ScaleField', { 
	extend: 'Ext.form.field.Number',
	alias: 'widget.scalefield',
	anchor: '100%',
    allowBlank: false,
	allowNegative: false,
	hideTrigger: true,
    decimalPrecision: 16
});