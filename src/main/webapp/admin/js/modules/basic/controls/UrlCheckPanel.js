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
 * @class UrlCheckPanel is used to manage a list of scales.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel', { 
	extend:'Ext.form.Panel',
	id: 'urlCheckPanel',
	title: 'URL-Check',
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
	gridUrlCheck: null,
	settingsStoreUrlCheck: {},
	propertyNamesUrlCheck: {},
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {

		var self = this;	

		// create the searcher grid
		this.gridUrlCheck = Ext.create('Ext.grid.property.Grid', {
			id: 'gridUrlCheckUrlCheckPanel',
			title: 'URL-Check',
		    autoHeight: true,
	        source:  this.settingsStoreUrlCheck,
            forceFit: true,
	        sortableColumns: false,
	        nameColumnWidth: 700
		});

		delete this.gridUrlCheck.getStore().sortInfo;
		
		// create the final layout
		Ext.apply(this, {
			items: [
		        this.gridUrlCheck,
		        {
					xtype: 'container',
					height: 10
		        }
	        ],
	        buttons:[{
				xtype: 'button',
				id:'btnSaveUrlCheckPanel',
				text: 'Einstellungen speichern',
				anchor: '100%',
				handler: function() {
					self.saveSettings();
				}
            }]
		});
		de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel.superclass.initComponent.call(this);
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
				
				if (setting.group == "urlCheck"){
					this.settingsStoreUrlCheck[key] = value;
					var displayName = {};
					displayName["displayName"] = setting.name;
					this.propertyNamesUrlCheck[key] = displayName;
				}
			}
			this.gridUrlCheck.setSource(this.settingsStoreUrlCheck, this.propertyNamesUrlCheck);
		}
		de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel.superclass.onRender.apply(this, arguments);
	},
	/**
	 * Save the settings list on the server
	 */
	saveSettings: function() {
		var settings = [];
		settings.push(this.settingsStoreUrlCheck);
		de.ingrid.mapclient.Configuration.setValue('settings', Ext.encode(settings), de.ingrid.mapclient.admin.DefaultSaveHandler);
	}
});
