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
	searchField : null,
	searchButton : null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SearchPanel.prototype.initComponent = function() {
	var self = this; 
	
	this.on("expand", function(){
		var searchResults = Ext.getCmp("searchResults");
		if(searchResults){
			searchResults.reloadTreeUI();
		}
	});
	
	this.searchField = {
			id : 'searchField',
			name : "searchField",
			emptyText: i18n('tSuchbegriff'),
			formBind : true,
			hideLabel: true,
			anchor:'100%',
			allowBlank : true,
			xtype : 'textfield'
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
	
	var panel = new Ext.FormPanel({
		bodyStyle: 'padding:5px; background: transparent;',
		layout: 'form',
		style: 'border-bottom: 0',
		items:[
		    {
				html: i18n('tSuchbegriffEingeben'),
				border: false,
				bodyCssClass: 'background font'
			},
			this.searchField,
		    this.searchButton,
		    {
	    	   xtype: 'container',
	    	   height: 10
		    }],
	    keys:[{ key: [Ext.EventObject.ENTER], handler: this.searchButton.handler
		}]
	});
	
	var panelResult = new Ext.Panel({
		id: 'panelSearchResult',
		border: false,
		layout: 'fit'
	});
	
	var self = this;
	Ext.apply(this, {
		items: [
		  panel, 
		  panelResult
		],
		bodyCssClass: 'background',
		bodyStyle: 'padding: 4px;',
		autoScroll: true
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
	
	var myMask = new Ext.LoadMask(Ext.getBody(), { msg:i18n('tPleaseWaitSearch') });
	myMask.show();
	
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
			myMask.hide();
			var resp = Ext.decode(response.responseText);
			var mapServiceCategories = de.ingrid.mapclient.Configuration.getValue("mapServiceCategories");
			var searchCategoryPanel = new de.ingrid.mapclient.frontend.controls.SearchCategoryPanel({
						id : 'searchResults',
						serviceCategory : resp,
						border: false,
						metadataWindowStartY: 50 * mapServiceCategories.length + 50
			});
			
			var panel = Ext.getCmp('panelSearchResult');
			panel.add(searchCategoryPanel);
			if(resp){
				if(resp.length == 0){
					searchCategoryPanel.add(new Ext.Panel({
						id: 'panelSearchNoHits',
						bodyStyle: 'padding:8px; background: transparent;',
						layout: 'form',
						bodyCssClass: 'smaller-leaf-padding',
						style: 'border-bottom: 0',
						items:[
						    {
								html: i18n('tKeineTreffer'),
								border: false
							}]
					}));
				}
			}
			panel.doLayout();
			
			if (responseHandler	&& responseHandler.success instanceof Function) {
				responseHandler.success(response.responseText);
			}
		},
		failure : function(response, request) {
			myMask.hide();
			if (responseHandler && responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		}
	});
};