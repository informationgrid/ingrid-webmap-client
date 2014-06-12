/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class SettingsDialog is the dialog for configuring the map view.
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog = Ext.extend(Ext.Window, {
	id: 'settingsDialog',
	title: i18n('tErweiterteEinstellungen'),
	closable: true,
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
	 * @cfg projectionsCombo The projections combobox
	 */
	projectionsCombo: null,

	/**
	 * @cfg scalesCombo The scales combobox
	 */
	scalesCombo: null,

	/**
	 * Registry for area comboboxes
	 */
	areaComboBoxes: new Ext.util.MixedCollection
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.initComponent = function() {
	var self = this;
	// register the baselayer change handler
	this.map.events.on({
		'changebaselayer': this.onBaseLayerChange,
		scope: this
	});

	this.projectionsCombo = new Ext.form.ComboBox({
		id: 'projectionsCombo',
		fieldLabel: i18n('tRaumbezugssystem'),
		triggerAction: 'all',
		mode: 'local',
		store: new Ext.data.ArrayStore({
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
	this.projectionsCombo.on('expand', function(){
		self.ctrls['keyboardControl'].deactivate();
	});
	this.projectionsCombo.on('collapse', function(){
		self.ctrls['keyboardControl'].activate();
	});	
	this.scalesCombo = new Ext.form.ComboBox({
		id: 'scalesCombo',
		fieldLabel: i18n('tMaszstab'),
		triggerAction: 'all',
		mode: 'local',
		store: new Ext.data.ArrayStore({
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
	this.scalesCombo.on('expand', function(){
		self.ctrls['keyboardControl'].deactivate();
	});
	this.scalesCombo.on('collapse', function(){
		self.ctrls['keyboardControl'].activate();
	});	
	// add items according to view configuration
	var items = [];
	if (this.viewConfig.hasProjectionsList) {
		items.push(this.projectionsCombo);
	}
	if (this.viewConfig.hasScaleList) {
		items.push(this.scalesCombo);
	}

	this.windowContent = new Ext.FormPanel({
		border: false,
		bodyStyle: 'padding: 10px',
		labelAlign: 'top',
		labelSeparator: '',
		defaults: {
			xtype: 'combo'
		},
		items: items
	});

	Ext.apply(this, {
		items: this.windowContent
	});

	de.ingrid.mapclient.frontend.controls.SettingsDialog.superclass.initComponent.call(this);
};


de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.onBaseLayerChange = function() {
	//console.debug("onBaseLayerChange fired.");
}

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.SettingsDialog.superclass.onRender.apply(this, arguments);

	var self = this;

	// prevent dragging the underlying map
	this.getEl().swallowEvent('mousedown', false);

	// initialize the projections list
	var projections = de.ingrid.mapclient.Configuration.getValue('projections');
	de.ingrid.mapclient.data.StoreHelper.load(this.projectionsCombo.getStore(), projections, ['name', 'epsgCode']);
	var projection = this.getMapProjection();
	// select initial projection
	this.projectionsCombo.setValue(projection.getCode());
	// define select callback
	this.projectionsCombo.on('select', function(comboBox, record, index) {
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
		
		
		var newProjCode = record.get('epsgCode');
		de.ingrid.mapclient.frontend.data.MapUtils.assureProj4jsDef(newProjCode, function() {self.changeProjection(newProjCode)});
	}, this);
	
	// initialize the scales list
	var scales = de.ingrid.mapclient.Configuration.getValue('scales');
	de.ingrid.mapclient.data.StoreHelper.load(this.scalesCombo.getStore(), scales, ['name', 'zoomLevel']);

	var scale = this.map.getScale();
	var scaleRecords = this.scalesCombo.getStore().queryBy(function(record) {
		return Math.abs(scale-record.get('zoomLevel')) < 1;
	});
	if (scaleRecords.length > 0) {
		scaleRecord = scaleRecords.items[0];
		this.scalesCombo.setValue(scaleRecord.get('name'));
	} else {
		this.scalesCombo.setValue("1:"+this.addThousandSeparator(Math.floor(scale), '.'));
	}
	
	var projection = this.getMapProjection();
	// select initial projection
	this.projectionsCombo.setValue(projection.getCode());
	
	// bind scales list and projection to map
	this.map.events.register('zoomend', this, function() {
		// select the current map scale, if it is in the list
		var scales = de.ingrid.mapclient.Configuration.getValue('scales');
		de.ingrid.mapclient.data.StoreHelper.load(self.scalesCombo.getStore(), scales, ['name', 'zoomLevel']);
		
		var scale = self.map.getScale();
		var scaleRecords = self.scalesCombo.getStore().queryBy(function(record) {
			return Math.abs(scale-record.get('zoomLevel')) < 1;
		});
		if (scaleRecords.length > 0) {
			scaleRecord = scaleRecords.items[0];
			self.scalesCombo.setValue(scaleRecord.get('name'));
		} else {
			if (!self.scalesCombo.rendered) {
				return;
			}
			self.scalesCombo.setValue("1:"+self.addThousandSeparator(Math.floor(scale), '.'));
		}
		
		var projection = self.getMapProjection();
		// select initial projection
		self.projectionsCombo.setValue(projection.getCode());
		
	});
	this.scalesCombo.on('select', function(comboBox, record, index) {
		this.map.zoomToScale(record.get('zoomLevel'), true);
	}, this);
//	this.map.events.triggerEvent("zoomend");

};

/**
 * Get the current projection of the map
 * @return OpenLayers.Projection instance
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.getMapProjection = function() {
	return de.ingrid.mapclient.frontend.data.MapUtils.getMapProjection(this.map);
};

/**
 * Reset all area comboboxes and scale combobox (except the one given)
 * @param exception Ext.form.ComboBox instance that should not be reseted
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.resetAreaComboBoxes = function(exception) {
	//this.scalesCombo.clearValue();
	this.areaComboBoxes.each(function(item) {
		if (item != exception) {
			item.clearValue();
		}
	});
};

/**
 * Change the map projection to the given one. We assume that the projection
 * definition is loaded already
 * @param newProjCode EPSG code
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.changeProjection = function(newProjCode) {
	de.ingrid.mapclient.frontend.data.MapUtils.changeProjection(newProjCode, this.map, this);
};

/**
 * Get the configured maximal extent transformed by a projection.
 * 
 * @param protection A projection.
 * @return OpenLayers.Bounds instance
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.getMaxExtent = function(protection) {
	return de.ingrid.mapclient.frontend.data.MapUtils.getMaxExtent(protection);
};



/** method[addThousandSeparator]
 *  Add the thousand separator to a string
 *  :param value: ``Number`` or ``String`` input value
 *  :param separator: ``String`` thousand separator
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.addThousandSeparator = function(value, separator) {
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
};

