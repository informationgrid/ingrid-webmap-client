/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class MapExtendPanel allows to enter map extend coordinates.
 */
Ext.define('de.ingrid.mapclient.admin.controls.MapExtendPanel', { 
	extend: 'Ext.panel.Panel',
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
