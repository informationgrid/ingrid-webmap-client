/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class LoadDialog is the dialog used for loading a previously saved map
 *        state.
 */
de.ingrid.mapclient.frontend.controls.LoadDialog = Ext.extend(Ext.Window, {
	title: "Karte laden",
	closable: true,
	draggable: true,
	resizable: true,
	width: 600,
	autoHeight: true,
	shadow: false,
	initHidden: false,
	modal: true,

	/**
	 * @cfg The id of the user, whose data should be retrieved
	 */
	userId: null,

	/**
	 * Signals if the load button was pressed
	 */
	loadPressed: false,

	/**
	 * File list
	 */
	fileList: null
});

/**
 * Check if the user pressed the load button
 *
 * @returns Boolean
 */
de.ingrid.mapclient.frontend.controls.LoadDialog.prototype.isLoad = function() {
	return this.loadPressed;
};

/**
 * Get the id of the selected file
 *
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.LoadDialog.prototype.getFileId = function() {
	var selModel = this.fileList.getSelectionModel();
	if (selModel && selModel.hasSelection) {
		var selected = selModel.getSelected();
		return selected.id;
	}
	return "";
};

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.LoadDialog.prototype.initComponent = function() {

	var store = new Ext.data.JsonStore({
		autoLoad: false,
		autoDestroy: true,
	    // reader configs
	    root: 'files',
	    idProperty: 'id',
	    fields: ['id', 'title', 'description',
	             {name: 'date', type: 'date', dateFormat: 'Y-m-d H:i:s'}
	    ],
	    sortInfo: {
			field: 'date',
			direction: 'DESC'
	    }
	});

	// load the data for the store
	Ext.Ajax.request({
		url: de.ingrid.mapclient.USER_DATA_URL + "/" + this.userId,
		method: 'GET',
		success: function(response, request) {
			if (response.responseText.length > 0) {
				// decode from JSON
				var list = Ext.decode(response.responseText);
				var data = {
					files: list,
					totalCount: list.length
				};
				store.loadData(data);
			}
		},
		failure: function(response, request) {
		}
	});

	this.fileList = new Ext.grid.GridPanel({
		store: store,
		multiSelect: false,
		height: 300,
		viewConfig: {
			forceFit: true,
			emptyText: 'Keine Karten vorhanden'
		},
		columns: [{
			header: 'Titel',
			width: 25,
			sortable: true,
			dataIndex: 'title'
		}, {
			header: 'Beschreibung',
			width: 50,
			sortable: true,
			dataIndex: 'description',
			renderer: function (val) {
			    return '<div style="white-space:normal !important;">'+val+'</div>';
			}
		}, {
			header: 'Datum',
			width: 20,
			sortable: true,
			renderer: Ext.util.Format.dateRenderer('d.m.Y H:i:s'),
			dataIndex: 'date'
		}, {
			header: '',
			width: 5,
			sortable: false,
			renderer: function(val) {
				return '<div class="icon iconRemove" style="cursor:pointer;" title="löschen"></div>';
			},
			dataIndex: '*'
		}]
	});

	var self = this;
	var windowContent = new Ext.FormPanel({
		border: false,
		bodyStyle: 'padding: 10px',
		labelAlign: 'top',
		defaults: {
			anchor: '100%'
		},
		items: [ this.fileList ],
		buttons: [{
			text: 'Laden',
			handler: function(btn) {
				self.loadPressed = true;
				self.close();
			}
		}, {
			text: 'Abbrechen',
			handler: function(btn) {
				self.close();
			}
		}]
	});

	Ext.apply(this, {
		items: windowContent
	});

	de.ingrid.mapclient.frontend.controls.LoadDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.LoadDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.LoadDialog.superclass.onRender.apply(this, arguments);
};
