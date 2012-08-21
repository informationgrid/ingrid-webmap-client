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
	
	var allDeactivated = true;
	var allChecked = true;
	var allFeatureInfo = true;
	var allLegend = true;
	
	if(self.selectedService){
		if(self.selectedService.data){
			if(self.selectedService.data.capabilitiesUrl){
				var layers = [];
				// Check edit XML
				var url = self.selectedService.data.capabilitiesUrl;
				var editDoc = self.displayResult(url);
				var editLayers = editDoc.getElementsByTagName("Layer");
				var checkedLayers = self.selectedService.data.checkedLayers;
				// Get Layers from edit XML
				var editLayerRecord = self.getContent(editLayers);
				// Get Layers from org XML
				var orgLayerRecord = self.layerRecord;
				if(editLayerRecord){
					for (var i=0, countI=self.layerRecord.length; i<countI; i++) { 
						var orgLayer = self.layerRecord[i];
						var orgLayerName = orgLayer.index;
						var isFound = false; 
						
						var title = orgLayer.title;
						var deactivated = true;
						var featureInfo = false;
						
						for (var j=0, countJ=editLayerRecord.length; j<countJ; j++) {
							var editLayer = editLayerRecord[j];
							var editLayerName = editLayer.index; 
							if(orgLayerName == editLayerName){
								title = editLayer.title;
								deactivated = false;
								featureInfo = editLayer.featureInfo
								isFound = true; 
							}
						}
						
						var layerIsFound = false;
						if(checkedLayers && checkedLayers.length > 0){
							for (var j=0, countJ=checkedLayers.length; j<countJ; j++) { 
								if(orgLayer.index == checkedLayers[j]){
									layerIsFound = true;
									break;
								}
							}
						}
						
						layers.push([orgLayer.index, title, deactivated, layerIsFound, featureInfo, orgLayer.legend]);
					}
					
					if(layers){
						for (var i=0, countI=layers.length; i<countI; i++) {
							var layer = layers[i];
							if(layer[2] == false){
								allDeactivated = false;
							}
							if(layer[3] == false){
								allChecked = false;
							}
							if(layer[4] == false){
								allFeatureInfo = false;
							}
							if(layer[5] == false){
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
					
					// Checkboxes for tbar
					var deactivatedTbar = {
				            xtype: 'checkbox',
				            boxLabel: 'Alle Layer verwerfen',
				            id : 'cb_deactivated',
				            checked: allDeactivated,
				            handler: function(btn) {
				    			self.allCheckboxesDeactivated(Ext.getCmp('cb_deactivated').getValue());
				    		},
							renderer: self.allCheckboxesStyle
						};

					var checkedTbar = {
				            xtype: 'checkbox',
				            boxLabel: 'Alle Layer aktvieren',
				            id : 'cb_checked',
				            checked: allChecked,
				            disabled: allDeactivated ? true : false,
				            handler: function(btn) {
				    			self.allCheckboxesChecked(Ext.getCmp('cb_checked').getValue());
				    		}
						};

					var featureInfoTbar = {
				            xtype: 'checkbox',
				            boxLabel: 'Alle Layer Infos aktvieren',
				            id : 'cb_featureInfo',
				            checked: allFeatureInfo,
				            disabled: allDeactivated ? true : false,
				            handler: function(btn) {
				            	self.allCheckboxesFeatureInfo(Ext.getCmp('cb_featureInfo').getValue());
				    		}
						};
					
					// Button for tbar
					var saveBtn = new Ext.Button({
						tooltip: 'Speichern',
						text: 'Speichern',
						disabled: false,
						buttonAlign:'right',
						handler: function(btn) {
							self.save();
						}
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
						}, 
						tbar:[saveBtn, '->', deactivatedTbar, "-", checkedTbar, "-", featureInfoTbar, ]
				    });

					self.store.loadData(layers);
					
					self.store.on('update',function(cell, record, operation) {
						var modified  = record.modified;
						if(modified){
							var modifiedData = record.data;
							if(modifiedData){
								if(modifiedData.index !== ""){
									
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
				}
			}
		}
	}
	de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.superclass.initComponent.call(this);
};

/**
 * Save the services list on the server
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.save = function() {
	var self = this;
	var layers = [];
	if(self.store.data){
		var data = self.store.data;
		if(data.items){
			var items = data.items;
			if(items){
				for (var i=0, countI=items.length; i<countI; i++) { 
					var layer = items[i];
					if(layer.data){
						layers.push(layer.data);
					}
				}
				self.updateService(self.selectedService.data, layers);
			}
		}
	}
};

/**
 * Update services changes to config
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.updateService = function(service, layers){
	var self = this;
	if(service.capabilitiesUrl){
		var service = {
				   title: service.name,
				   capabilitiesUrl: service.capabilitiesUrl,
				   capabilitiesUrlOrg: service.capabilitiesUrlOrg,
				   originalCapUrl: service.originalCapUrl,
				   categories: null,
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

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.allCheckboxesDeactivated = function(allDeactivated) {
	var self = this;
	if(self.store){
		var layers = [];
		if(self.store.data.items){
			var items = self.store.data.items;
			for (var i=0, countI=items.length; i<countI; i++) { 
				var layer = items[i].data;
				if(layer){
					if(allDeactivated != undefined){
						layer.deactivated = allDeactivated;
					}
					// fields: ['index', 'title', 'deactivated', 'checked', 'featureInfo', 'legend'],
				    layers.push([layer.index, layer.title, layer.deactivated, layer.checked, layer.featureInfo, layer.legend]);
					
				}
			}
		}
		self.store.loadData(layers);
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.allCheckboxesChecked = function(allChecked) {
	var self = this;
	if(self.store){
		var layers = [];
		if(self.store.data.items){
			var items = self.store.data.items;
			for (var i=0, countI=items.length; i<countI; i++) { 
				var layer = items[i].data;
				if(layer){
					if(allChecked != undefined){
						layer.checked = allChecked;
					}
					// fields: ['index', 'title', 'deactivated', 'checked', 'featureInfo', 'legend'],
				    layers.push([layer.index, layer.title, layer.deactivated, layer.checked, layer.featureInfo, layer.legend]);
				}
			}
		}
		self.store.loadData(layers);
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.allCheckboxesFeatureInfo = function(allFeatureInfo) {
	var self = this;
	if(self.store){
		var layers = [];
		if(self.store.data.items){
			var items = self.store.data.items;
			for (var i=0, countI=items.length; i<countI; i++) { 
				var layer = items[i].data;
				if(layer){
					if(allFeatureInfo != undefined){
						layer.featureInfo = allFeatureInfo;
					}
					// fields: ['index', 'title', 'deactivated', 'checked', 'featureInfo', 'legend'],
				    layers.push([layer.index, layer.title, layer.deactivated, layer.checked, layer.featureInfo, layer.legend]);
				}
			}
		}
		self.store.loadData(layers);
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.loadDoc = function(url) {
    var xmlhttp = null;
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    return xmlhttp.responseXML;
}


de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.displayResult = function(url){
	var self = this;
	
    var xmlDoc = self.loadDoc(url);
    return xmlDoc;
}

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.getContent = function (layers) {
	var editLayers = [];
    for (i = 0; i < layers.length; i++) { 
    	var layer = layers[i];
    	if(layer.attributes){
    		var layerAttributes = layer.attributes;
    		var queryable = "";
	    	for (j = 0; j < layerAttributes.length; j++) {
				var attribute = layerAttributes[j];
				if(attribute.nodeName == "queryable"){
					queryable = attribute.nodeValue;
				}
			}
    	}
    	if(layer.children){
    		var layerChildren = layer.children;
    		var index = "";
    		var title = "";
    		var featureinfo = (queryable == "1") ? true : false;
    		
    		for (j = 0; j < layerChildren.length; j++) {
    			var children = layerChildren[j];
    			if(children.tagName == "Title"){
    				title = children.textContent;
    			}else if(children.tagName == "Name"){
    				index = children.textContent;
    			}
    		}
    		editLayers.push({ 
				index: index,
				title: title,
				featureInfo: featureinfo
				});
    	}
    }
    return editLayers;
}