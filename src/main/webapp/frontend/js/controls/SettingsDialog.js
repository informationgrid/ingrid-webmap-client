/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class SettingsDialog is the dialog for configuring the map view.
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog = Ext.extend(Ext.Window, {
	title: "Erweiterte Einstellungen",
	closable: false,
	draggable: true,
	resizable: false,
	constrain: true,
	collapsible: true,
	collapsed: true,
	expandOnShow: false,
	width: 200,
	autoHeight: true,
	shadow: false,
	initHidden: false,

	windowContent: null,

	/**
	 * @cfg map The OpenLayers.Map instance to adjust
	 */
	map: null,

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

	// register the baselayer change handler
	this.map.events.on({
		'changebaselayer': this.onBaseLayerChange,
	    scope: this
	});

	this.projectionsCombo = new Ext.form.ComboBox({
		fieldLabel: 'Raumbezugssystem',
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

	this.scalesCombo = new Ext.form.ComboBox({
		fieldLabel: 'Maﬂstab',
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

	this.windowContent = new Ext.FormPanel({
		border: false,
		bodyStyle: 'padding: 10px',
		labelAlign: 'top',
		labelSeparator: '',
		defaults: {
			xtype: 'combo'
		},
		items: [ this.projectionsCombo, this.scalesCombo ]
	});

	Ext.apply(this, {
		items: this.windowContent
	});

	de.ingrid.mapclient.frontend.controls.SettingsDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.SettingsDialog.superclass.onRender.apply(this, arguments);

	// prevent dragging the underlying map
	this.getEl().swallowEvent('mousedown', false);

	// initialize the projections list
	var projections = de.ingrid.mapclient.Configuration.getValue('projections');
	de.ingrid.mapclient.data.StoreHelper.load(this.projectionsCombo.getStore(),
			projections, ['name', 'epsgCode']);
	var projection = this.getMapProjection();
	// select initial projection
	this.projectionsCombo.setValue(projection.getCode());
	// define select callback
	this.projectionsCombo.on('select', function(comboBox, record, index) {

		// create a new baselayer and trigger the baselayer change event
		// as suggested in http://www.mail-archive.com/users@geoext.org/msg01704.html
		var oldProj = this.getMapProjection();
		var newProj = new OpenLayers.Projection(record.get('epsgCode'));

		var oldBaseLayer = this.map.baseLayer;
		var newBaseLayer = new OpenLayers.Layer.WMS(
			oldBaseLayer.name,
			oldBaseLayer.url, {
				layers: oldBaseLayer.name,
				format: "image/png"
			}, {
				maxResolution: "auto",
				minResolution: "auto",
				//maxExtent: this.map.maxExtent.transform(oldProj, newProj),
				// TODO: the next two values should be derived from the projection
				maxExtent: new OpenLayers.Bounds.fromArray([-20037508.34, -20037508.34, 20037508.34, 20037508.34]),
				units: 'm',
				numZoomLevels: 16,
				projection: newProj,
				isBaseLayer: true
			}
		);
		this.map.removeLayer(oldBaseLayer);
		this.map.addLayer(newBaseLayer);
	}, this);

	// initialize the scales list
	var scales = de.ingrid.mapclient.Configuration.getValue('scales');
	de.ingrid.mapclient.data.StoreHelper.load(this.scalesCombo.getStore(),
			scales, ['name', 'zoomLevel']);
	// TODO: select initial scale
	// define select callback
	this.scalesCombo.on('select', function(comboBox, record, index) {
		// change map scale
		this.map.zoomToScale(record.get('zoomLevel'), true);
	}, this);

	// add areas
	var areaCategories = de.ingrid.mapclient.Configuration.getValue('areaCategories');
	if (areaCategories) {
		for (var i=0, count=areaCategories.length; i<count; i++) {
			var category = areaCategories[i];

			var combo = new Ext.form.ComboBox({
				fieldLabel: category.name,
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
};

/**
 * Get the current projection of the map
 * @return OpenLayers.Projection instance
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.getMapProjection = function() {
	return (this.map.projection && this.map.projection instanceof OpenLayers.Projection) ? this.map.projection : new OpenLayers.Projection(this.map.projection);
};

/**
 * Reset all area comboboxes and scale combobox (except the one given)
 * @param exception Ext.form.ComboBox instance that should not be reseted
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.resetAreaComboBoxes = function(exception) {
	this.scalesCombo.clearValue();
	this.areaComboBoxes.each(function(item) {
		if (item != exception) {
			item.clearValue();
		}
	});
};

/**
 * Callback for baselayer change in map, used to change the projection
 * code from: http://www.mail-archive.com/users@geoext.org/msg01704.html
 * @param event
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.onBaseLayerChange = function(event) {
   var mapProj, baseProj, newBase, reproject;
   newBase = event.layer;
   mapProj = (this.map.projection && this.map.projection instanceof OpenLayers.Projection) ? this.map.projection : new OpenLayers.Projection(this.map.projection);
   baseProj = newBase.projection;
   reproject = !(baseProj.equals(mapProj));
   if (reproject) {
      var center, maxExt;
      //calc proper reporojected center
      center = this.map.getCenter().transform(mapProj, baseProj);
      //calc correct reprojected extents
      maxExt = newBase.maxExtent;
      //set map projection, extent, & center of map to proper values
      this.map.projection = baseProj;
      this.map.maxExtent = maxExt;
      this.map.setCenter(center);
   }
};