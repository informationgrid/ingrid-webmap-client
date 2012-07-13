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
	
	var layersChecked = [];
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
			layersChecked.push([layer.index, layer.title, layer.deactivated, layerIsFound, layer.featureInfo, layer.legend]);
			self.layerRecord[i].checked = layerIsFound;
		}else{
			layersChecked.push([layer.index, layer.title, layer.deactivated, layer.checked, layer.featureInfo, layer.legend]);				
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
	if(allDeactivated){
		layers.push(['', '<b>Alle Ausw&auml;hlen</b>', allDeactivated, false, false, false]);	
	}else{
		layers.push(['', '<b>Alle Ausw&auml;hlen</b>', allDeactivated, allChecked, allFeatureInfo, allLegend]);
	}
	
	for (var i=0, countI=layersChecked.length; i<countI; i++) {
		var layer = layersChecked[i];
		layers.push([layer[0], layer[1], layer[2], layer[3], layer[4], layer[5]]);
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
		}
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
					if(modifiedData.title === "<b>Alle Ausw&auml;hlen</b>"){
						if(modifiedData.deactivated && record.modified.deactivated == undefined){
							record.reject();
						}else{
							if(record){
								if(record.modified){
									var layers = [];
									for (var i=0, countI=self.layerRecord.length; i<countI; i++) { 
										var layer = self.layerRecord[i];
										if(record.modified.checked != undefined){
											if(record.modified.checked == false){
												layer.checked = true;
											}else{
												layer.checked = false;
											}
										}
										
										if(record.modified.deactivated != undefined){
											if(record.modified.deactivated == false){
												layer.deactivated = true;
											}else{
												record.reject();
											}
										}
										
										if(record.modified.featureInfo != undefined){
											if(record.modified.featureInfo == false){
												layer.featureInfo = true;
											}else{
												layer.featureInfo = false;
											}
										}
										
										if(record.modified.legend != undefined){
											if(record.modified.legend == false){
												layer.legend = true;
											}else{
												layer.legend = false;
											}
										}
										
										layers.push(layer);
									}
									self.updateService(self.selectedService.data.name, self.selectedService.data.capabilitiesUrl, self.selectedService.data.originalCapUrl, null, layers);
								}
							}
						}
					}else{
						record.reject();
					}
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
	if(rowIndex != 0){
		if (record.get('deactivated')) {
			formatted = '<span style="font-style: italic; color:#C0C0C0;">'+value+'</span>';
		}
	}
	
   return formatted;
};


