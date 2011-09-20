/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class ScaleField is used to input scale values.
 */
de.ingrid.mapclient.admin.controls.ScaleField = Ext.extend(Ext.form.NumberField, {

	allowBlank: false,
	allowNegative: false,
 	decimalPrecision: 16
});

Ext.reg('scalefield', de.ingrid.mapclient.admin.controls.ScaleField);
