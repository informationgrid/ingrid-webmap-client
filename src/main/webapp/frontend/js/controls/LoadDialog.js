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
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class LoadDialog is the dialog used for loading a previously saved map
 *		state.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.LoadDialog', {
	extend: 'Ext.Window',
	id: 'loadDialog',
	title: i18n('tKarteLaden'),
	layout: {
	    type: 'vbox',
	    pack: 'start',
	    align: 'stretch'
	},
	closable: true,
	draggable: true,
	resizable: true,
	width: 600,
	autoScroll: true,
	autoHeight: true,
	shadow: false,
	initHidden: false,
	modal: true,
	constrain: true,
	
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
	fileList: null,
	/**
	 * Initialize the component (called by Ext)
	*/
	initComponent: function() {
		var self = this;
		var store = Ext.create('Ext.data.ArrayStore', {
			fields: ['id', 'shortUrl', 'emailUrl', 'title', 'description',
					 {name: 'date', type: 'date', dateFormat: 'Y-m-d H:i:s'}
			],
			sorters: [{
			    property: 'date',
			    direction: 'DESC'
			}]
		});

		// load the data for the store
		this.session.list({
			success: function(responseText) {
				if (responseText.length > 0) {
					// decode from JSON
					var list = Ext.decode(responseText);
					store.loadData(list);
				}
			},
			failure: function(responseText) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.MAP_LIST_FAILURE);
			}
		});

		this.fileList = Ext.create('Ext.grid.Panel', {
			store: store,
			multiSelect: false,
			height: 300,
			frame: true,
			stripeRows: true,
			viewConfig: {
				forceFit: true,
				emptyText: i18n('tKeineKartenVorhanden')
			},
			flex: 1,
			columns: [{
				id: 'title',
				header: i18n('tTitle'),
				sortable: true,
				dataIndex: 'title',
				flex: 1
			}, {
				id: 'description',
				header: i18n('tBeschreibung'),
				sortable: true,
				renderer: function (val) {
					return '<div style="white-space:normal !important;">'+val+'</div>';
				},
				dataIndex: 'description',
				flex: 1
			}, {
				id: 'date',
				header: i18n('tDatum'),
				sortable: true,
				renderer: Ext.util.Format.dateRenderer('d.m.Y H:i:s'),
				dataIndex: 'date',
				flex: 1
			},
	        {
	            xtype: 'actioncolumn',
	            css:"padding:0 0 0 5px;",
				items: [{
		                icon   : '/ingrid-webmap-client/shared/images/link_go.png',
		                tooltip: i18n('tLoadDialogLink'),
		                handler: function(grid, rowIndex, colIndex) {
		                	var record = grid.getStore().getAt(rowIndex);
		        			var url = de.ingrid.mapclient.Configuration.getProperty('frontend.shortUrlBase')+"?mapUrl="+record.get('shortUrl');
		        			window.open(url);
		                }
	            	},
	                {
		                icon   : '/ingrid-webmap-client/shared/images/icon_mail.png',
		                tooltip: i18n('tLoadDialogMail'),
		                handler: function(grid, rowIndex, colIndex) {
		                	var record = grid.getStore().getAt(rowIndex);
		        			var location = window.location.origin;
		        			if(location === undefined){
		        				location = window.location.protocol + "//" +window.location.host;
		        			}
		        			var url = location + ''+ de.ingrid.mapclient.Configuration.getProperty('frontend.shortUrlBase')+"?mapUrl="+record.get('shortUrl');
		        			window.location.href ='mailto:?body=' + url + '&subject=' +  i18n('tMailToMapLink');
		                },
		                iconCls:'loadingDialogIcon',
		                getClass: function(v, meta, rec) {
		                	if(!de.ingrid.mapclient.Configuration.getSettings("defaultMailToSaveMaps")){
		                		return 'x-hide-display';
		                	} 
		                }
	                },
	                {
		                icon   : '/ingrid-webmap-client/shared/images/icon_delete.png',
		                tooltip: i18n('tLoadDialogDelete'),
		                handler: function(grid, rowIndex, colIndex) {
		                	if (confirm(i18n('tSollDieKarteGeloeschtWerden'))) {
		        				var record = grid.getStore().getAt(rowIndex);
		        				var state = new de.ingrid.mapclient.frontend.data.SessionState({
		        					id: record.get("id")
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
	                }],
					flex: 1
	        }]
		});

		var windowContent = Ext.create('Ext.form.Panel', {
			border: false,
			bodyStyle: 'padding: 10px',
			labelAlign: 'top',
			flex: 1,
			items: [ this.fileList ],
			dockedItems: [{
			    xtype: 'toolbar',
			    dock: 'bottom',
			    ui: 'footer',
			    cls : 'dialogToolbarBottom',
			    defaults: {minWidth: 75},
			    items: [
			        '->',
			        {
						text: i18n('tLaden'),
						handler: function(btn) {
							self.loadPressed = true;
							self.close();
						}
					}, {
						text: i18n('tAbbrechen'),
						handler: function(btn) {
							self.close();
						}
					}
			    ]
			}]
		});

		Ext.apply(this, {
			items: windowContent
		});

		this.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		this.superclass.onRender.apply(this, arguments);
	},

	/**
	 * Check if the user pressed the load button
	 *
	 * @returns Boolean
	 */
	isLoad: function() {
		return this.loadPressed;
	},
	
	/**
	 * Get the id of the selected file
	 *
	 * @returns String
	 */
	getFileId: function() {
		var selModel = this.fileList.getSelectionModel();
		if (selModel && selModel.hasSelection) {
			var selected = selModel.getSelection();
			if(selected){
				if(selected.length > 0){
					return selected[0].get("id");
				}
			}
		}
		return "";
	}
});
