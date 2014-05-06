/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class PositionDialog is the dialog used for displaying WMS feature infos.
 */
de.ingrid.mapclient.frontend.controls.PositionDialog = Ext.extend(Ext.Window, {
	id:'positionDialog',
	title: i18n('tPositionInfo'),
	closable: true,
	draggable: true,
	resizable: true,
	shadow: false,
	width: 420,
	height: 120,
	hidden: true,
	closeAction: 'hide',
    layout: 'fit',
    constrain: true,
    centerPanelEl: null,
    x: 350,
	/**
	 * @cfg The OpenLayers.Map instance to query feature infos for
	 */
	map: null,

	/**
	 * Boolean indicating, if the control is activated or not
	 */
	activated: false,
	isPoint: false,
	formPanel: null,
	markers:null
});

/**
 * Activate the control
 */
de.ingrid.mapclient.frontend.controls.PositionDialog.prototype.activate = function(isPoint) {
	this.isPoint = isPoint;
	this.activated = true;
};

/**
 * Deactivate the control
 */
de.ingrid.mapclient.frontend.controls.PositionDialog.prototype.deactivate = function() {
	this.isPoint = false;
	this.activated = false;
	this.hide();
};

/**
 * Query the feature infos for the current map, if the control is activated
 * @param e OpenLayers.Event
 */
de.ingrid.mapclient.frontend.controls.PositionDialog.prototype.point = function(e) {
	if (!this.isPoint) {
		return;
	}
	
	this.hide();
	
	this.formPanel.removeAll();
	this.formPanel.setTitle(i18n('tPositionErmitteln'));
	
	var lonlat = this.map.getLonLatFromPixel(e.xy);
	this.isPoint = true;
	
	var fieldLabel = '';
	if(this.map.displayProjection.projName == "tmerc"){
		fieldLabel = i18n('tPositionGK');
	}else if(this.map.displayProjection.projName == "utm"){
		fieldLabel = i18n('tPositionUTM');
	}else{
		fieldLabel = i18n('tPositionWGS');
	}
	
	this.formPanel.add({
		id: 'position',
        fieldLabel: fieldLabel,
        value: lonlat.lat +  " / " + lonlat.lon,
        labelStyle: 'width:140px;' 
    });
		
	var projections = de.ingrid.mapclient.Configuration.getValue('projections');
	var data = [];
	
	for (var i = 0; i < projections.length; i++) {
		var projection = projections[i];
		data.push([projection.epsgCode, projection.name]);
	}
	
	var store = new Ext.data.ArrayStore({
        id: 0,
        fields: [
            'id',
            'display'
        ],
        data: data
    });
	
	this.show();
};

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.PositionDialog.prototype.initComponent = function() {
	var self = this;
	
	self.formPanel = new Ext.FormPanel({
        labelWidth: 75, // label settings here cascade unless overridden
        frame:true,
        bodyStyle:'padding:5px 5px 0',
        width: 420,
        defaults: {width: 230},
        defaultType: 'textfield',

        items: [],

        buttons: [{
        	id:'btnPositionCenter',
            text: i18n('tKoordinatenZentrieren'),
	        handler: function () {
	        	var position = null;
				
	        	if(self.isPoint){
	        		var textfieldValue = Ext.getCmp('position').getValue();
	        		var positionLat = textfieldValue.split(" / ")[0];
        			var positionLon = textfieldValue.split(" / ")[1];
        			position = new OpenLayers.LonLat(positionLon,positionLat);
        			
        			self.map.setCenter(position);
	        	}
	        }
        },{
        	id:'btnPositionShow',
            text: i18n('tInKarteAnzeigen'),
	        handler: function () {
	        	var position = null;
				
	        	if(self.isPoint){
	        		var textfieldValue = Ext.getCmp('position').getValue();
	        		var positionLat = textfieldValue.split(" / ")[0];
        			var positionLon = textfieldValue.split(" / ")[1];
        			position = new OpenLayers.LonLat(positionLon,positionLat);
        			
        			if(self.markers){
        				self.map.removeLayer(self.markers);
        			}
        			
        			self.markers = new OpenLayers.Layer.Markers( "Markers" );
        			self.map.addLayer(self.markers);

        			var size = new OpenLayers.Size(21,25);
        			var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        			var icon = new OpenLayers.Icon('/ingrid-webmap-client/shared/images/icon_pin_green.png', size, offset);
        			self.markers.addMarker(new OpenLayers.Marker(position,icon));
	        	}
	        }
        },{
        	id:'btnPositionHide',
            text: i18n('tMarkerEntfernen'),
	        handler: function () {
	        	if(self.markers){
    				self.map.removeLayer(self.markers);
    			}
	        	self.markers = null;
	        }
        },{
        	id:'btnPositionClose',
            text: i18n('tSchliessen'),
	        handler: function () {
	        	self.hide();
	        }
        }]
	});
	
	Ext.apply(this, {
		items: self.formPanel
	});
	de.ingrid.mapclient.frontend.controls.PositionDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.PositionDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.PositionDialog.superclass.onRender.apply(this, arguments);
};
