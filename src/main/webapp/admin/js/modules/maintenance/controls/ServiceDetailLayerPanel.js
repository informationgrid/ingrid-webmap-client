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
	selectedService: null,
	mainPanel:null,
	store:null,
	layerRecord:[]
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.initComponent = function() {
	var self = this;
	
	this.store = new Ext.data.ArrayStore({
	    fields: ['index', 'title', 'deactivated', 'checked', 'featureInfo', 'legend'],
	    idIndex: 0 
	});
	
	var layers = [];
	for (var i=0, countI=this.layerRecord.length; i<countI; i++) { 
		var layer = this.layerRecord[i];
		var checkedLayers = this.selectedService.data.checkedLayers;
		if(checkedLayers && checkedLayers.length > 0){
			var layerIsFound = false;
			for (var j=0, countJ=checkedLayers.length; j<countJ; j++) { 
				if(layer.index == checkedLayers[j]){
					layerIsFound = true;
					break;
				}
			}
			layers.push([layer.index, layer.title, layer.deactivated, layerIsFound, layer.featureInfo, layer.legend]);
			this.layerRecord[i].checked = layerIsFound;
		}else{
			layers.push([layer.index, layer.title, layer.deactivated, layer.checked, layer.featureInfo, layer.legend]);
		}
		
	}
	
	// create the grid
	var grid = new Ext.grid.EditorGridPanel({
        store: this.store,
        viewConfig: {
			forceFit: true
		},	
        columns: [{
        	header: "Title", 
            dataIndex: 'title', 
            sortable: true, 
            width: 200, 
            editor:{
            	xtype: 'textfield',
            	allowBlank: false
            }
        },{
        	header: "Ausgeschlossen", 
        	dataIndex: 'deactivated', 
            editor:{
            	xtype: 'checkbox',
            	allowBlank: false
            }
        },{
        	header: "Aktiv (Default)", 
        	dataIndex: 'checked', 
            editor:{
            	xtype: 'checkbox',
            	allowBlank: false
            }
        },{
        	header: "Info", 
        	dataIndex: 'featureInfo', 
            editor:{
            	xtype: 'checkbox',
            	allowBlank: false
            }
        },{
        	header: "Legende", 
        	dataIndex: 'legend', 
            editor:{
            	xtype: 'checkbox',
            	allowBlank: false
            }
        }],
        height:350
    });

	this.store.loadData(layers);
	
	var self = this;
	
	grid.on('afteredit', function(store) {
		self.save(store);
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
	var self = this;
	var layers = [];
	for (var i=0, countI=this.layerRecord.length; i<countI; i++) { 
		var layer = this.layerRecord[i];
		if(layer.index == store.record.data.index){
			layers.push(store.record.data)
			this.layerRecord[i] = store.record.data;
		}else{
			layers.push(layer);
		}
	}
	self.updateService(this.selectedService.data.name, this.selectedService.data.capabilitiesUrl, this.selectedService.data.originalCapUrl, this.selectedService.data.mapServiceCategories, layers);
};

/**
 * Update services changes to config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.updateService = function(title, capabilitiesUrl, originalCapUrl, categories, layers){
	var self = this;
	if(capabilitiesUrl){
		var service = {
				   title: title,
				   capabilitiesUrl: capabilitiesUrl,
				   originalCapUrl: originalCapUrl,
				   categories: categories,
				   layers: layers
		   };
		// Update service
		de.ingrid.mapclient.Configuration.setValue('updateservice', Ext.encode(service), {
			success: function() {
				de.ingrid.mapclient.Configuration.load({
					success: function() {
						self.mainPanel.reloadServiceFromConfig(false);
					},
					failure: function() {
						de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
					}
				});
			},
			failure: function() {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
				} 
		   	});
	}
};
