/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class FeatureInfoDialog is the dialog used for displaying WMS feature infos.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.FeatureInfoDialog', {
	extend: 'Ext.Window',
	id:'featureInfoDialog',
	title: i18n('tFeatureInfo'),
	closable: true,
	draggable: true,
	resizable: true,
	shadow: false,
	width: 800,
	height: 400,
	hidden: true,
	closeAction: 'hide',
    layout: 'fit',
    constrain: true,

	/**
	 * @cfg The OpenLayers.Map instance to query feature infos for
	 */
	map: null,

	/**
	 * Boolean indicating, if the control is activated or not
	 */
	activated: false,
	callbackAreaId: null,
	/**
	 * Activate the control
	 */
	activate: function() {
		this.activated = true;
	},
	/**
	 * Deactivate the control
	 */
	deactivate: function() {
		this.activated = false;
		this.hide();
	},
	/**
	 * Query the feature infos for the current map, if the control is activated
	 * @param e OpenLayers.Event
	 */
	query: function(e) {
		if (!this.activated) {
			return;
		}

		// remove all panels from preceeding calls
		this.removeAll();

		// use a FeatureInfoControl instance to create the GetFeatureInfo requests
		var self = this;
		var featureInfoControl = Ext.create('de.ingrid.mapclient.frontend.controls.FeatureInfoControl' ,{
			queryVisible: true,
			drillDown: true,
			eventListeners: {
				"getfeatureinfo": function(e) {
					// create a panel for each response
					var isAddTab = false;
					if(e.layers){
						if(e.layers[0]){
							var service = de.ingrid.mapclient.frontend.data.Service.findByLayer(e.layers[0]);
							var tab;
							var tabPanel;
							
							if(service){
								tab = {
							        title : service.getDefinition().title,
							        html  : e.text,
							        autoScroll: true,
							        bodyStyle: 'font-size:16px;',
							        closeable: true
							    };
								isAddTab = true;
							}
						}
					}
					
					if(isAddTab == false){
						tab = {
					        title : i18n('tNoTitle'),
					        html  : e.text,
					        autoScroll: true,
					        bodyStyle: 'font-size:16px;',
					        closeable: true
					    };
					}
					if(self.items.length == 0){
						tabPanel = new Ext.TabPanel({
					        activeTab         : 0,
					        enableTabScroll   : true
					    });
					}else{
						tabPanel = self.items.items[0];
					}
					tabPanel.add(tab);
					self.add(tabPanel);
					self.doLayout();							
				}
			}
		});
		
		featureInfoControl.setMap(this.map);
		featureInfoControl.getInfoForClick(e);
		this.show();
	},
	/**
	 * Query the feature infos for the current map, if the control is activated
	 * @param e OpenLayers.Event
	 */
	checkAdministrativeUnits: function(e) {
		if (!this.activated) {
			return;
		}
		var self = this;
		// remove all panels from preceeding calls
		this.removeAll();
		
		// use a FeatureInfoControl instance to create the GetFeatureInfo requests
		var self = this;
		// this method gives us only 2 params, but we need four
		var lonlat = self.map.getLonLatFromViewPortPx(e.xy);
	    // we build the url from our featureUrl the parameters and the rest/wms url
		// this appendix is only valid with the url: http://gdz.bkg.bund.de/wms_vg250 because we pick certain layers (8,9,10) this needs some redoing for
		// generalisation
	    var urlAppendix = '?url='+de.ingrid.mapclient.Configuration.getValue("featureUrl");

	    urlAppendix = urlAppendix.replace("%LAT%", lonlat.lat);
	    urlAppendix = urlAppendix.replace("%LON%", lonlat.lon);
	    urlAppendix = urlAppendix.replace("%LAT2%", lonlat.lat+0.00005);
	    urlAppendix = urlAppendix.replace("%LON2%", lonlat.lon+0.00005);
	    urlAppendix = urlAppendix.replace("%EPSG%", self.map.projection);

	    var url = de.ingrid.mapclient.WMS_ADMIN_INFO_PROXY_URL+urlAppendix;			
		Ext.Ajax.on('beforerequest', self.showSpinner, self);
		Ext.Ajax.on('requestcomplete', self.hideSpinner, self);
		Ext.Ajax.on('requestexception', self.hideSpinner, self);
		Ext.Ajax.request({
			url:url,
			method: 'GET',
			timeout: 3000,
			success: function(response, request) {
				var items = self.decodeResponse(response.responseText); 
				if(items.length != 0){
				var p = new Ext.FormPanel({
						header:false,
						border: false,
						autoScroll: true,
						autoWidth:true,
						autoHeight: true,
						bodyStyle: 'padding: 10px',
						defaults: {
							anchor: '100%'
						},

						items:{
								xtype: 'radiogroup',
	                            fieldLabel: i18n('tAuswahlZuSuchanfrageHinzufuegen'),
	                            columns:1,
	                            id:"AdministrativeSelection",
	                            items: items
	                          },
	        			buttons: [{
						            text: i18n('tHinzufuegen'),
						            handler: function(){
						               if(p.getForm().isValid()){
						                       var values =  p.getForm().getValues(false);
						                       self.callbackAreaId(values['AdminInfos']);
						                       self.hide();
						                }
						            }
						        },{
						            text: i18n('tAbbrechen'),
						            handler: function(){
						                p.destroy();
						                self.hide();
						            }
						        }]
					});
					self.add(p);
					self.doLayout();
					self.show();
				}else{
					de.ingrid.mapclient.Message.showInfo(i18n('tRaumbezugAuszerhalbDesFeldes'));
					}
			},
			failure: function(response, request) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.FEATURE_FAILURE);
				}
		});						
	},
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		this.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	decodeResponse: function(responseText){
		var data=Ext.decode(responseText);
		var items = []

		for(var i = 0; i < data.length; i++){
			var item = {
		      name: 'AdminInfos',
		      inputValue: data[i]['rs'],
		      boxLabel: data[i]['type']+': '+data[i]['name']
			}
			items.push(item);		    
		}
		return items;
	},
	onRender: function() {
		this.superclass.onRender.apply(this, arguments);
	},
	showSpinner: function(){
		Ext.MessageBox.show({
			id:'featureInfoMsgBox',	
			title: i18n('tPleaseWait'),
			msg: i18n('tRequestingData'),
			width:250,
			wait:true,
			waitConfig: {interval:100},
			closable:false,
			animEl: 'mb5'
		});
	},
	hideSpinner: function(){
		Ext.MessageBox.hide();
	}
});
