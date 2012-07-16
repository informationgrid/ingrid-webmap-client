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
	
	self.store = new Ext.data.ArrayStore({
	    fields: ['index', 'title', 'deactivated', 'checked', 'featureInfo', 'legend'],
	    idIndex: 0 
	});
	
	var layers = [];
	var allDeactivated = true;
	var allChecked = true;
	var allFeatureInfo = true;
	var allLegend = true;
	
	for (var i=0, countI=self.layerRecord.length; i<countI; i++) { 
		var layer = self.layerRecord[i];
		var checkedLayers = self.selectedService.data.checkedLayers;
		var layerIsFound = false;
		if(checkedLayers && checkedLayers.length > 0){
			for (var j=0, countJ=checkedLayers.length; j<countJ; j++) { 
				if(layer.index == checkedLayers[j]){
					layerIsFound = true;
					break;
				}
			}
			layers.push([layer.index, layer.title, layer.deactivated, layerIsFound, layer.featureInfo, layer.legend]);
			self.layerRecord[i].checked = layerIsFound;
		}else{
			layers.push([layer.index, layer.title, layer.deactivated, layer.checked, layer.featureInfo, layer.legend]);				
		}
		if(layer.index){
			if(layer.deactivated == false){
				allDeactivated = false;
			}
			if(layerIsFound == false){
				allChecked = false;
			}
			if(layer.featureInfo == false){
				allFeatureInfo = false;
			}
			if(layer.legend == false){
				allLegend = false;
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
	              		},
	              		renderer: self.renderRow
	                	
	              	}
		            ,new Ext.ux.grid.CheckColumn({
		            	  header: "Verwerfen", 
			              dataIndex: 'deactivated',
			              width: 25,
			              align: "center"
			              		
		            })
		            ,new Ext.ux.grid.CheckColumn({
		            	  header: "Aktiv", 
			              dataIndex: 'checked',
			              width: 25,
			              align: "center" 
		            })
		            ,new Ext.ux.grid.CheckColumn({
		            	  header: "Feature Info", 
		            	  dataIndex: 'featureInfo',
			              width: 25,
			              align: "center" 
		            })
	              ]
	    	});
	
	var deactivatedTbar = {
            xtype: 'checkbox',
            boxLabel: 'Alle Layer verwerfen',
            id : 'cb_deactivated',
            checked: allDeactivated,
            handler: function(btn) {
    			self.allCheckboxesDeactivated(Ext.getCmp('cb_deactivated').getValue(), self.layerRecord);
    		},
			renderer: self.allCheckboxesStyle
		};

	var checkedTbar = {
            xtype: 'checkbox',
            boxLabel: 'Alle Layer aktvieren',
            id : 'cb_checked',
            checked: allChecked,
            handler: function(btn) {
    			self.allCheckboxesChecked(Ext.getCmp('cb_checked').getValue(), self.layerRecord);
    		}
		};

	var featureInfoTbar = {
            xtype: 'checkbox',
            boxLabel: 'Alle Layer Infos aktvieren',
            id : 'cb_featureInfo',
            checked: allFeatureInfo,
            handler: function(btn) {
            	self.allCheckboxesFeatureInfo(Ext.getCmp('cb_featureInfo').getValue(), self.layerRecord);
    		}
		};

	console.debug(featureInfoTbar);
	
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
        height:350,
        border: false,
        listeners: {
			'beforeedit': function(e) {
				if(e.record.get('deactivated')) {
					e.cancel = true;
				}
			}
		}, 
		tbar:[deactivatedTbar, "-", checkedTbar, "-", featureInfoTbar]
    });

	self.store.loadData(layers);
	
	self.store.on('update',function(cell, record, operation) {
		var modified  = record.modified;
		if(modified){
			var modifiedData = record.data;
			if(modifiedData){
				if(modifiedData.index !== ""){
					if(record.modified.deactivated != undefined){
						Ext.Msg.show({
							   title:'Layer wird gel&ouml;scht',
							   msg: 'Soll das L&ouml;schen des Layers wirklich durchgef&uuml;hrt werden? Layer kann nur durch "Neu einlesen" des Dienstes wiederhergestellt werden!',
							   buttons: Ext.Msg.OKCANCEL,
							   icon: Ext.MessageBox.QUESTION,
							   fn: function(btn){
								   if (btn == 'ok'){
									   self.save(modifiedData);
								   }else{
									   record.reject();
								   }
							   	}
							});
					}else{
						self.save(modifiedData);
					}
				}else{
					record.reject();
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

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.renderRow = function(value, metadata, record, rowIndex, colIndex, store) {
	var formatted = value;
	if (record.get('deactivated')) {
		formatted = '<span style="font-style: italic; color:#C0C0C0;">'+value+'</span>';
	}
	
	return formatted;
};

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.allCheckboxesDeactivated = function(allDeactivated, record) {
	var self = this;
	if(record){
		var layers = [];
		for (var i=0, countI=record.length; i<countI; i++) { 
			var layer = record[i];
			if(allDeactivated != undefined){
				layer.deactivated = allDeactivated;
			}
			layers.push(layer);
		}
		self.updateService(self.selectedService.data.name, self.selectedService.data.capabilitiesUrl, self.selectedService.data.originalCapUrl, null, layers);
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.allCheckboxesChecked = function(allChecked, record) {
	var self = this;
	if(record){
		var layers = [];
		for (var i=0, countI=record.length; i<countI; i++) { 
			var layer = record[i];
			if(allChecked != undefined){
				layer.checked = allChecked;
			}
			layers.push(layer);
		}
		self.updateService(self.selectedService.data.name, self.selectedService.data.capabilitiesUrl, self.selectedService.data.originalCapUrl, null, layers);
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.allCheckboxesFeatureInfo = function(allFeatureInfo, record) {
	var self = this;
	if(record){
		var layers = [];
		for (var i=0, countI=record.length; i<countI; i++) { 
			var layer = record[i];
			if(allFeatureInfo != undefined){
				layer.featureInfo = allFeatureInfo;
			}
			layers.push(layer);
		}
		self.updateService(self.selectedService.data.name, self.selectedService.data.capabilitiesUrl, self.selectedService.data.originalCapUrl, null, layers);
	}
};
