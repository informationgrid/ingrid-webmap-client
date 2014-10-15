/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.controls");

/**
 * @class GridPanel is a grid control that allows to manage (modify/sort/insert/delete)
 * records of a connected store.
 * In the configuration object the store and the column configuration need to be provided.
 * A callback for customizing the final grid options may be passed optionally.
 * For convenience reasons the grid fires a 'datachanged' event, if the data were changed
 * in the store by any events mentioned above. This is especially useful, if the store
 * data should be saved to the server completely each time they are modified.
 */
Ext.define('de.ingrid.mapclient.admin.controls.GridPanel', { 
	extend:'Ext.panel.Panel',
	layout: 'form',
	border: false,

	/**
	 * @cfg store The Ext.data.Store which holds the records for this grid
	 */
	store: null,

	/**
	 * @cfg columns An array of column configurations to be passed to the Ext.grid.ColumnModel constructor
	 */
	columns: null,

	/**
	 * @cfg gridConfigCb Function to be called that may to modify the grid configuration (optional)
	 * The only parameter to the callback is the grid configuration and it must return a grid configuration.
	 */
	gridConfigCb: null,

	/**
	 * @cfg extraButtons Array of additional buttons displayed besides the add button (optional)
	 */
	extraButtons: null,

	/**
	 * The grid panel
	 */
	gridPanel: null,

	/**
	 * The editor fields for a new record
	 */
	newRecordFields: null,
	
	/**
	 *  Drop box title
	 */
	dropBoxTitle: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	drop: false,
	initComponent: function() {
		var self = this;

		// add the datachanged event
		this.addEvents({
			datachanged: true
		});

		// set up store listeners that will fire the datachange event
		this.store.on({
			'add': function(store, records, index) {
				if(self.drop == false){
					this.fireEvent('datachanged');
				}
			},
			'update': function(store, record, operation) {
				if (record.dirty) {
					this.fireEvent('datachanged');
				}
			},
			'remove': function(store, record, index) {
				if(self.drop == false){
					this.fireEvent('datachanged');
				}
			},
			'datachanged': function(store) {
				if(self.drop == false){
					this.fireEvent('datachanged');
				}
			},
			scope: this
		});
		
		// construct the grid
		var gridConfig = {
			store: this.store,
			header: false,
		    columns: { 
		    	items: this.createColumnConfig(this.columns),
		        columnsText: 'Spalten',
	            sortAscText: 'A-Z sortieren',
	            sortDescText: 'Z-A sortieren'
		    },
		    selModel: Ext.create('Ext.selection.CellModel', { mode: 'SINGLE'}),
			plugins: [Ext.create('Ext.grid.plugin.CellEditing', {
	            clicksToEdit: 1
	        })],
			viewConfig: {
				autoFill: true,
				forceFit: true,
	            plugins: [{
	                ptype: 'gridviewdragdrop',
	                ddGroup: self.getId()+'GridDD'
	            }]
			}
		};
		// allow to modify the configuration
		if (this.gridConfigCb instanceof Function) {
			gridConfig = this.gridConfigCb(gridConfig);
		}
	    this.gridPanel = Ext.create('Ext.grid.Panel', gridConfig);
	    this.gridPanel.getView().on({
	    	beforedrop: function(node, data, overModel, dropPosition, dropHandlers) {
		    	self.drop = true;
		    },
		    drop: function(node, data, overModel, dropPosition) {
		    	self.drop = false;
		    	self.store.fireEvent('datachanged');
		    }
	    });
	    // create the new record fields and form containers from the column model
	    this.newRecordFields = new Ext.util.MixedCollection();
	    for (var i=0, count=this.columns.length; i<count; i++) {
	    	var column = this.columns[i];
	    	var field = Ext.create('Ext.form.field.Text', column.editor);
	    	Ext.apply(field, {
	    		fieldLabel: column.header,
	    		name: column.dataIndex,
	    		anchor: '99%'
	    	});
	    	this.newRecordFields.add(column.dataIndex, field);
	    };
	    
		// create the final layout
		Ext.apply(this, {
			items: [
			    this.gridPanel, 
			    this.createNewRecordFieldContainer()
			]
		});
		de.ingrid.mapclient.admin.controls.GridPanel.superclass.initComponent.call(this);
	},
	/**
	 * Get the store of the panel
	 * @return Ext.data.Store
	 */
	getStore: function() {
		return this.store;
	},
	/**
	 * Create the final column configuration from the constructor's columns configuration
	 * @param columns Array of column configuration
	 * @return Array of column configuration
	 */
	createColumnConfig: function(columns) {
		var columnConfig = [];
		for (var i=0, count=columns.length; i<count; i++) {
			columnConfig.push(columns[i]);
		}
		// add the delete button
		columnConfig.push({
			xtype: 'actioncolumn',
            header: 'Aktion',
			sortable: false,
			id: 'delete',
			width: 40,
			menuDisabled: true,
			flex: 1,
			items: [{
				iconCls: 'iconRemove',
                scope: this,
                tooltip: this.dropBoxTitle,
                handler: this.onRemoveClick
            }]
		});
		return columnConfig;
	},
	/**
	 * Layout the new record fields
	 * @return Ext.Panel
	 */
	createNewRecordFieldContainer: function() {
	    var newRecordFieldContainers = [];
	    var colWidth = (1-.3)/this.columns.length;
	    for (var i=0, count=this.columns.length; i<count; i++) {
	    	var column = this.columns[i];
	    	var container = Ext.create('Ext.panel.Panel', {
	    		layout: 'column',
				border: false,
				columnWidth: colWidth,
				items: this.newRecordFields.get(column.dataIndex)
	    	});
	    	newRecordFieldContainers.push(container);
	    };

	    var buttons = this.createButtons();
	    for (var i=0, count=buttons.length; i<count; i++) {
	    	var btnContainer = Ext.create('Ext.panel.Panel', {
	    		layout: 'column',
	    		border: false,
	    		bodyStyle: 'padding-left:10px',
	    		items: buttons[i]
	    	});
	    	newRecordFieldContainers.push(btnContainer);
	    }
	    var newRecordPanel = Ext.create('Ext.panel.Panel', {
			layout: 'column',
			anchor: '100%',
			border: false,
	    	items: newRecordFieldContainers
	    });
	    return newRecordPanel;
	},
	/**
	 * Create the buttons. The default implementation will create an add button only.
	 * @return Array of Ext.Button instances including the extra buttons
	 */
	createButtons: function() {
		// create the buttons
		var buttons = [];

		// add the add button
		var self = this;
	    buttons.push(Ext.create('Ext.Button', {
			text: 'Hinzuf&uuml;gen',
			handler: function() {
				if (self.validateNewRecord()) {
					self.addRecord();
				}
			}
	    }));
	    // add the extra buttons
	    if (this.extraButtons != undefined) {
	        for (var i=0, count=this.extraButtons.length; i<count; i++) {
	        	buttons.push(this.extraButtons[i]);
	        }
	    }
	    return buttons;
	},
	/**
	 * Validate the content of the new record fields
	 * @return Boolean
	 */
	validateNewRecord: function() {
		var valid = true;
		this.newRecordFields.each(function(field) {
	    	if (!field.validate()) {
	    		valid = false;
	    	}
		});
		return valid;
	},
	/**
	 * Get the value of the given new record fields
	 * @param name The name of the field (column name)
	 * @return String
	 */
	getNewRecordValue: function(name) {
		this.newRecordFields.each(function(field) {
	    	if (field.name == name) {
	    		return field.getValue();
	    	}
		});
	},
	/**
	 * Add the record from the input fields
	 */
	addRecord: function() {
		// add the new data to the store
		var recordData = {};
		this.newRecordFields.each(function(field) {
			recordData[field.name] = field.getValue();
			// empty the field value
			field.setRawValue('');
		});
		this.store.add(recordData);
	},
	onRemoveClick: function(grid, rowIndex){
		var self = this;
		var msg = Ext.Msg;
		msg.buttonText = {ok: "OK", cancel: "Abbrechen", yes: "Ja", no: "Nein"};
		msg.show({
		   title: self.dropBoxTitle,
		   msg: 'Soll der Eintrag wirklich gel&ouml;scht werden?',
		   buttons: Ext.Msg.OKCANCEL,
		   icon: Ext.MessageBox.QUESTION,
		   fn: function(btn){
			   if (btn == 'ok'){
				   grid.getStore().removeAt(rowIndex);
			   }
		   	}
		});
    }
});