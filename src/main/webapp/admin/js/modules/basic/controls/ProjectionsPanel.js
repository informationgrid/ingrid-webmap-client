/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class ProjectionsPanel is used to manage a list of map projections.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.ProjectionsPanel', { 
	extend: 'Ext.panel.Panel',
	id: 'projectionsPanel',
	title: 'Raumbezugssysteme',
	layout: {
	    type: 'vbox',
	    pack: 'start',
	    align: 'stretch'
	},
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
		    id: 'spatialNameInput',
		    xtype: 'textfield',
		    allowBlank: false,
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
		    id: 'spatialEpsgInput',
		    xtype: 'textfield',
		    allowBlank: false,
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
