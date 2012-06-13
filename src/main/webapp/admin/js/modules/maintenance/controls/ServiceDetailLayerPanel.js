/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");

/**
 * @class ServiceDetailLayerPanel is used to manage a list of map projections.
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel = Ext.extend(Ext.Panel, {
	split: true,
    title: 'Layer',
    autoScroll: true,
    activeNode: null,
	capabilities: null,
	treePanel:null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.initComponent = function() {
	var store = new Ext.data.Store({
        // load using HTTP
        url: this.capabilities,
		// the return will be XML, so lets set up a reader
        reader: new Ext.data.XmlReader({
               // records will have an "Item" tag
               record: 'Layer > Layer',
               id: 'Title',
               totalRecords: '@total'
           }, [
               // set up the fields mapping into the xml doc
               // The first needs mapping, the others are very basic
               {name: 'Title', mapping: 'Title'}
           ])
    });
	// create the grid
	var grid = new Ext.grid.EditorGridPanel({
        store: store,
        viewConfig: {
			forceFit: true
		},	
        columns: [{
        	header: "Title", 
            dataIndex: 'Title', 
            sortable: true, 
            width: 200, 
            editor:{
            	xtype: 'textfield',
            	allowBlank: false
            }
        },{
        	header: "Sichtbar", 
        	dataIndex: 'display', 
            editor:{
            	xtype: 'checkbox',
            	id:'display',
            	name:'display'
            }
        },{
        	header: "Selektiert", 
        	dataIndex: 'select', 
            editor:{
            	xtype: 'checkbox',
            	id:'select',
            	name:'select'
            }
        },{
        	header: "Feature Info", 
        	dataIndex: 'featureInfo', 
            editor:{
            	xtype: 'checkbox',
            	id:'featureInfo',
            	name:'featureInfo'
            }
        },{
        	header: "Legende", 
        	dataIndex: 'legend	', 
            editor:{
            	xtype: 'checkbox',
            	id:'legend',
            	name:'legend'
            }
        }],
        height:350
    });

    store.load();
	
	var self = this;
	
	grid.on('afteredit', function(store) {
		de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.save(store);
	});
	// create the final layout
	Ext.apply(this, {
		items: [grid]
	});
	
	de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.superclass.initComponent.call(this);
};

/**
 * Save the services list on the server
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.save = function(store) {
	console.debug('save');
	console.debug(store);
};