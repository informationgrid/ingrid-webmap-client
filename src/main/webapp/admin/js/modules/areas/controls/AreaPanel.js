/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.areas");

/**
 * @class AreaPanel is used to manage a map area.
 */

Ext.define('de.ingrid.mapclient.admin.modules.areas.AreaPanel', { 
	extend: 'de.ingrid.mapclient.admin.controls.GridPanel',
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
	}],
	dropBoxTitle:'Vordefinierten Bereich l&ouml;schen',
	/**
	 * @see de.ingrid.mapclient.admin.controls.GridPanel.createNewRecordFieldContainer
	 */
	createNewRecordFieldContainer: function() {

	    var newRecordFieldContainers = [];
		var container = Ext.create('Ext.panel.Panel', {
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
	    	var btnContainer = Ext.create('Ext.panel.Panel', {
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
		var mapExtendPanel = Ext.create('de.ingrid.mapclient.admin.controls.MapExtendPanel', {
            northField: this.newRecordFields.get('north'),
			westField: this.newRecordFields.get('west'),
			eastField: this.newRecordFields.get('east'),
			southField: this.newRecordFields.get('south')
		});
		newRecordFieldContainers.push(mapExtendPanel);

		var newRecordPanel = Ext.create('Ext.form.Panel', {
			layout: {
			    type: 'vbox',
			    pack: 'start',
			    align: 'stretch'
			},
			anchor: '100%',
			border: false,
	    	items: newRecordFieldContainers
	    });
	    return newRecordPanel;
	}
});