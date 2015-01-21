/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
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
 * @class SettingsDialog is the dialog for configuring the map view.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.SettingsDialog', {
	extend: 'Ext.Window',
	id: 'settingsDialog',
	title: i18n('tErweiterteEinstellungen'),
	closable: true,
	closeAction: 'hide',
	draggable: true,
	resizable: false,
	constrain: true,
	collapsible: false,
	collapsed: true,
	width: 250,
	autoHeight: true,
	shadow: false,
	initHidden: false,
	ctrls:null,
	windowContent: null,
	

	/**
	 * @cfg map The OpenLayers.Map instance to adjust
	 */
	map: null,

	/**
	 * The view configuration. The default configuration lists all known
	 * properties:
	 */
	viewConfig: {
		hasProjectionsList: true,
		hasScaleList: true
	},

	/**
	 * Registry for area comboboxes
	 */
	areaComboBoxes: new Ext.util.MixedCollection,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		// register the baselayer change handler
		this.map.events.on({
			'changebaselayer': this.onBaseLayerChange,
			scope: this
		});

		var projectionsCombo = Ext.create('Ext.form.field.ComboBox', {
			id: 'settingsDialog_projectionsCombo',
			fieldLabel: i18n('tRaumbezugssystem'),
			labelAlign: 'top',
			triggerAction: 'all',
			queryMode: 'local',
			flex: 1,
			store: Ext.create('Ext.data.ArrayStore', {
				autoDestroy: true,
				fields: [ {
					name: 'name',
					type: 'string'
				}, {
					name: 'epsgCode',
					type: 'string'
				} ]
			}),
			valueField: 'epsgCode',
			displayField: 'name',
			editable: false
		});
		projectionsCombo.on('expand', function(){
			self.ctrls['keyboardControl'].deactivate();
		});
		projectionsCombo.on('collapse', function(){
			self.ctrls['keyboardControl'].activate();
		});
		
		// initialize the projections list
		var projections = de.ingrid.mapclient.Configuration.getValue('projections');
		de.ingrid.mapclient.data.StoreHelper.load(projectionsCombo.getStore(), projections, ['name', 'epsgCode']);
		var projection = this.getMapProjection();
		// select initial projection
		projectionsCombo.setValue(projection.getCode());
		// define select callback
		projectionsCombo.on('select', function(comboBox, record, index) {
			// Close position dialog
			var positionDialog = Ext.getCmp("positionControl");
			if(positionDialog){
				if(positionDialog.markers){
					self.map.removeLayer(positionDialog.markers);
					positionDialog.markers = null;
				}
				positionDialog.hide();
			}
			
			// Close BwaStrDialog
			var bWaStrDialog = Ext.getCmp("bWaStrDialog");
	        if(bWaStrDialog){
	        	bWaStrDialog.hide();
	        }
			
			
			var newProjCode = record[0].getData().epsgCode;
			de.ingrid.mapclient.frontend.data.MapUtils.assureProj4jsDef(newProjCode, function() {self.changeProjection(newProjCode)});
		}, this);
		
		var scalesCombo = Ext.create('Ext.form.field.ComboBox', {
			id: 'settingsDialog_scalesCombo',
			fieldLabel: i18n('tMaszstab'),
			labelAlign: 'top',
			triggerAction: 'all',
			queryMode: 'local',
			store: Ext.create('Ext.data.ArrayStore', {
				autoDestroy: true,
				fields: [ {
					name: 'name',
					type: 'string'
				}, {
					name: 'zoomLevel',
					type: 'string'
				} ]
			}),
			valueField: 'zoomLevel',
			displayField: 'name',
			editable: false
		});
		scalesCombo.on('expand', function(){
			self.ctrls['keyboardControl'].deactivate();
		});
		scalesCombo.on('collapse', function(){
			self.ctrls['keyboardControl'].activate();
		});	
		
		// initialize the scales list
		var scales = de.ingrid.mapclient.Configuration.getValue('scales');
		de.ingrid.mapclient.data.StoreHelper.load(scalesCombo.getStore(), scales, ['name', 'zoomLevel']);

		var scale = Math.round(this.map.getScale());
		scalesCombo.setValue("1:"+self.addThousandSeparator(Math.floor(scale), '.'));
		
		scalesCombo.on('select', function(comboBox, record, index) {
			this.map.zoomToScale(record[0].getData().zoomLevel, true);
			scalesCombo.setValue("1:"+self.addThousandSeparator(Math.floor(record[0].getData().zoomLevel), '.'));
		}, this);
		
		// add items according to view configuration
		var items = [];
		if (this.viewConfig.hasProjectionsList) {
			items.push(projectionsCombo);
		}
		if (this.viewConfig.hasScaleList) {
			items.push(scalesCombo);
		}

		this.windowContent = Ext.create('Ext.form.Panel', {
			border: false,
			bodyStyle: 'padding: 10px',
			labelAlign: 'top',
			labelSeparator: '',
			defaults: {
				xtype: 'combo',
	        	anchor: '100%'
			},
			items: items
		});

		Ext.apply(this, {
			items: this.windowContent
		});

		this.superclass.initComponent.call(this);
	},
	onBaseLayerChange: function() {
		//console.debug("onBaseLayerChange fired.");
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		this.superclass.onRender.apply(this, arguments);

		var self = this;
		var projectionsCombo = Ext.getCmp("settingsDialog_projectionsCombo");
		var scalesCombo = Ext.getCmp("settingsDialog_scalesCombo");
		
		// prevent dragging the underlying map
		this.getEl().swallowEvent('mousedown', false);

		// bind scales list and projection to map
		this.map.events.register('zoomend', this, function() {
			var scale = Math.round(this.map.getScale());
			if(scalesCombo.store){
				scalesCombo.setValue("1:"+self.addThousandSeparator(Math.floor(scale), '.'));
			}
			
			var projection = this.getMapProjection();
			if(projection.store){
				projectionsCombo.setValue(projection.getCode());
			}
		});
	},
	getMapProjection: function() {
		return de.ingrid.mapclient.frontend.data.MapUtils.getMapProjection(this.map);
	},
	/**
	 * Reset all area comboboxes and scale combobox (except the one given)
	 * @param exception Ext.form.ComboBox instance that should not be reseted
	 */
	resetAreaComboBoxes: function(exception) {
		//this.scalesCombo.clearValue();
		this.areaComboBoxes.each(function(item) {
			if (item != exception) {
				item.clearValue();
			}
		});
	},
	/**
	 * Change the map projection to the given one. We assume that the projection
	 * definition is loaded already
	 * @param newProjCode EPSG code
	 */
	changeProjection: function(newProjCode) {
		de.ingrid.mapclient.frontend.data.MapUtils.changeProjection(newProjCode, this.map, this);
	},
	/**
	 * Get the configured maximal extent transformed by a projection.
	 * 
	 * @param protection A projection.
	 * @return OpenLayers.Bounds instance
	 */
	getMaxExtent: function(protection) {
		return de.ingrid.mapclient.frontend.data.MapUtils.getMaxExtent(protection);
	},
	/** method[addThousandSeparator]
	 *  Add the thousand separator to a string
	 *  :param value: ``Number`` or ``String`` input value
	 *  :param separator: ``String`` thousand separator
	 */
	addThousandSeparator: function(value, separator) {
	    if (separator === null) {
	        return value;
	    }
	    value = value.toString();
	    var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})');
	    while (sRegExp.test(value)) {
	        value = value.replace(sRegExp, '$1' + separator + '$2');
	    }
	    // Remove the thousand separator after decimal separator
	    if (this.decimalNumber > 3) {
	        var decimalPosition = value.lastIndexOf(this.getLocalDecimalSeparator());
	        if (decimalPosition > 0) {
	            var postDecimalCharacter = value.substr(decimalPosition);
	            value = value.substr(0, decimalPosition) + postDecimalCharacter.replace(separator, '');
	        }
	    }
	    return value;
	}
});