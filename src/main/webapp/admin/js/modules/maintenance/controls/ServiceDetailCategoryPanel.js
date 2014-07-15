/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");

/**
 * @class ServiceDetailCategoryPanel is used to manage a list of categories.
 */
Ext.define('de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel',{ 
	extend:'Ext.panel.Panel',
	id: 'serviceDetailCategoryPanel',
	title: 'Rubriken',
	autoScroll: true,
	selectedService: null,
	mainPanel:null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
		this.tree = Ext.create('Ext.tree.Panel', {
	        useArrows:true,
	        animate:true,
	        enableDD:true,
	        containerScroll: true,
	        rootVisible: false,
	        draggable: false,
	        enableDrag: false,
	        enableDrop: false,
	        border: false,
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
		
		var categories = de.ingrid.mapclient.Configuration.getValue('mapServiceCategories');
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
		self.tree.setRootNode({
			children: data
		});
		
		// create the final layout
		Ext.apply(this, {
			items: [self.tree]
		});	
		
		de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel.superclass.initComponent.call(this);
	},
	/**
	 * Save the services list on the server
	 */
	save: function(node) {
		var self = this;
		if(node){
			var capabilitiesUrl = null;
			var categories = [];
			if(self.tree){
				var checkedNodes = self.tree.getChecked();
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