/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class FeatureInfoDialog is the dialog used for displaying WMS feature infos.
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog = Ext.extend(Ext.Window, {
	title: "Feature Info",
	closable: true,
	draggable: true,
	resizable: true,
	width: 300,
	boxMaxHeight:600,
	autoHeight: true,
	shadow: false,
	hidden: true,
	closeAction: 'hide',
    autoScroll: true,
    layout: 'fit',

	/**
	 * @cfg The OpenLayers.Map instance to query feature infos for
	 */
	map: null,

	/**
	 * Boolean indicating, if the control is activated or not
	 */
	activated: false,
	callbackAreaId: null
});

/**
 * Activate the control
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.activate = function() {
	this.activated = true;
};

/**
 * Deactivate the control
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.deactivate = function() {
	this.activated = false;
	this.hide();
};

/**
 * Query the feature infos for the current map, if the control is activated
 * @param e OpenLayers.Event
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.query = function(e) {
	if (!this.activated) {
		return;
	}

	// remove all panels from preceeding calls
	this.removeAll();

	
	
	
	// use a FeatureInfoControl instance to create the GetFeatureInfo requests
	var self = this;
	var featureInfoControl = new de.ingrid.mapclient.frontend.controls.FeatureInfoControl({
		queryVisible: true,
		drillDown: true,
		eventListeners: {
			"getfeatureinfo": function(e) {
				// create a panel for each response
				var service = de.ingrid.mapclient.frontend.data.Service.findByUrl(e.url);
				if(service){
					var p = new Ext.Panel({
					title: service.getDefinition().title,
					collapsible: true,
					border: false,
					autoScroll: true,
					height:300,
					bodyStyle: 'padding: 10px',
					defaults: {
						anchor: '100%'
					},
					html: e.text
				});
				}else{
					var p = new Ext.Panel({
					title:'no title from service available',
					collapsible: true,
					border: false,
					autoScroll: true,
					height:300,
					bodyStyle: 'padding: 10px',
					defaults: {
						anchor: '100%'
					},					
					html: e.text
				});
				}
				self.add(p);
				self.doLayout();							
				
			}
			
		}
	});
	
	featureInfoControl.setMap(this.map);
	featureInfoControl.getInfoForClick(e);
	this.show();
};
/**
 * Query the feature infos for the current map, if the control is activated
 * @param e OpenLayers.Event
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.checkAdministrativeUnits = function(e) {
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
     var urlAppendix = '?url='+de.ingrid.mapclient.Configuration.getValue("featureUrl")+'%26REQUEST%3DGetFeatureInfo%26LAYERS%3D08%2C9%2C10%26QUERY_LAYERS%3D8%2C9%2C10%26STYLES' +
    		'%3D%2C%2C%26BBOX%3D'+lonlat.lon+'%252C'+lonlat.lat+'%252C'+(lonlat.lon+0.00005)+'%252C'+(lonlat.lat+0.00005)+'%26' +
    				'FEATURE_COUNT%3D10%26HEIGHT%3D508%26WIDTH%3D1711%26FORMAT%3Dimage%252Fpng%26INFO_FORMAT%3Dtext%252Fxml%26SRS%3DEPSG%253A4326%26X%3D1020%26Y%3D173';
    		
	var url = de.ingrid.mapclient.WMS_ADMIN_INFO_PROXY_URL+urlAppendix;			

	Ext.Ajax.request({
		url:url,
		method: 'GET',
		success: function(response, request) {
		var p = new Ext.FormPanel({
					title:'Auswahl zu Suchanfrage hinzuf&uuml;gen',
					border: false,
					autoScroll: true,
					autoWidth:true,
					autoHeight: true,
					bodyStyle: 'padding: 10px',
					defaults: {
						anchor: '100%'
					},
//					html: response.responseText
					items:{
							xtype: 'radiogroup',
                            fieldLabel: 'Auswahl',
                            columns:1,
                            id:"AdministrativeSelection",
                            items: self.decodeResponse(response.responseText) 
                          },
        			buttons: [{
				            text: 'Hinzuf&uuml;gen',
				            handler: function(){
				               if(p.getForm().isValid()){
				                       var values =  p.getForm().getValues(false);
				                       self.callbackAreaId(values['AdminInfos']);
				                       self.hide();
				                }
				            }
					        },{
					            text: 'Abbrechen',
					            handler: function(){
					                p.destroy();
					                self.hide();
					            }
					        }]
				});

				self.add(p);
				self.doLayout();							
				self.show();	
		},
		failure: function(response, request) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.FEATURE_FAILURE);
			}
	});				
			
	
};
/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.initComponent = function() {
	de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.superclass.onRender.apply(this, arguments);
};
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.decodeResponse = function(responseText){
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
};
