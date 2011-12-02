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
	 * @cfg de.ingrid.mapclient.frontend.data.Session instance
	 */
	session: null,

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

	var self = this;

	var store = new Ext.data.JsonStore({
		autoLoad: false,
		autoDestroy: true,
	    // reader configs
	    root: 'files',
	    idProperty: 'id',
	    fields: ['id', 'shortUrl', 'title', 'description',
	             {name: 'date', type: 'date', dateFormat: 'Y-m-d H:i:s'}
	    ],
	    sortInfo: {
			field: 'date',
			direction: 'DESC'
	    }
	});

	// load the data for the store
	this.session.list({
		success: function(responseText) {
			if (responseText.length > 0) {
				// decode from JSON
				var list = Ext.decode(responseText);
				var data = {
					files: list,
					totalCount: list.length
				};
				store.loadData(data);
			}
		},
		failure: function(responseText) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.MAP_LIST_FAILURE);
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
			id: 'title',
			header: 'Titel',
			width: 25,
			sortable: true,
			dataIndex: 'title'
		}, {
			id: 'description',
			header: 'Beschreibung',
			width: 45,
			sortable: true,
			renderer: function (val) {
			    return '<div style="white-space:normal !important;">'+val+'</div>';
			},
			dataIndex: 'description'
		}, {
			id: 'date',
			header: 'Datum',
			width: 20,
			sortable: true,
			renderer: Ext.util.Format.dateRenderer('d.m.Y H:i:s'),
			dataIndex: 'date'
		}, {
			id: 'shortUrl',
			header: '',
			width: 5,
			sortable: false,
			renderer: function(val) {
				return '<div class="icon iconLink" style="cursor:pointer;" title="link"></div>';
			},
			dataIndex: 'shortUrl'
		}, {
			id: 'delete',
			header: '',
			width: 5,
			sortable: false,
			renderer: function(val) {
				return '<div class="icon iconRemove" style="cursor:pointer;" title="löschen"></div>';
			},
			dataIndex: 'delete'
		}]
	});
	// button handler
	this.fileList.on('cellclick', function(grid, rowIndex, columnIndex, e) {
		if (columnIndex == grid.getColumnModel().getIndexById('shortUrl')) {
			var record = grid.getStore().getAt(rowIndex);
			var url = de.ingrid.mapclient.Configuration.getProperty('frontend.shortUrlBase')+record.get('shortUrl');
			Ext.Msg.show({
			   title: 'Kurz-URL',
			   msg: url,
			   icon: Ext.MessageBox.INFO
			});
		}
		if (columnIndex == grid.getColumnModel().getIndexById('delete')) {
			if (confirm("Soll die Karte wirklich gelöscht werden?")) {
				var record = grid.getStore().getAt(rowIndex);
				var state = new de.ingrid.mapclient.frontend.data.SessionState({
					id: record.id
				});
				self.session.remove(state, {
					success: function(response, request) {
						self.fileList.getStore().remove(record);
					},
					failure: function(response, request) {
						de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.MAP_DELETE_FAILURE);
					}
				});
			}
		}
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
