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
	closable: false,
	draggable: true,
	resizable: false,
	constrain: true,
	collapsible: true,
	collapsed: true,
	expandOnShow: false,
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
		hasScaleList: true,
		hasAreasList: true
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
		var newProjCode = record.get('epsgCode');
		de.ingrid.mapclient.frontend.data.MapUtils.assureProj4jsDef(newProjCode, function() {self.changeProjection(newProjCode)});
	}, this);
	
	// initialize the scales list
	var scales = de.ingrid.mapclient.Configuration.getValue('scales');
	de.ingrid.mapclient.data.StoreHelper.load(this.scalesCombo.getStore(), scales, ['name', 'zoomLevel']);

	// bind scales list and projection to map
	this.map.events.register('zoomend', this, function() {
		// select the current map scale, if it is in the list
		var scale = this.map.getScale();
		var scaleRecords = this.scalesCombo.getStore().queryBy(function(record) {
			return Math.abs(scale-record.get('zoomLevel')) < 1;
		});
		if (scaleRecords.length > 0) {
			scaleRecord = scaleRecords.items[0];
			this.scalesCombo.setValue(scaleRecord.get('name'));
		} else {
			if (!this.scalesCombo.rendered) {
				return;
			}
			this.scalesCombo.setValue("1:"+this.addThousandSeparator(Math.floor(scale), '.'));
		}
		
		var projection = this.getMapProjection();
		// select initial projection
		this.projectionsCombo.setValue(projection.getCode());
		
	});
	this.scalesCombo.on('select', function(comboBox, record, index) {
		this.map.zoomToScale(record.get('zoomLevel'), true);
	}, this);
	this.map.events.triggerEvent("zoomend");

	// add areas
	if (this.viewConfig.hasAreasList) {
		var areaCategories = de.ingrid.mapclient.Configuration.getValue('areaCategories');
		if (areaCategories) {
			for (var i=0, count=areaCategories.length; i<count; i++) {
				var category = areaCategories[i];

				var combo = new Ext.form.ComboBox({
					fieldLabel: i18n(category.name),
					triggerAction: 'all',
					mode: 'local',
					store: new Ext.data.ArrayStore({
						autoDestroy: true,
						fields: [{
							name: 'name',
							type: 'string'
						}, {
							name: 'area',
							type: 'string'
						}]
					}),
					valueField: 'area',
					displayField: 'name',
					editable: false
				});
				combo.on('expand', function(){
					self.ctrls['keyboardControl'].deactivate();
				});
				combo.on('collapse', function(){
					self.ctrls['keyboardControl'].activate();
				});					
				var areas = category.areas;
				// convert item objects into record arrays
				var records = [];
				for (var j=0, count2=areas.length; j<count2; j++) {
					var area = areas[j];
					var record = [area.name, Ext.encode({'north': areas[j].north, 'east': areas[j].east, 'south': areas[j].south, 'west': areas[j].west})];
					records.push(record);
				};
				combo.store.loadData(records);

				// define select callback
				combo.on('select', function(comboBox, record, index) {
					// change map extend
					var area = Ext.decode(record.get('area'));
					var bounds = new OpenLayers.Bounds.fromArray([area.west, area.south, area.east, area.north]);
					bounds.transform(new OpenLayers.Projection("EPSG:4326"), this.getMapProjection());
					this.map.zoomToExtent(bounds, true);
					this.resetAreaComboBoxes(comboBox);
				}, this);

				this.windowContent.add(combo);
				this.areaComboBoxes.add(category.name, combo);
			}
		}
	}
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

