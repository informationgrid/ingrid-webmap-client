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
					for (var i=0, countI=orgLayerRecord.length; i<countI; i++) { 
						var orgLayer = orgLayerRecord[i];
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

						layers.push( {
								index: orgLayer.index,
								title: title, 
								deactivated: deactivated, 
								checked: layerIsFound, 
								featureInfo: featureInfo, 
								legend:orgLayer.legend, 
								expanded:orgLayer.expanded, 
								_id:orgLayer.id, 
								_parent:orgLayer.parent, 
								_is_leaf:orgLayer.is_leaf
								});
					}
					
					if(layers){
						for (var i=0, countI=layers.length; i<countI; i++) {
							var layer = layers[i];
							if(layer.deactivated == false){
								allDeactivated = false;
							}
							if(layer.checked == false){
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
					
					// create the data store
				    var record = Ext.data.Record.create([
				   		{name: 'index'},
				   		{name: 'title'},
				     	{name: 'deactivated', type: 'bool'},
				     	{name: 'checked', type: 'bool'},
				     	{name: 'featureInfo', type: 'bool'},
				     	{name: 'expanded', type: 'bool'},
				     	{name: 'reload', type: 'bool'},
				     	{name: '_id', type: 'string'},
				     	{name: '_parent', type: 'string'},
				     	{name: '_is_leaf', type: 'bool'}
				   	]);
				    self.store = new Ext.ux.maximgb.tg.AdjacencyListStore({
				    	defaultExpanded : true,
			    	    autoLoad : true,
						reader: new Ext.data.JsonReader({id: '_id'}, record),
						proxy: new Ext.data.MemoryProxy(layers),
						isExpandedNode : function(record) {
							if ("ux_maximgb_tg_expanded" in record) {
								return record.ux_maximgb_tg_expanded;
			                }else{
			                	if(record.data.reload == true){
			                		if(record.data.expanded == true){
				                		record.ux_maximgb_tg_expanded = true;
				                	}else{
				                		record.ux_maximgb_tg_expanded = false;
				                	}
			                	} else{
			                		record.ux_maximgb_tg_expanded = true;
			                	}
			                }
			            }
				    });
				    
				    self.store.on('update',function(cell, record, operation) {
				    	var data = record.data;
				    	if(data){
				    		var deactivated = data.deactivated;
				    		var checked = data.checked;
				    		var featureInfo = data.featureInfo;

				    		var modified  = record.modified;
							if(modified){
								var modifiedDeactivated = modified.deactivated;
					    		var modifiedChecked = modified.checked;
					    		var modifiedFeatureInfo = modified.featureInfo;

								if(deactivated){
									if(deactivated == modifiedDeactivated || (deactivated && modifiedDeactivated === undefined)){
										if((modifiedChecked !== undefined && modifiedChecked != checked) || (modifiedFeatureInfo !== undefined && modifiedFeatureInfo != featureInfo)){
											record.reject();
										}
									}
								}
							}

				    	}
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
										
				    // create the Grid
				    var grid = new Ext.ux.maximgb.tg.EditorGridPanel({
				      store: self.store,
				      layout: 'fit',
				      border: false,
				      master_column_id : 'title',
				      columns: [{
				            id:'title',
				            header: "Name",
				            width: 160, 
				            sortable: true,
				            dataIndex: 'title',
				            editor: new Ext.grid.GridEditor(new Ext.form.TextField(), {
				                offsets : [-4, -5],
				                realign : function(auto_size)
				                {
				                    var size;

				                    this.boundEl = this.boundEl.child('.ux-maximgb-tg-mastercol-editorplace');
				                    Ext.grid.GridEditor.prototype.realign.call(this, auto_size);

				                    size = this.boundEl.getSize();
				                    this.setSize(size.width + 10, size.height);
				                }
				            }),
				            renderer : function(v, meta, record, row_idx, col_idx, store)
				            {
				                return [
				                   '<img src="', Ext.BLANK_IMAGE_URL, '" class="ux-maximgb-tg-mastercol-icon" />',
				                   '<span class="ux-maximgb-tg-mastercol-editorplace">', (record.get('deactivated')) ? '<span style="font-style: italic; color:#C0C0C0;">'+v+'</span>': v, '</span>'
				                ].join('');
				            }
				        }, {
				            header: "Verwerfen", 
				            xtype: 'checkcolumn',
				            align: 'center',
				            width: 75, 
				            sortable: true, 
				            dataIndex: 'deactivated'
				        }, {
				            header: "Aktivieren", 
				            xtype: 'checkcolumn',
				            align: 'center',
				            width: 75, 
				            sortable: true, 
				            dataIndex: 'checked'
				        }, {
				            header: "Feature Info",
				            xtype: 'checkcolumn',
				            align: 'center',
				            width: 75, 
				            sortable: true, 
				            dataIndex: 'featureInfo'
				        }
				      ],
				      stripeRows: true,
				      autoExpandColumn: 'title',
				      viewConfig : {
				      	enableRowBody : true
				      },
				      listeners: {
				    	  	'beforeedit': function(e) {
				    		  if(e.record.get('deactivated')) {
				    			  e.cancel = true;
				    		  }
				    	  	},
  							'afteredit': function(e) {
  								var editValue = e.value;
  								var editValueOriginal = e.originalValue;
  								var editValueParent = e.record.data._parent;
  								var editValueIndex = e.record.data.index;
  								if(editValue == ""){
  									Ext.Msg.show({
  									   title:'Ung&uuml;ltiger Layername',
  									   msg: 'Layername ist nicht g&uuml;ltig. Die &Auml;nderungen des Layers werden zur&uuml;ckgesetzt!',
  									   buttons: Ext.Msg.OK,
  									   icon: Ext.MessageBox.ERROR,
  									   fn: function(btn){
  										   if (btn == 'ok'){
  											 e.record.reject();  										   }
  									   	}
  									});
  								}else{
  									if(e.grid.store.data){
  										var data = e.grid.store.data;
  										if(data.items){
  											var items = data.items;
  											var isDuplicat = false;
  											for (var i=0, countI=items.length; i<countI; i++) {
  												var item = items[i];
  												if(editValueIndex != item.data.index){
	  												if(editValue == item.data.title && editValueParent == item.data._parent){
	  													Ext.Msg.show({
	  				  									   title:'Ung&uuml;ltiger Layername',
	  				  									   msg: 'Layername existiert schon. Die &Auml;nderungen des Layers werden zur&uuml;ckgesetzt!',
	  				  									   buttons: Ext.Msg.OK,
	  				  									   icon: Ext.MessageBox.ERROR,
	  				  									   fn: function(btn){
	  				  										   if (btn == 'ok'){
	  				  											 e.record.reject();
	  				  										   }
	  				  									   	}
	  				  									});
	  												}
  												}
  											}
  										}
  									}
  								}
    						},
    						'removed': function(e) {
    							if(!self.mainPanel.isSave){
    								if(e.store){
        								if(e.store.modified){
        									if(e.store.modified.length > 0){
        										Ext.Msg.show({
     		  									   title:'&Auml;nderungen speichern',
     		  									   msg: 'Am vorherigen Dienst wurden &Auml;nderungen vorgenommen. Sollen diese &Auml;nderungen gespeichert werden?',
     		  									   buttons: Ext.Msg.OKCANCEL,
     		  									   icon: Ext.MessageBox.QUESTION,
     		  									   fn: function(btn){
     		  										   if (btn == 'ok'){
     		  											  self.save();
     		  										   }
     		  									   }
        										});
        									}
            							}
        							}
    							}
    						},
    						'afterrender': function(e) {
    							self.mainPanel.isSave=false;
    						}
				      },
				    	tbar:[saveBtn, '->', deactivatedTbar, "-", checkedTbar, "-", featureInfoTbar, ]
				    });
					// create the final layout
					Ext.apply(this, {
						items: [grid],
						layout : 'fit'
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
						var layerData = layer.data;
						if(layerData.deactivated){
							layerData.checked = false;
						}
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
		self.mainPanel.isSave = true;
		self.mainPanel.setValue('updateservice', service, 'Bitte warten! Layer-&Auml;nderungen werden &uuml;bernommen!', false, false, false);
	}
};

de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.prototype.allCheckboxesDeactivated = function(allDeactivated) {
	var self = this;
	if(self.store){
		var layers = [];
		if(self.store.data.items){
			var items = self.store.data.items;
			for (var i=0, countI=items.length; i<countI; i++) { 
				var layer = items[i].data;
				var expanded = items[i].ux_maximgb_tg_expanded;
				if(layer){
					if(allDeactivated != undefined){
						layer.deactivated = allDeactivated;
					}
					layer.expanded = expanded;
					layer.reload = true;
					layers.push(layer);
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
				var expanded = items[i].ux_maximgb_tg_expanded;
				if(layer){
					if(allChecked != undefined){
						layer.checked = allChecked;
					}
					layer.expanded = expanded;
					layer.reload = true;
					layers.push(layer);
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
				var expanded = items[i].ux_maximgb_tg_expanded;
				if(layer){
					if(allFeatureInfo != undefined){
						layer.featureInfo = allFeatureInfo;
					}
					layer.expanded = expanded;
					layer.reload = true;
				    layers.push(layer);
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