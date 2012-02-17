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
	width: 250,
	autoHeight: true,
	shadow: false,
	initHidden: false,

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
		fieldLabel: 'Ma&szlig;stab',
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
		if (Proj4js.defs[newProjCode] == undefined) {
			// if the projection is not defined yet, we have to load the definition
			this.loadProjectionDef(newProjCode, function() {
				// change the projection after loading the definition
				self.changeProjection(newProjCode);
			});
		}
		else {
			// change the projection directly
			this.changeProjection(newProjCode);
		}
	}, this);

	// initialize the scales list
	var scales = de.ingrid.mapclient.Configuration.getValue('scales');
	de.ingrid.mapclient.data.StoreHelper.load(this.scalesCombo.getStore(), scales, ['name', 'zoomLevel']);

	// bind scales list to map
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
			this.scalesCombo.clearValue();
		}
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
	
	var oldProjection = this.getMapProjection();
	var newProjection = new OpenLayers.Projection(newProjCode);
	var newMaxExtent = this.getMaxExtent(newProjection);
	var newExtent = this.map.getExtent().clone().transform(oldProjection, newProjection);
	var viewSize = this.map.getSize();
    var idealMaxResolution = Math.max( newMaxExtent.getWidth()  / viewSize.w,
    		newMaxExtent.getHeight() / viewSize.h );
    console.debug("New maxResolution: " + idealMaxResolution);
	var options = {
		maxExtent: newMaxExtent,
		projection: newProjection.getCode(),
		units: newProjection.getUnits(),
		maxResolution: 'auto'
	};

	// reset map
	this.map.setOptions(options);
	// reset layers
	for(var i=0,len=this.map.layers.length; i<len; i++) {
		this.map.layers[i].addOptions(options);
	}
	// reproject map.layerContainerOrigin, in case the next
	// call to moveTo does not change the zoom level and
	// therefore centers the layer container
	if(this.map.layerContainerOrigin) {
		this.map.layerContainerOrigin.transform(oldProjection, newProjection);
	}
	this.map.zoomToExtent(newExtent);
	
	
    this.map.displayProjection = newProjection;
    
    var control = null;
    if (this.controls) {
        for (var k = 0; k < this.controls.length; k++) {
            control = this.controls[k];
            if (control.displayProjection) {
                control.displayProjection = newProjection;
            }
            if (control instanceof OpenLayers.Control.OverviewMap) {
            	// reset map
            	var newExtent = control.ovmap.getExtent().clone().transform(oldProjection, newProjection);
            	control.ovmap.setOptions(options);
            	control.ovmap.baseLayer.addOptions(options);            	
            	control.ovmap.zoomToExtent(newExtent);
            }
            if (control.redraw) {
                control.redraw();
            }
        }

    } else {
        for (var i = 0; i < this.map.controls.length; i++) {
            control = this.map.controls[i];
            if (control.displayProjection) {
                control.displayProjection = newProjection;
            }
            if (control instanceof OpenLayers.Control.OverviewMap) {
            	// reset map
            	var newExtent = control.ovmap.getExtent().clone().transform(oldProjection, newProjection);
            	control.ovmap.setOptions(options);            	
            	control.ovmap.baseLayer.addOptions(options);            	
            	control.ovmap.zoomToExtent(newExtent);
            }
            if (control.redraw) {
                control.redraw();
            }
        }
    } 	
	
};

/**
 * Get the configured maximal extent transformed by a projection.
 * 
 * @param protection A projection.
 * @return OpenLayers.Bounds instance
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.getMaxExtent = function(protection) {
	var wgs84Proj = new OpenLayers.Projection("EPSG:4326");
	var bbox = de.ingrid.mapclient.Configuration.getValue("mapExtend");
	var bounds = new OpenLayers.Bounds.fromArray([bbox.west, bbox.south, bbox.east, bbox.north]);
	var extent = bounds.transform(wgs84Proj, protection);
	return extent;
};



/**
 * Load the projection definition for the given projection
 * @param newProjCode EPSG code
 * @param callback Function to call after loading
 */
de.ingrid.mapclient.frontend.controls.SettingsDialog.prototype.loadProjectionDef = function(newProjCode, callback) {
	var codeNumber = newProjCode.replace(/^EPSG:/, '');
	Ext.Ajax.request({
		url: de.ingrid.mapclient.PROJ4S_DEFS_URL+'/'+codeNumber,
		method: 'GET',
		success: function(response, request) {
			// we expect the projection definition in js
			var defJs = response.responseText;
			var regexp = new RegExp('^Proj4js\\.defs\\["'+newProjCode+'"] = ');
			if (defJs && defJs.match(regexp)) {
				// evaluate the js in order to define the projection
				eval(response.responseText);
			}
			if (callback instanceof Function) {
				callback();
			}
		},
		failure: function(response, request) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_PROJECTION_FAILURE);
		}
	});
};
