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
	        columns: [/*{
	              	header: "Name", 
	                  dataIndex: 'index', 
	                  sortable: true, 
	                  width: 200, 
	                  editor:{
	                  	xtype: 'textfield',
	                  	allowBlank: false
	                  }
	              },*/{
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
	              }/*,{
	            	header: "Legende", 
	              	dataIndex: 'legend',
	              	editor:{
	                  	xtype: 'checkbox',
	                  	allowBlank: false
	                  }
	              }*/]
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
	
	grid.on('afteredit', function(cell) {
		if(cell.field == "deactivated"){
			Ext.Msg.show({
				   title:'Layer wird gel&ouml;scht',
				   msg: 'Soll das L&ouml;schen des Layers wirklich durchgef&uuml;hrt werden? Layer kann nur durch "Neu einlesen" des Dienstes wiederhergestellt werden!',
				   buttons: Ext.Msg.OKCANCEL,
				   icon: Ext.MessageBox.QUESTION,
				   fn: function(btn){
					   if (btn == 'ok'){
						   self.save(cell);
					   }else{
						   self.mainPanel.reloadServiceFromConfig(false);
					   }
				   	}
				});
		}else{
			self.save(cell);			
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
		if(layer.index == store.record.data.index){
			layers.push(store.record.data)
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
