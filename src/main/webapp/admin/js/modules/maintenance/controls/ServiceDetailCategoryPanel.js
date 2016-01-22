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

/**
 * @class ServiceDetailCategoryPanel is used to manage a list of categories.
 */
Ext.define('de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel',{ 
	extend:'Ext.tree.Panel',
	id: 'serviceDetailCategoryPanel',
	title: 'Rubriken',
	autoScroll: true,
	selectedService: null,
	mainPanel:null,
	store: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
		// create the final layout
		Ext.apply(this, {
			useArrows:true,
	        animate:true,
	        autoScroll: true,
	    	enableDD:true,
	        containerScroll: true,
	        rootVisible: false,
	        draggable: false,
	        autoScroll: true,
			enableDrag: false,
	        enableDrop: false,
	        border: true,
	        bodyStyle:'padding: 10px 0',
	        listeners: {
	            'checkchange': function(node, checked){
	                if(checked){
	                	self.save(node);
	                }else{
	                    self.save(node);
	                }
	            },
				'afterrender': function(e) {
					self.mainPanel.isSave=false;
				}
	        }
		});

		de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel.superclass.initComponent.call(this);
	},
	onRender: function(){
		var self = this;
		var categories = de.ingrid.mapclient.Configuration.getValue('mapServiceCategories');
		if(typeof(categories) == "string"){
			categories = JSON.parse(categories)['mapServiceCategories'];
		}
		var data = new Array(); 
		
		if(categories){
			for (var i=0, countI=categories.length; i<countI; i++) {
				var category = categories[i];
				var subCategories = category.mapServiceCategories;
				var leafData = new Array(); 
				for (var j=0, countJ=subCategories.length; j<countJ; j++) {
					var subCategory = subCategories[j];
					var isCheck = false;
					if(self.selectedService.data.mapServiceCategories){
						for (var k=0, countK=self.selectedService.data.mapServiceCategories.length; k<countK; k++) {
							var categoryId=self.selectedService.data.mapServiceCategories[k].idx;
							if(categoryId == subCategory.idx){
									isCheck=true;
							}
						}
						
						leafData.push({
							text: subCategory.name,
					        leaf: true,
					        draggable: false,
					        enableDrag: false,
					        enableDrop: false, 
					        checked: isCheck,
					        iconCls: 'iconNone',
							id: subCategory.idx
						});
					}
				}
				data.push({
					text: category.name,
					cls: 'folder',
					expanded:true,
			        draggable: false,
			        enableDrag: false,
			        enableDrop: false, 
			        children: leafData
				});
			}
		}
		// set the root node
		self.setRootNode({
			children: data
		});
		de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel.superclass.onRender.call(this);
	},
	/**
	 * Save the services list on the server
	 */
	save: function(node) {
		var self = this;
		if(node){
			var capabilitiesUrl = null;
			var categories = [];
			if(self){
				var checkedNodes = self.getChecked();
				for (var i=0, countI=checkedNodes.length; i<countI; i++) {
					var checkedNode = checkedNodes[i];
					categories.push(checkedNode.data.id)
				}
			}
			
			if(self.selectedService.data){
				if(self.selectedService.data.capabilitiesUrl){
					capabilitiesUrl = self.selectedService.data.capabilitiesUrl;
				}
				
				if(capabilitiesUrl != null){
					var service = {
							   title: self.selectedService.data.name,
							   capabilitiesUrl: capabilitiesUrl,
							   capabilitiesUrlOrg: self.selectedService.data.capabilitiesUrlOrg,
							   originalCapUrl: self.selectedService.data.originalCapUrl,
							   categories: categories,
							   layers: null,
							   updateFlag: null
					   };
					self.mainPanel.isSave=true;
					self.mainPanel.setValue('updateservice', service, 'Bitte warten! Kategorien-&Auml;nderungen werden &uuml;bernommen!');
				}
			}
		}
	}
	
});
