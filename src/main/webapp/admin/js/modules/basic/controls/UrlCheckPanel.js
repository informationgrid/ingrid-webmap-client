/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class UrlCheckPanel is used to manage a list of scales.
 */
de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel = Ext.extend(Ext.Panel, {

	title: 'Url-Check',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	border: false,
	settingsStore: {},
	grid: null,
	propertyNames: {},
	gridUrlCheck: null,
	settingsStoreUrlCheck: {},
	propertyNamesUrlCheck: {}
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel.prototype.initComponent = function() {

	var self = this;	

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
	de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel.superclass.onRender.apply(this, arguments);

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
				this.propertyNamesUrlCheck[key] = setting.name;
			}
		}
	}
};

/**
 * Save the settings list on the server
 */
de.ingrid.mapclient.admin.modules.basic.UrlCheckPanel.prototype.saveSettings = function() {
	var settings = [];
	settings.push(this.settingsStoreUrlCheck);
	de.ingrid.mapclient.Configuration.setValue('settings', Ext.encode(settings), de.ingrid.mapclient.admin.DefaultSaveHandler);
};

