/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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
 * @class ScalesPanel is used to manage a list of scales.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.ScalesPanel', { 
	extend: 'Ext.Panel',
	id: 'scalesPanel',
	title: 'Ma&szlig;st&auml;be',
	layout: {
	    type: 'vbox',
	    pack: 'start',
	    align: 'stretch'
	},
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
		    id: 'scaleNameInput',
		    xtype: 'textfield',
		    allowBlank: false,
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
		    id: 'scaleZoomInput',
		    xtype: 'scalefield',
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
