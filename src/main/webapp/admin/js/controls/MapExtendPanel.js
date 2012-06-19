/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class MapExtendPanel allows to enter map extend coordinates.
 */
de.ingrid.mapclient.admin.controls.MapExtendPanel = Ext.extend(Ext.Panel, {

	layout: {
	    type: 'vbox',
	    align: 'center',
	    pack: 'start'
	},
	height: 250,
	border: false,

	/**
	 * @cfg northField A field for the north value of the map extend (optional, will be created if not provided)
	 */
	northField: null,
	/**
	 * @cfg westField A field for the west value of the map extend (optional, will be created if not provided)
	 */
	westField: null,
	/**
	 * @cfg eastField A field for the east value of the map extend (optional, will be created if not provided)
	 */
	eastField: null,
	/**
	 * @cfg southField A field for the south value of the map extend (optional, will be created if not provided)
	 */
	southField: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.controls.MapExtendPanel.prototype.initComponent = function() {

	// create the input fields if not provided
	if (this.northField == null) {
		this.northField = new de.ingrid.mapclient.admin.controls.CoordinateField();
	}
	if (this.westField == null) {
		this.westField = new de.ingrid.mapclient.admin.controls.CoordinateField();
	}
	if (this.eastField == null) {
		this.eastField = new de.ingrid.mapclient.admin.controls.CoordinateField();
	}
	if (this.southField == null) {
		this.southField = new de.ingrid.mapclient.admin.controls.CoordinateField();
	}

	// create the final layout
	Ext.apply(this, {
		items: [{
			xtype: 'container',
			layout: 'form',
			labelAlign: 'top',
			labelSeparator: '',
			height: 70,
			items: this.northField
		}, {
			xtype: 'container',
			layout: 'column',
			height: 70,
			items: [{
				xtype: 'container',
				layout: 'form',
				labelAlign: 'top',
				labelSeparator: '',
				width: 130,
				items: this.westField
			}, {
				html: '&nbsp',
				bodyBorder: false,
				width: 130
			}, {
				xtype: 'container',
				layout: 'form',
				labelAlign: 'top',
				labelSeparator: '',
				width: 130,
				items: this.eastField
			}]
		}, {
			xtype: 'container',
			layout: 'form',
			labelAlign: 'top',
			labelSeparator: '',
			height: 70,
			items: this.southField
		}, {
			html: '<p>Bitte alle Koordinaten in WGS 84 angeben</p>',
			border: false
		}]
	});
	de.ingrid.mapclient.admin.controls.MapExtendPanel.superclass.initComponent.call(this);
};

/**
 * Validate the content
 * @return Boolean
 */
de.ingrid.mapclient.admin.controls.MapExtendPanel.prototype.validate = function() {
	return (this.northField.validate() && this.westField.validate() && this.eastField.validate() && this.southField.validate());
};

/**
 * Set the map extend to display
 * @param north The north coordinate
 * @param west The west coordinate
 * @param east The east coordinate
 * @param south The south coordinate
 */
de.ingrid.mapclient.admin.controls.MapExtendPanel.prototype.setExtend = function(north, west, east, south) {
	this.northField.setValue(north);
	this.westField.setValue(west);
	this.eastField.setValue(east);
	this.southField.setValue(south);
};

/**
 * Get the map extend from the input fields
 * @return An object with attributes north, west, east, south
 */
de.ingrid.mapclient.admin.controls.MapExtendPanel.prototype.getExtend = function() {
	var mapExtend = {
		north: this.northField.getValue(),
		west: this.westField.getValue(),
		east: this.eastField.getValue(),
		south: this.southField.getValue()
	};
	return mapExtend;
};