/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");

/**
 * @class ServiceDetailCategoryPanel is used to manage a list of categories.
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel = Ext.extend(Ext.Panel, {
	title: 'Kategorie',
	autoScroll: true,
	serviceStore: null,
	selectedCategory: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel.prototype.initComponent = function() {
	var self = this;
	
	 var tree = new Ext.tree.TreePanel({
	        useArrows:true,
	        autoScroll:true,
	        animate:true,
	        enableDD:true,
	        containerScroll: true,
	        rootVisible: false,
	        frame: true,
	        draggable: false,
	        enableDrag: false,
	        enableDrop: false, 
	        listeners: {
	            'checkchange': function(node, checked){
	                if(checked){
	                	node.getUI().addClass('complete');
	                	self.save(node);
	                }else{
	                	node.getUI().removeClass('complete');
	                    self.save(node);
	                }
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
				for (var k=0, countK=this.selectedCategory.json.length; k<countK; k++) {
					var categoryId=this.selectedCategory.json[k];
					if (categoryId instanceof Array){
						for (var l=0, countL=categoryId.length; l<countL; l++) {
							var id = categoryId[l];
							if(id == subCategory.id){
							isCheck=true;
							}
						}
					}
				}
				
				leafData.push({
					text: subCategory.name,
			        leaf: true,
			        draggable: false,
			        enableDrag: false,
			        enableDrop: false, 
			        checked: isCheck,
			        id: subCategory.id
				});
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
	var root = new Ext.tree.AsyncTreeNode({
		children: data
	});

	tree.setRootNode(root);
	// create the final layout
	Ext.apply(this, {
		items: [tree]
	});	
	
	de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel.superclass.initComponent.call(this);
};

/**
 * Save the services list on the server
 */
de.ingrid.mapclient.admin.modules.maintenance.ServiceDetailCategoryPanel.prototype.save = function(node) {
	if(node){
		var title = '';
		var originalCapUrl = '';
		var capabilitiesUrl = '';
		var categories = [];
		var layers = [];
		var checkedLayers = [];
		
		if(this.selectedCategory.json){
			if(this.selectedCategory.json[0]){
				title = this.selectedCategory.json[0];
			}
			if(this.selectedCategory.json[1]){
				capabilitiesUrl = this.selectedCategory.json[1];
			}
		
			if(this.selectedCategory.json[3]){
				categories = this.selectedCategory.json[3];
				var nodeIsCheck = false;
				var nodeId = false;
				
				if(node.attributes){
					if(node.attributes.checked){
						categories.push(node.attributes.id);
					}else{
						for (var i=0, countI=categories.length; i<countI; i++) {
							if(categories[i] == node.attributes.id){
								categories.remove(i-1);
							}
						}
					}
				}
				
			}
			
			if(this.selectedCategory.json[4]){
				originalCapUrl = this.selectedCategory.json[4];
			}
			
			if(this.selectedCategory.json[5]){
				layers = this.selectedCategory.json[5];
			}
			
			if(this.selectedCategory.json[6]){
				checkedLayers = this.selectedCategory.json[6];
			}
		}

		var service = {
				   title: null,
				   capabilitiesUrl: capabilitiesUrl,
				   originalCapUrl: null,
				   categories: categories,
				   layers: null,
				   checkedLayers: null
		   };
		de.ingrid.mapclient.Configuration.setValue('updateservice', Ext.encode(service), de.ingrid.mapclient.admin.DefaultSaveHandler);
	}
};