/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class CoordinateField is used to input coordinate values (WGS 84 format).
 */
Ext.define('de.ingrid.mapclient.admin.controls.CoordinateField', {
	extend: 'Ext.form.field.Number',
	alias: 'widget.coordinatefield',
	anchor: '100%',
    allowBlank: false,
	allowNegative: true,
	hideTrigger: true,
    decimalPrecision: 16
});
