/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class CoordinateField is used to input coordinate values (WGS 84 format).
 */
Ext.define('de.ingrid.mapclient.admin.controls.CoordinateField', { 
	extend:'Ext.form.NumberField',
	alias: 'widget.coordinatefield',
	allowBlank: false,
	allowNegative: true,
 	decimalPrecision: 16
});