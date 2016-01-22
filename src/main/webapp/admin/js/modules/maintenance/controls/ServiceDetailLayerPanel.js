/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");
// this variable stores the attribute of checked box of our layers(which one)
var globalSelectedLayerCheckbox;
/**
 * @class ServiceDetailLayerPanel is used to manage a list of map projections.
 */
Ext.define('de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel', { 
	extend:'Ext.tree.Panel',
	id: 'serviceDetailLayerPanel',
    title: 'Layer',
    activeNode: null,
	selectedService: null,
	mainPanel:null,
	store:null,
	layerRecord:[],
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
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
							var orgLayerName = orgLayer.name;
							var isFound = false; 
							
							var title = orgLayer.title;
							var deactivated = true;
							var featureInfo = false;
							
							for (var j=0, countJ=editLayerRecord.length; j<countJ; j++) {
								var editLayer = editLayerRecord[j];
								var editLayerName = editLayer.name; 
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
									if(orgLayer.name == checkedLayers[j]){
										layerIsFound = true;
										break;
									}
								}
							}

							layers.push( {
								name: orgLayer.name,
								text: title, 
								deactivated: deactivated, 
								checkedLayer: layerIsFound, 
								featureInfo: featureInfo, 
								parent:orgLayer.parent, 
								leaf:orgLayer.leaf
							});
						}
						
						Ext.define('DetailLayer', {
							extend: 'Ext.data.Model',
					        fields: [
				               // set up the fields mapping into the xml doc
				               // The first needs mapping, the others are very basic
				               {name: 'name'},
				               {name: 'text'},
				               {name: 'deactivated'},
				               {name: 'checkedLayer'},
				               {name: 'featureInfo'}
				           ]
						});
						
						// create the data store
					    self.store = Ext.create('Ext.data.TreeStore', {
					    	model: 'DetailLayer',
			                root: {
					            expanded: true,
					            children: self.createLayerStructure(layers)
					        }
					    });

					    self.store.on('update',function(cell, record, operation) {
					    	var data = record.data;
					    	if(data){
					    		var deactivated = data.deactivated;
					    		var checked = data.checkedLayer;
					    		var featureInfo = data.featureInfo;

					    		var modified  = record.modified;
								if(modified){
									//check if record has children and/or is disabled
									if (de.ingrid.mapclient.Configuration.getSettings("defaultLayerSelection")) {
										self.checkChildrenAndSelf(record);
									}
									
									if (record.data.deactivated) {
										record.data.checkedLayer = false;
										record.data.featureInfo = false;
									}
								}

					    	}
						});
						
						// Button for tbar
						var saveBtn = Ext.create('Ext.Button', {
							tooltip: 'Speichern',
							text: 'Speichern',
							id: 'serviceDetailLayerPanelBtnSave',
							disabled: false,
							buttonAlign:'right',
							handler: function(btn) {
								self.save();
							}
						});
											
						// create the final layout
						Ext.apply(this, {
							id:'serviceDetailLayerPanelTree',
						      store: self.store,
						      border: true,
						      autoScroll: true,
						      useArrows: true,
						      rootVisible: false,
						      multiSelect: true,
						      plugins: [Ext.create('Ext.grid.plugin.CellEditing', {
						            clicksToEdit: 2
						      })],
						      columns: {
						    	  items: [
						    	          {
							            header: "Name",
							            sortable: false,
							            dataIndex: 'text',
							            xtype: 'treecolumn',
							            editor:{
							            	xtype:'textfield'
						            	},
							            flex: 1
							        }, {
							            header: "Verwerfen", 
							            xtype: 'checkcolumn',
							            align: 'center',
							            sortable: false, 
							            dataIndex: 'deactivated',
							            flex: .1
							        }, {
							            header: "Aktivieren", 
							            xtype: 'checkcolumn',
							            align: 'center',
							            sortable: false, 
							            dataIndex: 'checkedLayer',
							            flex: .1
							        }, {
							            header: "Feature Info",
							            xtype: 'checkcolumn',
							            align: 'center',
							            sortable: false, 
							            dataIndex: 'featureInfo',
							            flex: .1
							        }
							      ],
							        columnsText: 'Spalten',
						            sortAscText: 'A-Z sortieren',
						            sortDescText: 'Z-A sortieren'
						      },
						      stripeRows: true,
						      viewConfig : {
						      	enableRowBody : true,
								columnsText: 'Spalten',
					            sortAscText: 'A-Z sortieren',
					            sortDescText: 'Z-A sortieren'
						      },
						    	tbar:[saveBtn, '->']
						});
					}
				}
			}
		}
		de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailLayerPanel.superclass.initComponent.call(this);
	},
	createLayerStructure: function(layers){
		var structure = [];
		var parentIndex = '';
		if(layers){
			for(var i=0; i<layers.length;i++){
				var layer = layers[i];
				if(layer.parent == null){
					structure.push({
						name: layer.name,
						text: layer.text, 
						deactivated: layer.deactivated, 
						checkedLayer: layer.checkedLayer, 
						featureInfo: layer.featureInfo, 
						leaf: layer.leaf,
						expanded: true,
						iconCls: 'iconNone',
						children: []
					});
					this.getLayerStructureChild(structure[structure.length-1].children, layers, layer.name);
				}
			}
		}
		return structure;
	},
	getLayerStructureChild: function(children, layers, parentId){
		if(layers){
			for(var i=0; i<layers.length;i++){
				var layer = layers[i];
				if(layer.parent == parentId){
					children.push({
						name: layer.name,
						text: layer.text, 
						deactivated: layer.deactivated, 
						checkedLayer: layer.checkedLayer, 
						featureInfo: layer.featureInfo, 
						leaf: layer.leaf,
						expanded: true,
						iconCls: 'iconNone',
						children: []
					});
					this.getLayerStructureChild(children[children.length-1].children, layers, layer.name);
				}
			}
		}
	},
	/**
	 * Save the services list on the server
	 */
	save: function() {
		var self = this;
		var layers = [];
		var data = this.getStoreData(layers, self.store.tree.root.childNodes);
		self.updateService(self.selectedService.data, layers);
	},
	getStoreData: function (layers, nodes){
		for(var i=0; i<nodes.length;i++){
			var node = nodes[i];
			layers.push({
				name: node.data.name,
				title: node.data.text, 
				deactivated: node.data.deactivated, 
				checked: node.data.checkedLayer, 
				featureInfo: node.data.featureInfo, 
				leaf: node.data.leaf
			})
			if(node.childNodes){
				this.getStoreData(layers, node.childNodes);
			}
		}
		return layers;
	},
	/**
	 * Update services changes to config
	 */
	updateService: function(service, layers){
		var self = this;
		if(service.capabilitiesUrl){
			
			var categories = [];
			var mapServiceCategories = service.mapServiceCategories;
			for ( var iCat = 0; iCat < mapServiceCategories.length; iCat++) {
				var catId = mapServiceCategories[iCat].idx;
				categories.push(catId);
			}
			
			var saveService = {
				title: service.name,
				capabilitiesUrl: service.capabilitiesUrl,
				capabilitiesUrlOrg: service.capabilitiesUrlOrg,
				originalCapUrl: service.originalCapUrl,
				categories: categories,
				layers: layers,
				updateFlag: null
			};
			// Update service
			self.mainPanel.isSave = true;
			self.mainPanel.setValue('updateservice', saveService, 'Bitte warten! Layer-&Auml;nderungen werden &uuml;bernommen!', false, false, false);
		}
	},
	loadDoc: function(url) {
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
	},
	displayResult: function(url){
		var self = this;
		
	    var xmlDoc = self.loadDoc(url);
	    return xmlDoc;
	},
	getContent: function (layers) {
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
	    	if(layer.childNodes){
	    		var layerChildren = layer.childNodes;
	    		var index = "";
	    		var title = "";
	    		var featureinfo = (queryable == "1") ? true : false;
	    		
	    		for (j = 0; j < layerChildren.length; j++) {
	    			var children = layerChildren[j];
	    			if(children.tagName == "Title"){
	    				if(children.textContent){
	    					title = children.textContent;
	    				}else{
	    					title = children.text;
	    				}
	    				
	    			}else if(children.tagName == "Name"){
	    				if(children.textContent){
	    					index = children.textContent;
	    				}else{
	    					index = children.text;
	    				}
	    			}
	    		}
	    		editLayers.push({ 
					name: index,
					title: title,
					featureInfo: featureinfo
					});
	    	}
	    }
	    return editLayers;
	},
	/**
	 * this function iterates through the adjancy list and (un)checks the children of the record accrodingly
	 * it is necesary because we use an extension as a loader and not a genuine tree structure provided by Ext
	 * @param {} record
	 * @return {}
	 */
	checkChildrenAndSelf: function(record) {
		//if our parent is deactivated we dont do anything
		var parent;
		if (parent = record.data.parent) {
			var thisParent = this.store.data.get(parent);
			if (thisParent.data.deactivated) {
				if(!record.data.deactivated)
					record.data.deactivated = true;
//				record.reject();
				return;
			}
		}
		
		var children = record.childNodes;
		for(var i=0; i<children.length;i++){
			var child = children[i];
			child.data.checkedLayer = record.data.checkedLayer;
		}
	}
});


