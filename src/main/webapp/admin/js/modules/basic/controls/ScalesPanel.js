/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class ScalesPanel is used to manage a list of scales.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.ScalesPanel', { 
	extend: 'Ext.Panel',
	id: 'scalesPanel',
	title: 'Ma&szlig;st&auml;be',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,
	autoScroll: true,
	bodyPadding: 10,
	
	/**
	 * The ArrayStore for the scales
	 */
	scalesStore: Ext.create('Ext.data.ArrayStore', {
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
		header: 'Zoom Stufe',
		sortable: false,
        dataIndex: 'zoomLevel',
		editor: {
		   xtype: 'scalefield',
		   labelAlign: 'top',
		   labelSeparator: '',
		   labelStyle: 'padding-bottom:5px;',
		   columnWidth: 0.95
		},
		flex:1
	}],

	/**
	 * The grid that maintains the scales
	 */
	scalesGrid: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {

		var self = this;

		// create the scales grid
		this.scalesGrid = Ext.create( 'de.ingrid.mapclient.admin.controls.GridPanel', {
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
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		de.ingrid.mapclient.admin.modules.basic.ScalesPanel.superclass.onRender.apply(this, arguments);

		// initialize the scales list
		var scales = de.ingrid.mapclient.Configuration.getValue('scales');
		de.ingrid.mapclient.data.StoreHelper.load(this.scalesStore, scales, ['name', 'zoomLevel']);
	},
	/**
	 * Save the .scales list on the server
	 */
	saveScales: function() {
		var scales = [];
		this.scalesStore.each(function(record) {
			scales.push({name: record.get('name'), zoomLevel: record.get('zoomLevel')});
		});
		de.ingrid.mapclient.Configuration.setValue('scales', Ext.encode(scales), de.ingrid.mapclient.admin.DefaultSaveHandler);
	}
});