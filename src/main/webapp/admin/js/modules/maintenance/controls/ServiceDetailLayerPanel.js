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
	layerRecord:[],
	loadMask: new Ext.LoadMask(Ext.getBody())
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.initComponent = function() {
	var self = this;
	
	self.store = new Ext.data.ArrayStore({
	    fields: ['index', 'title', 'deactivated', 'checked', 'featureInfo', 'legend'],
	    idIndex: 0 
	});
	
	var layers = [];
	for (var i=0, countI=self.layerRecord.length; i<countI; i++) { 
		var layer = self.layerRecord[i];
		var checkedLayers = self.selectedService.data.checkedLayers;
		if(checkedLayers && checkedLayers.length > 0){
			var layerIsFound = false;
			for (var j=0, countJ=checkedLayers.length; j<countJ; j++) { 
				if(layer.index == checkedLayers[j]){
					layerIsFound = true;
					break;
				}
			}
			if(layer.index){
				layers.push([layer.index, layer.title, layer.deactivated, layerIsFound, layer.featureInfo, layer.legend]);
				self.layerRecord[i].checked = layerIsFound;
			}
		}else{
			if(layer.index){
				layers.push([layer.index, layer.title, layer.deactivated, layer.checked, layer.featureInfo, layer.legend]);				
			}
		}
		
	}
	
	var cm = new Ext.grid.ColumnModel({
	        // specify any defaults for each column
	        defaults: {
	            sortable: true // columns are not sortable by default           
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
	              	}
		            ,new Ext.ux.grid.CheckColumn({
		            	  header: "Ausgeschlossen", 
			              dataIndex: 'deactivated'
		            })
		            ,new Ext.ux.grid.CheckColumn({
		            	  header: "Aktiv (Default)", 
			              dataIndex: 'checked'
		            })
		            ,new Ext.ux.grid.CheckColumn({
		            	  header: "Info", 
		            	  dataIndex: 'featureInfo' 
		            })
	              ]
	    	});
	
	// create the grid
	var grid = new Ext.grid.EditorGridPanel({
        store: self.store,
        layout: 'form',
        autoHeight: true,
        autoScroll: true,
    	viewConfig: {
    		autoFill: true,
    		forceFit: true
    	},
    	cm: cm,
        height:350
    });

	self.store.loadData(layers);
	
	self.store.on('update',function(cell) {
		var modified  = cell.modified;
		if(modified){
			var modifiedData = modified[0].data;
			if(modifiedData){
				if(modified[0].modified.deactivated != undefined){
					Ext.Msg.show({
						   title:'Layer wird gel&ouml;scht',
						   msg: 'Soll das L&ouml;schen des Layers wirklich durchgef&uuml;hrt werden? Layer kann nur durch "Neu einlesen" des Dienstes wiederhergestellt werden!',
						   buttons: Ext.Msg.OKCANCEL,
						   icon: Ext.MessageBox.QUESTION,
						   fn: function(btn){
							   if (btn == 'ok'){
								   self.save(modifiedData);
							   }else{
								   self.mainPanel.reloadServiceFromConfig(false);
							   }
						   	}
						});
				}else{
					self.save(modifiedData);
				}
			}
		}
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
	for (var i=0, countI=self.layerRecord.length; i<countI; i++) { 
		var layer = self.layerRecord[i];
		if(layer.index == store.index){
			layers.push(store)
		}else{
			layers.push(layer);
		}
	}
	self.updateService(self.selectedService.data.name, self.selectedService.data.capabilitiesUrl, self.selectedService.data.originalCapUrl, null, layers);
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
		self.mainPanel.setValue('updateservice', service, 'Bitte warten! Layer-&Auml;nderungen werden &uuml;bernommen!');
	}
};
