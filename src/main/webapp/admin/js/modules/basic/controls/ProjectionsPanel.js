/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class ProjectionsPanel is used to manage a list of map projections.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel', { 
	extend: 'Ext.panel.Panel',
	id: 'projectionsPanel',
	title: 'Raumbezugssysteme',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,
	autoScroll: true,
	bodyPadding: 10,
	
	/**
	 * The ArrayStore for the projections
	 */
	projectionsStore: Ext.create('Ext.data.ArrayStore', {
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
		sortable: false,
		dataIndex: 'name',
		editor: {
		   xtype: 'textfield',
		   allowBlank: false,
		   labelAlign: 'top',
		   labelSeparator: '',
		   labelStyle: 'padding-bottom:5px;',
		   columnWidth: 0.95
		},
		flex:1
	}, {
		header: 'EPSG Code',
		sortable: false,
		dataIndex: 'epsgCode',
		editor: {
		   xtype: 'textfield',
		   allowBlank: false,
		   labelAlign: 'top',
		   labelSeparator: '',
		   labelStyle: 'padding-bottom:5px;',
		   columnWidth: 0.95
		},
		flex:1
	}],

	/**
	 * The grid that maintains the projections
	 */
	projectionsGrid: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;

		// create the projections grid
		this.projectionsGrid = Ext.create('de.ingrid.mapclient.admin.controls.GridPanel', {
			store: this.projectionsStore,
			columns: this.columns,
			dropBoxTitle:'Raumbezugsystem l&ouml;schen'
			
		});

		// listen to changes in the grid
		this.projectionsGrid.on('datachanged', function(e) {
			self.saveProjections();
		});

		// create the final layout
		Ext.apply(this, {
			items: [this.projectionsGrid]
		});
		de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		// initialize the projections list
		var projections = de.ingrid.mapclient.Configuration.getValue('projections');
		de.ingrid.mapclient.data.StoreHelper.load(this.projectionsStore,
				projections, ['name', 'epsgCode']);
		de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel.superclass.onRender.apply(this, arguments);
	},
	/**
	 * Save the projections list on the server
	 */
	saveProjections: function() {
		var projections = [];
		this.projectionsStore.each(function(record) {
			projections.push({name: record.get('name'), epsgCode: record.get('epsgCode')});
		});
		de.ingrid.mapclient.Configuration.setValue('projections', Ext.encode(projections), de.ingrid.mapclient.admin.DefaultSaveHandler);
	}
});