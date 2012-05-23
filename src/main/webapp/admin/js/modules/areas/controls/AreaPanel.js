/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.areas");

/**
 * @class AreaPanel is used to manage a map area.
 */
de.ingrid.mapclient.admin.modules.areas.AreaPanel = Ext.extend(de.ingrid.mapclient.admin.controls.GridPanel, {

	columns: [{
		header: 'Name',
		sortable: true,
		dataIndex: 'name',
		editor: {
		   xtype: 'textfield',
		   allowBlank: false
		}
	}, {
		header: 'Norden',
		sortable: true,
		dataIndex: 'north',
		editor: {
		   xtype: 'coordinatefield',
		   allowBlank: false
		}
	}, {
		header: 'Westen',
		sortable: true,
		dataIndex: 'west',
		editor: {
		   xtype: 'coordinatefield',
		   allowBlank: false
		}
	}, {
		header: 'Osten',
		sortable: true,
		dataIndex: 'east',
		editor: {
		   xtype: 'coordinatefield',
		   allowBlank: false
		}
	}, {
		header: 'S&uuml;den',
		sortable: true,
		dataIndex: 'south',
		editor: {
		   xtype: 'coordinatefield',
		   allowBlank: false
		}
	}]
});

/**
 * @see de.ingrid.mapclient.admin.controls.GridPanel.createNewRecordFieldContainer
 */
de.ingrid.mapclient.admin.modules.areas.AreaPanel.prototype.createNewRecordFieldContainer = function() {

    var newRecordFieldContainers = [];
	var container = new Ext.Panel({
		layout: 'form',
		labelAlign: 'top',
		labelSeparator: '',
		height: 50,
		border: false,
		columnWidth: .7,
		items: this.newRecordFields.get('name')
	});
	newRecordFieldContainers.push(container);

    var buttons = this.createButtons();
    for (var i=0, count=buttons.length; i<count; i++) {
    	var btnContainer = new Ext.Panel({
    		layout: 'form',
    		labelAlign: 'top',
    		labelSeparator: '',
    		height: 50,
    		border: false,
    		bodyStyle: 'padding-left:10px',
    		items: buttons[i]
    	});
    	newRecordFieldContainers.push(btnContainer);
    }
    // use a MapExtendPanel to layout the new record fields
	var mapExtendPanel = new de.ingrid.mapclient.admin.controls.MapExtendPanel({
		northField: this.newRecordFields.get('north'),
		westField: this.newRecordFields.get('west'),
		eastField: this.newRecordFields.get('east'),
		southField: this.newRecordFields.get('south'),
		columnWidth: .7
	});
	newRecordFieldContainers.push(mapExtendPanel);

	var newRecordPanel = new Ext.Panel({
		layout: 'column',
		anchor: '100%',
		border: false,
    	items: newRecordFieldContainers
    });
    return newRecordPanel;
};
