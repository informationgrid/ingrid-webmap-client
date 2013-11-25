/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultSettingsPanel is used to manage a list of scales.
 */
de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel = Ext.extend(Ext.Panel, {

	title: 'Benutzeroberfl&auml;che',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	border: false,
	settingsStore: {},
	grid: null,
	propertyNames: {},
	gridSearch: null,
	settingsStoreSearch: {},
	propertyNamesSearch: {},
	gridUrlCheck: null,
	settingsStoreUrlCheck: {},
	propertyNamesUrlCheck: {},
	gridDefault: null,
	settingsStoreDefault: {},
	propertyNamesDefault: {}
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel.prototype.initComponent = function() {

	var self = this;	

	// create the searcher grid
	this.gridDefault = new Ext.grid.PropertyGrid({
		title: 'Allgemein',
	    autoHeight: true,
        propertyNames: this.propertyNamesDefault,
        source:  this.settingsStoreDefault,
        viewConfig : {
            forceFit: true,
            scrollOffset: 2 // the grid will never have scrollbars
        },
        autoExpandColumn: {
            forceFit: true
        }
	});

	// create the viewer grid
	this.grid = new Ext.grid.PropertyGrid({
		title: 'Kartenviewer',
	    autoHeight: true,
        propertyNames: this.propertyNames,
        source:  this.settingsStore,
        viewConfig : {
            forceFit: true,
            scrollOffset: 2 // the grid will never have scrollbars
        },
        autoExpandColumn: {
            forceFit: true
        }
	});

	// create the searcher grid
	this.gridSearch = new Ext.grid.PropertyGrid({
		title: 'Suche',
	    autoHeight: true,
        propertyNames: this.propertyNamesSearch,
        source:  this.settingsStoreSearch,
        viewConfig : {
            forceFit: true,
            scrollOffset: 2 // the grid will never have scrollbars
        },
        autoExpandColumn: {
            forceFit: true
        }
	});
	
	// create the searcher grid
	this.gridUrlCheck = new Ext.grid.PropertyGrid({
		title: 'Url-Check',
	    autoHeight: true,
        propertyNames: this.propertyNamesUrlCheck,
        source:  this.settingsStoreUrlCheck,
        viewConfig : {
            forceFit: true,
            scrollOffset: 2 // the grid will never have scrollbars
        },
        autoExpandColumn: {
            forceFit: true
        }
	});

	
	// create the final layout
	Ext.apply(this, {
		items: [
		        
		        this.gridDefault,
		        {
		        	xtype: 'container',
					height: 20
			    },
			    {
					xtype: 'container',
					layout: 'column',
					anchor: '100%',
				    items: [{
						xtype: 'container',
						columnWidth: 1,
						height: 50
					}, {
						xtype: 'container',
						layout: 'form',
						height: 50,
						items: {
							xtype: 'button',
							text: 'Einstellungen Speichern',
							anchor: '100%',
							style: {
				                paddingTop: '10px'
				            },
							handler: function() {
								self.saveSettings();
							}
						}
					}]
			    }, 
			    this.grid,
		        {
		        	xtype: 'container',
					height: 20
			    },
			    {
					xtype: 'container',
					layout: 'column',
					anchor: '100%',
				    items: [{
						xtype: 'container',
						columnWidth: 1,
						height: 50
					}, {
						xtype: 'container',
						layout: 'form',
						height: 50,
						items: {
							xtype: 'button',
							text: 'Einstellungen Speichern',
							anchor: '100%',
							style: {
				                paddingTop: '10px'
				            },
							handler: function() {
								self.saveSettings();
							}
						}
					}]
			    }, 
			    this.gridSearch,
			    {
					xtype: 'container',
					height: 20
			    },
			    {
					xtype: 'container',
					layout: 'column',
					anchor: '100%',
				    items: [{
						xtype: 'container',
						columnWidth: 1,
						height: 50
					}, {
						xtype: 'container',
						layout: 'form',
						height: 50,
						items: {
							xtype: 'button',
							text: 'Einstellungen Speichern',
							anchor: '100%',
							style: {
				                paddingTop: '10px'
				            },
							handler: function() {
								self.saveSettings();
							}
						}
					}]
			    },
			    this.gridUrlCheck,
			    {
					xtype: 'container',
					height: 20
			    },
			    {
					xtype: 'container',
					layout: 'column',
					anchor: '100%',
				    items: [{
						xtype: 'container',
						columnWidth: 1,
						height: 50
					}, {
						xtype: 'container',
						layout: 'form',
						height: 50,
						items: {
							xtype: 'button',
							text: 'Einstellungen Speichern',
							anchor: '100%',
							style: {
				                paddingTop: '10px'
				            },
							handler: function() {
								self.saveSettings();
							}
						}
					}]
			    },
			    {
					xtype: 'container',
					height: 20
			    }]
	});
	de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel.superclass.onRender.apply(this, arguments);

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
			
			if(key.indexOf("view") == 0){
				this.settingsStore[key] = value;
				this.propertyNames[key] = setting.name;
			}else if (key.indexOf("search") == 0){
				this.settingsStoreSearch[key] = value;
				this.propertyNamesSearch[key] = setting.name;
			}else if (key.indexOf("default") == 0){
				this.settingsStoreDefault[key] = value;
				this.propertyNamesDefault[key] = setting.name;
			}else if (key.indexOf("urlCheck") == 0){
				this.settingsStoreUrlCheck[key] = value;
				this.propertyNamesUrlCheck[key] = setting.name;
			}
		}
	}
};

/**
 * Save the settings list on the server
 */
de.ingrid.mapclient.admin.modules.basic.DefaultSettingsPanel.prototype.saveSettings = function() {
	var settings = [];
	settings.push(this.settingsStoreDefault);
	settings.push(this.settingsStore);
	settings.push(this.settingsStoreSearch);
	settings.push(this.settingsStoreUrlCheck);
	de.ingrid.mapclient.Configuration.setValue('settings', Ext.encode(settings), de.ingrid.mapclient.admin.DefaultSaveHandler);
};

