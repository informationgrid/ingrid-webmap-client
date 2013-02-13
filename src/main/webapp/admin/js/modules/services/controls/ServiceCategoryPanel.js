/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.services");

/**
 * @class ServiceCategoryPanel is used to manage WMS servers in hierarchical categories.
 */
de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel = Ext.extend(de.ingrid.mapclient.admin.controls.CategoryPanel, {
	dropBoxTitle: 'Rubrik l&ouml;schen'
});

/**
 * Display the wms capabilities for the given url
 * @return url Url of a WMS server
 */
de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.prototype.showCapabilities = function(url) {
	window.open(de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl(url));
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.getCategoriesName
 */
de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.prototype.getCategoriesName = function() {
	return de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.CATEGORIES_NAME;
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createPanel
 */
de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.prototype.createPanel = function(path) {
	var panel = null;

	if (path.length == 3) {
		// for paths of length 3 we build a GridPanel instance for managing services
		var self = this;
		var columns = [{
			header: 'Name',
			sortable: true,
			dataIndex: 'name',
			editor: {
			   xtype: 'textfield',
			   disabled: true
			}
		}, {
			header: 'Capabilities Url',
			sortable: true,
			dataIndex: 'capabilitiesUrl',
			editor: {
			   xtype: 'textfield',
			   disabled: true
			}
		}];


			columns.push({
				header: 'Info',
				sortable: false,
				id: 'capabilities',
			    width: 10,
			    renderer: function(v, p, record, rowIndex){
			        return '<div class="iconInfo"></div>';
			    }
			});
			

		panel = new Ext.grid.GridPanel({
			store: this.getStoreManager().getStore(path),
			columns: columns,
			autoScroll:true,
			autoHeight: true,
			autoWidth:true,
			viewConfig: {
			forceFit: true
			}
		});

	}
	else {
		// for other paths we build a CategoryPanel instance for managing sub categories
		panel = de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.superclass.createPanel.call(this, path);
	}

	return panel;
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createInstance
 */
de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.prototype.createInstance = function(config) {
	return new de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel(config);
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.bindEventHandlers
 */
de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.prototype.bindEventHandlers = function(panel) {
	if (panel instanceof Ext.grid.GridPanel) {
		var self = this;

		panel.on('datachanged', function(e) {
			self.save();
		});
		// show capabilities if clicking the capabilities icon
	    panel.on('cellclick', function(grid, rowIndex, columnIndex, e) {
			if(columnIndex == grid.getColumnModel().getIndexById('capabilities')) {
				var url = grid.getSelectionModel().getSelected().get('capabilitiesUrl');
				self.showCapabilities(url);
			}
	    });
		// prevent propagating events up to parent grid
		panel.getEl().swallowEvent(['click', 'mousedown', 'keydown', 'mouseover', 'contextmenu', 'dblclick'], true);
	}
};

/**
 * @see de.ingrid.mapclient.admin.controls.CategoryPanel.createStore
 */
de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.prototype.createStore = function(path, category) {
	var store = null;

	if (path.length == 3) {
		// create the service store for path length 3
		// we do this by hand now, since categories dont maintain services anymore
		var services = [];
		var wmsServices = de.ingrid.mapclient.Configuration.getValue("wmsServices");
			for(var j = 0; j < wmsServices.length; j++){
				for(var k = 0;k < wmsServices[j].mapServiceCategories.length; k++)
				if(category.idx == wmsServices[j].mapServiceCategories[k].idx){
				var tempService = new Object();
				tempService.name = wmsServices[j].name;
				tempService.capabilitiesUrl = wmsServices[j].capabilitiesUrl;
				services.push(tempService);
				
				}
			}
				
		store = new Ext.data.ArrayStore({
			autoDestroy: false, // the component will be destroyed when categories are sorted, but the store should remain
			fields: [{
				name: 'name',
				type: 'string'
			}, {
				name: 'capabilitiesUrl',
				type: 'string'
			}]
		});
		store.setBaseParam("type", "services");
		this.initializeStore(store, services);
	}
	else {
		// for other paths we create a categories store
		store = de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.superclass.createStore.call(this, path, category);
	}

	return store;
};

de.ingrid.mapclient.admin.modules.services.ServiceCategoryPanel.CATEGORIES_NAME = 'mapServiceCategories';
