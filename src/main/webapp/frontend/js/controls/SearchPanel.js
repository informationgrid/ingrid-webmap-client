/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class SearchPanel is the dialog used for adding a new service to the list
 * of active services.
 */
de.ingrid.mapclient.frontend.controls.SearchPanel = Ext.extend(Ext.Panel, {
	id : 'searchPanel',
	title : i18n('tSuche'),
	autoScroll : true,
	searchField : null,
	searchButton : null,
	panel : null,
	layout: 'fit',
	bodyCssClass: 'background',
	bodyStyle: 'padding:5px;',
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SearchPanel.prototype.initComponent = function() {
	var self = this; 
	
	this.searchField = {
			id : 'searchField',
			name : "searchField",
			emptyText: i18n('tSuchbegriff'),
			allowBlank : false,
			xtype : 'textfield',
			style : 'padding: 0px 5px;'
	};

	this.searchButton = {
			id : 'searchButton',
			name : 'searchButton',
			text : i18n('tSuchen'),
			xtype : 'button',
			formBind : true,
			handler : function() {
				var searchCategoryPanel = Ext.getCmp("searchResults");
				if(searchCategoryPanel){
					searchCategoryPanel.destroy();
				}
				self.search(Ext.getCmp("searchField").getValue());
			}
	};
	
	this.resultPanel = new Ext.Panel({});
	
	this.panel = new Ext.Panel({
		bodyStyle: 'padding:5px; background: transparent;',
		items:[{
			xtype: 'container',
			layout: 'column',
			anchor: '100%',
			items: [
			        this.searchField,
			        this.searchButton
			]
		}]
	});
	
	var self = this;
	Ext.apply(this, {
		items: [self.panel]
	});

	de.ingrid.mapclient.frontend.controls.SearchPanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SearchPanel.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.SearchPanel.superclass.onRender.apply(this, arguments);

};

de.ingrid.mapclient.frontend.controls.SearchPanel.prototype.search = function(searchTerm) {
	var self = this;
	
	var responseHandler = {
		success : function(responseText) {
			de.ingrid.mapclient.Message.showInfo(de.ingrid.mapclient.Message.SEARCH_SUCCESS);
		},
		failure : function(responseText) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.SEARCH_FAILURE);
		}
	};
	var url = de.ingrid.mapclient.SEARCH_URL + "?searchTerm=" + searchTerm;
	Ext.Ajax.request({
		url : url,
		method : 'GET',
		success : function(response, request) {
			var resp = Ext.decode(response.responseText);
			
			var searchCategoryPanel = new de.ingrid.mapclient.frontend.controls.SearchCategoryPanel({
						id : 'searchResults',
						serviceCategory : resp
			});

			self.panel.add(searchCategoryPanel);
			self.panel.doLayout();
			if (responseHandler	&& responseHandler.success instanceof Function) {
				responseHandler.success(response.responseText);
			}
		},
		failure : function(response, request) {
			if (responseHandler && responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		}
	});
};