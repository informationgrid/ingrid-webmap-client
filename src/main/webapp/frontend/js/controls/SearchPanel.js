/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
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
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class SearchPanel is the dialog used for adding a new service to the list
 * of active services.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.SearchPanel', {
	extend: 'Ext.Panel',
	id : 'searchPanel',
    title : i18n('tSuche'),
	searchField : null,
	searchButton : null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
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
		
		var panel = Ext.create('Ext.form.Panel', {
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
		
		var panelResult = Ext.create('Ext.panel.Panel', {
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
		this.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		this.superclass.onRender.apply(this, arguments);
	},
	search: function(searchTerm) {
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
						searchCategoryPanel.add(Ext.create('Ext.panel.Panel', {
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
	}
});