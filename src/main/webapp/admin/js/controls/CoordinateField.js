/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class CoordinateField is used to input coordinate values (WGS 84 format).
 */
de.ingrid.mapclient.admin.controls.CoordinateField = Ext.extend(Ext.form.NumberField, {

	allowBlank: false,
	allowNegative: false,
 	decimalPrecision: 16
});

Ext.reg('coordinatefield', de.ingrid.mapclient.admin.controls.CoordinateField);
