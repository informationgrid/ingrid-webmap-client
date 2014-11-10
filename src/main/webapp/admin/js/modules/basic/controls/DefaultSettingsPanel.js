/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
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
 * @class DefaultSettingsPanel is used to manage a list of scales.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel', { 
	extend:'Ext.form.Panel',
	id: 'defaultSettingsPanel',
	title: 'Benutzeroberfl&auml;che',
	layout: {
	    type: 'vbox',
	    pack: 'start',
	    align: 'stretch'
	},
	border: false,
	autoScroll: true,
	bodyPadding: 10,
	settingsStore: {},
	grid: null,
	propertyNames: {},
	gridSearch: null,
	settingsStoreSearch: {},
	propertyNamesSearch: {},
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;	

		// create the viewer grid
		this.grid = Ext.create('Ext.grid.property.Grid', {
			id:'gridDefaultSettingsPanel',
			title: 'Kartenviewer',
		    autoHeight: true,
	        source:  this.settingsStore,
	        forceFit: true,
	        sortableColumns: false,
	        nameColumnWidth: 700
		});

		// create the searcher grid
		this.gridSearch = Ext.create('Ext.grid.property.Grid', {
			id:'gridSearchDefaultSettingsPanel',
			title: 'Suche',
		    autoHeight: true,
	        source:  this.settingsStoreSearch,
	        forceFit: true,
	        sortableColumns: false,
	        nameColumnWidth: 700
		});
		
		var form = Ext.create('Ext.panel.Panel', {
			border: false,
			items:[
		        this.grid,
		        {
					xtype: 'container',
					height: 20
		        },
			    this.gridSearch,
		    ]
		});
		
		// create the final layout
		Ext.apply(this, {
			items: form,
			buttons: [{
				xtype: 'button',
				id:'btnSaveDefaultSettingsPanel',
				text: 'Einstellungen speichern',
				handler: function() {
					self.saveSettings();
				}
            }]
		});
		de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		// initialize the settings list
		var settings = de.ingrid.mapclient.Configuration.getValue('settings');
		if(settings){
			for (var i=0, count=settings.length; i<count; i++) {
				var setting = settings[i];
				var key = setting.key;
				var value = setting.value;
				
				// Check if boolean value
				if (value.toLowerCase()=='false'){
					value = false;
				} else if (value.toLowerCase()=='true'){
				    value =  true;
				}
				
				if(setting.group == "view"){
					this.settingsStore[key] = value;
					var displayName = {};
					displayName["displayName"] = setting.name;
					this.propertyNames[key] = displayName;
				}else if (setting.group == "search"){
					this.settingsStoreSearch[key] = value;
					var displayName = {};
					displayName["displayName"] = setting.name;
					this.propertyNamesSearch[key] = displayName;
				}
			}
			this.grid.setSource(this.settingsStore, this.propertyNames);
			this.gridSearch.setSource(this.settingsStoreSearch, this.propertyNamesSearch);
		}
		de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel.superclass.onRender.apply(this, arguments);
	},
	/**
	 * Save the settings list on the server
	 */
	saveSettings: function() {
		var settings = [];
		settings.push(this.settingsStore);
		settings.push(this.settingsStoreSearch);
		de.ingrid.mapclient.Configuration.setValue('settings', Ext.encode(settings), de.ingrid.mapclient.admin.DefaultSaveHandler);
	}
});