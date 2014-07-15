/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class MapExtendPanel allows to enter map extend coordinates.
 */
Ext.define('de.ingrid.mapclient.admin.controls.MapExtendPanel', { 
	extend: 'Ext.panel.Panel',
	id: 'mapExtendPanel',
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
	northFieldValue: null,
	/**
	 * @cfg westField A field for the west value of the map extend (optional, will be created if not provided)
	 */
	westField: null,
	westFieldValue: null,
	/**
	 * @cfg eastField A field for the east value of the map extend (optional, will be created if not provided)
	 */
	eastField: null,
	eastFieldValue: null,
	/**
	 * @cfg southField A field for the south value of the map extend (optional, will be created if not provided)
	 */
	southField: null,
	southFieldValue: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
		// create the input fields if not provided
		if (this.northField == null) {
			this.northField = Ext.create('de.ingrid.mapclient.admin.controls.CoordinateField', {
					id:'northField',
					listeners: {
						afterRender: function(){
							this.setValue(self.northFieldValue);
						}
					}
				}
			);
		}
		if (this.westField == null) {
			this.westField = Ext.create('de.ingrid.mapclient.admin.controls.CoordinateField', {
					id:'westField',
					listeners: {
						afterRender: function(){
							this.setValue(self.westFieldValue);
						}
					}
				}
			);
		}
		if (this.eastField == null) {
			this.eastField = Ext.create('de.ingrid.mapclient.admin.controls.CoordinateField', {
					id:'eastField',
					listeners: {
						afterRender: function(){
							this.setValue(self.eastFieldValue);
						}
					}
				}
			);
		}
		if (this.southField == null) {
			this.southField = Ext.create('de.ingrid.mapclient.admin.controls.CoordinateField', {
					id:'southField',
					listeners: {
						afterRender: function(){
							this.setValue(self.southFieldValue);
						}
					}
				}
			);
		}

		// create the final layout
		Ext.apply(this, {
			items: [{
				html: '<p>Bitte alle Koordinaten in WGS 84 angeben</p>',
				border: false
			},{
				html: '<p>Initiale Kartenausdehnung:</p>',
				border: false
			},{
				xtype: 'container',
				layout: 'column',
				height: 70,
				items: this.northField
			}, {
				xtype: 'container',
				layout: 'column',
				height: 70,
				items: [{
					xtype: 'container',
					layout: 'form',
					width: 130,
					items: this.westField
				}, {
					html: '&nbsp',
					border: false,
					width: 130
				}, {
					xtype: 'container',
					layout: 'form',
					width: 130,
					items: this.eastField
				}]
			}, {
				xtype: 'container',
				layout: 'column',
				height: 70,
				items: this.southField
			}]
		});
		de.ingrid.mapclient.admin.controls.MapExtendPanel.superclass.initComponent.call(this);
	},
	/**
	 * Validate the content
	 * @return Boolean
	 */
	validate: function() {
		return (this.northField.validate() && this.westField.validate() && this.eastField.validate() && this.southField.validate());
	},
	/**
	 * Set the map extend to display
	 * @param north The north coordinate
	 * @param west The west coordinate
	 * @param east The east coordinate
	 * @param south The south coordinate
	 */
	setExtend: function(north, west, east, south) {
		this.northField.setValue(north);
		this.northFieldValue = north;
		this.westField.setValue(west);
		this.westFieldValue = west;
		this.eastField.setValue(east);
		this.eastFieldValue = east;
		this.southField.setValue(south);
		this.southFieldValue = south;
	},
	/**
	 * Get the map extend from the input fields
	 * @return An object with attributes north, west, east, south
	 */
	getExtend: function() {
		var mapExtend = {
			north: this.northField.getValue(),
			west: this.westField.getValue(),
			east: this.eastField.getValue(),
			south: this.southField.getValue()
		};
		return mapExtend;
	}
});