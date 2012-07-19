/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class ProjectionsPanel is used to manage a list of map projections.
 */
de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel = Ext.extend(Ext.Panel, {

	title: 'Raumbezugsysteme',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,

	/**
	 * The ArrayStore for the projections
	 */
	projectionsStore: new Ext.data.ArrayStore({
		autoDestroy: true,
		fields: [{
			name: 'name',
			type: 'string'
		}, {
			name: 'epsgCode',
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
		header: 'EPSG Code',
		sortable: true,
		dataIndex: 'epsgCode',
		editor: {
		   xtype: 'textfield',
		   allowBlank: false
		}
	}],

	/**
	 * The grid that maintains the projections
	 */
	projectionsGrid: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel.prototype.initComponent = function() {

	var self = this;

	// create the projections grid
	this.projectionsGrid = new de.ingrid.mapclient.admin.controls.GridPanel({
		store: this.projectionsStore,
		columns: this.columns
	});

	// listen to changes in the grid
	this.projectionsGrid.on('datachanged', function(e) {
		self.saveProjections();
	});

	// create the final layout
	Ext.apply(this, {
		items: this.projectionsGrid
	});
	de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel.superclass.onRender.apply(this, arguments);

	// initialize the projections list
	var projections = de.ingrid.mapclient.Configuration.getValue('projections');
	de.ingrid.mapclient.data.StoreHelper.load(this.projectionsStore,
			projections, ['name', 'epsgCode']);
};

/**
 * Save the projections list on the server
 */
de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel.prototype.saveProjections = function() {
	var projections = [];
	this.projectionsStore.each(function(record) {
		projections.push({name: record.get('name'), epsgCode: record.get('epsgCode')});
	});
	de.ingrid.mapclient.Configuration.setValue('projections', Ext.encode(projections), de.ingrid.mapclient.admin.DefaultSaveHandler);
};

