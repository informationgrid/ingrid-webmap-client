/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");

/**
 * @class ServicePanel is used to manage a list of map projections.
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel = Ext.extend(Ext.Panel, {

	title: 'Dienste',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,

	/**
	 * The ArrayStore for the services
	 */
	serviceStore: new Ext.data.ArrayStore({
		autoDestroy: true,
		fields: [{
			name: 'name',
			type: 'string'
		}, {
			name: 'capabilitiesUrl',
			type: 'string'
		}, {
			name: 'category',
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
		header: 'URL',
		sortable: true,
		dataIndex: 'capabilitiesUrl',
		editor: {
		   xtype: 'textfield',
		   allowBlank: false
		}
	}, {
		header: 'Kategorien',
		sortable: true,
		dataIndex: 'category',
		editor: {
		   xtype: 'textfield',
		   allowBlank: false
		}
	}],
	serviceGrid: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.initComponent = function() {
	
	var self = this;

	// create the scales grid
	this.serviceGrid = new de.ingrid.mapclient.admin.controls.GridPanel({
		store: this.serviceStore,
		columns: this.columns
	});
	
	// create the final layout
	Ext.apply(this, {
		items: this.serviceGrid
	});
	de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.superclass.onRender.apply(this, arguments);

	// initialize the projections list
	var services = de.ingrid.mapclient.Configuration.getValue('serviceCategories');
	de.ingrid.mapclient.data.StoreHelper.load(this.serviceStore,
			services, ['name', 'capabilitiesUrl', 'name']);
};

/**
 * Save the services list on the server
 */
de.ingrid.mapclient.admin.modules.maintenance.ServicePanel.prototype.saveServices = function() {
	
};

