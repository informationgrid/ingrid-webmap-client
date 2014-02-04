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
de.ingrid.mapclient.admin.controls.GridPanel = Ext.extend(Ext.Panel, {

	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
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
	dropBoxTitle: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.controls.GridPanel.prototype.initComponent = function() {

	var self = this;

	// add the datachanged event
	this.addEvents({
		datachanged: true
	});

	// set up store listeners that will fire the datachange event
	this.store.on({
		'add': function(store, records, index) {
			this.fireEvent('datachanged');
		},
		'update': function(store, record, operation) {
			if (record.dirty) {
				this.fireEvent('datachanged');
			}
		},
		'remove': function(store, record, index) {
			this.fireEvent('datachanged');
		},
		'datachanged': function(store) {
			this.fireEvent('datachanged');
		},
		scope: this
	});

	// construct the grid
	var gridConfig = {
		store: this.store,
	    columns: this.createColumnConfig(this.columns),
	    ddGroup: self.getId()+'GridDD',
	    sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
	    enableDragDrop: true,
		autoHeight: true,
		viewConfig: {
			autoFill: true,
			forceFit: true,
			columnsText: 'Spalten',
            sortAscText: 'A-Z sortieren',
            sortDescText: 'Z-A sortieren'
		}
	};
	// allow to modify the configuration
	if (this.gridConfigCb instanceof Function) {
		gridConfig = this.gridConfigCb(gridConfig);
	}
    this.gridPanel = new Ext.grid.EditorGridPanel(gridConfig);

    // set up grid events

    // install a drop target and start listening to
    // drag/drop event to store the new record order
    this.gridPanel.on('render', function(e) {
		new Ext.dd.DropTarget(self.gridPanel.container, {
			ddGroup: self.getId()+'GridDD',
			copy: false,
			notifyDrop: function(dd, e, data) {
				var ds = self.gridPanel.store;
				var sm = self.gridPanel.getSelectionModel();
				var rows = sm.getSelections();
				if(dd.getDragData(e)) {
					var cindex = dd.getDragData(e).rowIndex;
					// since we have single selection, there is only one record
					var movedRecord = data.selections[0];
					if(cindex != undefined && cindex != ds.indexOf(movedRecord)) {
						// don't fire any store events while sorting
						ds.suspendEvents(false);
						for(var i=0, count=rows.length; i<count; i++) {
							ds.remove(ds.getById(rows[i].id));
						}
						ds.insert(cindex, movedRecord);
						ds.resumeEvents();
						sm.clearSelections();
						// fire only one datachanged event for complete sorting
						ds.fireEvent('datachanged');
					}
				}
			}
		});
    });

    // listen to afterEdit event to store the record on change
    this.gridPanel.on('afterEdit', function(e) {
    	e.record.data[e.field] = e.value;
    	e.record.commit();
    });

    // check for clicks on the delete column to delete the record
    this.gridPanel.on('cellclick', function(grid, rowIndex, columnIndex, e) {
		if(columnIndex == grid.getColumnModel().getIndexById('delete')) {
			var msg = Ext.Msg;
			msg.buttonText = {ok: "OK", cancel: "Abbrechen", yes: "Ja", no: "Nein"};
			msg.show({
				   title: self.dropBoxTitle,
				   msg: 'Soll der Eintrag wirklich gel&ouml;scht werden?',
				   buttons: Ext.Msg.OKCANCEL,
				   icon: Ext.MessageBox.QUESTION,
				   fn: function(btn){
					   if (btn == 'ok'){
						   var record = grid.getStore().getAt(rowIndex);
							grid.getStore().remove(record);
							grid.getView().refresh();
					   }
				   	}
				});
		}
    });

    // create the new record fields and form containers from the column model
    this.newRecordFields = new Ext.util.MixedCollection();
    for (var i=0, count=this.columns.length; i<count; i++) {
    	var column = this.columns[i];
    	var field = new Ext.create(column.editor);
    	Ext.applyIf(field, {
    		fieldLabel: column.header,
    		name: column.dataIndex,
    		anchor: '99%'
    	});
    	this.newRecordFields.add(column.dataIndex, field);
    };

	// create the final layout
	Ext.apply(this, {
		items: [
		    this.gridPanel, {
		    // spacer
			xtype: 'container',
			height: 20
	    }, this.createNewRecordFieldContainer()]
	});
	de.ingrid.mapclient.admin.controls.GridPanel.superclass.initComponent.call(this);
};

/**
 * Get the store of the panel
 * @return Ext.data.Store
 */
de.ingrid.mapclient.admin.controls.GridPanel.prototype.getStore = function() {
	return this.store;
};

/**
 * Create the final column configuration from the constructor's columns configuration
 * @param columns Array of column configuration
 * @return Array of column configuration
 */
de.ingrid.mapclient.admin.controls.GridPanel.prototype.createColumnConfig = function(columns) {
	var columnConfig = [];
	for (var i=0, count=columns.length; i<count; i++) {
		columnConfig.push(columns[i]);
	}
	// add the delete button
	columnConfig.push({
		header: 'Aktion',
		sortable: false,
		id: 'delete',
		width: 10,
	    renderer: function(v, p, record, rowIndex){
	        return '<div class="iconRemove"></div>';
	    }
	});
	return columnConfig;
};

/**
 * Layout the new record fields
 * @return Ext.Panel
 */
de.ingrid.mapclient.admin.controls.GridPanel.prototype.createNewRecordFieldContainer = function() {
    var newRecordFieldContainers = [];
    var colWidth = (1-.3)/this.columns.length;
    for (var i=0, count=this.columns.length; i<count; i++) {
    	var column = this.columns[i];
    	var container = new Ext.Panel({
    		layout: 'form',
			labelAlign: 'top',
			labelSeparator: '',
			height: 50,
			border: false,
			columnWidth: colWidth,
			items: this.newRecordFields.get(column.dataIndex)
    	});
    	newRecordFieldContainers.push(container);
    };

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
    var newRecordPanel = new Ext.Panel({
		layout: 'column',
		anchor: '100%',
		border: false,
    	items: newRecordFieldContainers
    });
    return newRecordPanel;
};

/**
 * Create the buttons. The default implementation will create an add button only.
 * @return Array of Ext.Button instances including the extra buttons
 */
de.ingrid.mapclient.admin.controls.GridPanel.prototype.createButtons = function() {
	// create the buttons
	var buttons = [];

	// add the add button
	var self = this;
    buttons.push(new Ext.Button({
		text: 'Hinzuf&uuml;gen',
		fieldLabel: '&nbsp;',
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
};

/**
 * Validate the content of the new record fields
 * @return Boolean
 */
de.ingrid.mapclient.admin.controls.GridPanel.prototype.validateNewRecord = function() {
	var valid = true;
	this.newRecordFields.each(function(field) {
    	if (!field.validate()) {
    		valid = false;
    	}
	});
	return valid;
};

/**
 * Get the value of the given new record fields
 * @param name The name of the field (column name)
 * @return String
 */
de.ingrid.mapclient.admin.controls.GridPanel.prototype.getNewRecordValue = function(name) {
	this.newRecordFields.each(function(field) {
    	if (field.name == name) {
    		return field.getValue();
    	}
	});
};

/**
 * Add the record from the input fields
 */
de.ingrid.mapclient.admin.controls.GridPanel.prototype.addRecord = function() {
	// add the new data to the store
	var recordData = {};
	this.newRecordFields.each(function(field) {
		recordData[field.name] = field.getValue();
		// empty the field value
		field.setRawValue('');
	});
	var record = new this.store.recordType(recordData);
	this.store.add(record);
};

