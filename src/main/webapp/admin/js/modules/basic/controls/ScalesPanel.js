/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class ScalesPanel is used to manage a list of scales.
 */
de.ingrid.mapclient.admin.modules.basic.ScalesPanel = Ext.extend(Ext.Panel, {

	title: 'Ma&szlig;st&auml;be',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,

	/**
	 * The ArrayStore for the scales
	 */
	scalesStore: new Ext.data.ArrayStore({
		autoDestroy: true,
		fields: [{
			name: 'name',
			type: 'string'
		}, {
			name: 'zoomLevel',
			type: 'string'
		}]
	}),

	/**
	 * The column configuration
	 */
	columns: [{
		header: 'Name',
		sortable: true,
		dataIndex: 'name',
		editor: {
		   xtype: 'textfield',
		   allowBlank: false
		}
	}, {
		header: 'Zoom Stufe',
		sortable: true,
		dataIndex: 'zoomLevel',
		editor: {
		   xtype: 'scalefield'
		}
	}],

	/**
	 * The grid that maintains the scales
	 */
	scalesGrid: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.ScalesPanel.prototype.initComponent = function() {

	var self = this;

	// create the scales grid
	this.scalesGrid = new de.ingrid.mapclient.admin.controls.GridPanel({
		store: this.scalesStore,
		columns: this.columns,
		dropBoxTitle:'Ma&szlig;stab l&ouml;schen'
	});

	// listen to changes in the grid
	this.scalesGrid.on('datachanged', function(e) {
		self.saveScales();
	});

	// create the final layout
	Ext.apply(this, {
		items: this.scalesGrid
	});
	de.ingrid.mapclient.admin.modules.basic.ScalesPanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.ScalesPanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.basic.ScalesPanel.superclass.onRender.apply(this, arguments);

	// initialize the scales list
	var scales = de.ingrid.mapclient.Configuration.getValue('scales');
	de.ingrid.mapclient.data.StoreHelper.load(this.scalesStore, scales, ['name', 'zoomLevel']);
};

/**
 * Save the .scales list on the server
 */
de.ingrid.mapclient.admin.modules.basic.ScalesPanel.prototype.saveScales = function() {
	var scales = [];
	this.scalesStore.each(function(record) {
		scales.push({name: record.get('name'), zoomLevel: record.get('zoomLevel')});
	});
	de.ingrid.mapclient.Configuration.setValue('scales', Ext.encode(scales), de.ingrid.mapclient.admin.DefaultSaveHandler);
};

