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
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class PositionDialog is the dialog used for displaying WMS feature infos.
 */

Ext.define('de.ingrid.mapclient.frontend.controls.PositionDialog', {
	extend: 'Ext.Window',
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
	markers:null,
	/**
	 * Activate the control
	 */
	activate: function(isPoint) {
		this.isPoint = isPoint;
		this.activated = true;
	},
	/**
	 * Deactivate the control
	 */
	deactivate: function() {
		this.isPoint = false;
		this.activated = false;
		this.hide();
	},
	/**
	 * Query the feature infos for the current map, if the control is activated
	 * @param e OpenLayers.Event
	 */
	point: function(e) {
		if (!this.isPoint) {
			return;
		}
		
		this.hide();
		
		this.formPanel.removeAll();
		
		var lonlat = this.map.getLonLatFromPixel(e.xy);
		this.isPoint = true;
		
		var fieldLabel = "";
		var fieldValue = "";
		
		if(this.map.displayProjection.proj){
			if(this.map.displayProjection.proj.projName == "tmerc"){
				fieldLabel = i18n('tPositionGK');
				fieldValue = lonlat.lon +  " " + lonlat.lat;
			}else if(this.map.displayProjection.proj.projName == "utm"){
				fieldLabel = i18n('tPositionUTM');
				fieldValue = lonlat.lon +  " " + lonlat.lat;
			}
		}
		
		if(fieldLabel == ""){
			fieldLabel = i18n('tPositionWGS');
		}
		
		if(fieldValue == ""){
			fieldValue = lonlat.lon +  " " + lonlat.lat;
		}
		
		this.formPanel.add({
			id: 'position',
	        fieldLabel: fieldLabel,
	        value: fieldValue,
	        labelStyle: 'width:140px;' 
	    });
			
		var projections = de.ingrid.mapclient.Configuration.getValue('projections');
		var data = [];
		
		for (var i = 0; i < projections.length; i++) {
			var projection = projections[i];
			data.push([projection.epsgCode, projection.name]);
		}
		
		var store = Ext.create('Ext.data.ArrayStore', {
	        id: 0,
	        fields: [
	            'id',
	            'display'
	        ],
	        data: data
	    });
		
		// Add to BWaStr
		var bWaStrDialog = Ext.getCmp("bWaStrDialog");
	    if(bWaStrDialog){
	    	if(bWaStrDialog.isVisible()){
	    		var radio_bwastrCoordsToKm = Ext.getCmp("radio_bwastrCoordsToKm");
	    		if(radio_bwastrCoordsToKm){
	    			if(radio_bwastrCoordsToKm.checked){
	        			var textarea_coordsToKmQuery = Ext.getCmp("textarea_coordsToKmQuery");
	        			if(textarea_coordsToKmQuery){
	        				var content = textarea_coordsToKmQuery.getRawValue().trim();
	        				var value = (de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(lonlat.lon) + "").replace(".", ",") +  " " + (de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(lonlat.lat) + "").replace(".", ",");
	        				if(content == ""){
	        					content = value;	
	        				}else{
	        					content = content + "\n" + value;
	        				}
	        				textarea_coordsToKmQuery.setValue(content);
	        				textarea_coordsToKmQuery.el.dom.scrollTop = 99999;
	        			}
	        		}
	    		}
	    	}else{
	    		this.show();
	    	}
	    }else{
	    	this.show();
	    }
	},
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		
		self.formPanel = Ext.create('Ext.form.Panel', {
	        labelWidth: 75, // label settings here cascade unless overridden
	        autoFit: true,
			frame:true,
			border: false,
			bodyStyle: {
				padding: "5px"
			},
	        width: 420,
	        defaults: {
	        	anchor: '100%'
	        },
	        defaultType: 'textfield',
	        items: [],

	        buttons: [{
	        	id:'btnPositionStation',
	            text: 'Stationierung',
	            hidden: de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable") ? false : true,
		        handler: function () {
		        	var position = null;
					
		        	if(self.isPoint){
		        		position = self.getPosition();
		        		if(position){
		        			var content = "";
		        			content = content + '{"limit":200,"queries":[';
		        			content = content + '{"qid":1,"geometry":{"type":"Point","coordinates":['+ position.lon +','+ position.lat +'],"spatialReference":{"wkid":'+ self.map.getProjection().split(":")[1] +'}}}';
		        			content = content + ']}';
		        			self.loadData("/ingrid-webmap-client/rest/jsonCallback/queryPost?url=" + de.ingrid.mapclient.Configuration.getSettings("viewBWaStrStationierung")+ "&data=" + content, self.addStationPin);
		        		}
		        	}
		        }
	        },{
	        	id:'btnPositionCenter',
	            text: i18n('tKoordinatenZentrieren'),
		        handler: function () {
		        	var position = null;
					
		        	if(self.isPoint){
		        		position = self.getPosition();
		        		if(position){
		        			self.map.setCenter(position);
		        		}
		        	}
		        }
	        },{
	        	id:'btnPositionShow',
	            text: i18n('tInKarteAnzeigen'),
		        handler: function () {
		        	var position = null;
					
		        	if(self.isPoint){
		        		position = self.getPosition();
		        		if(position){
			        		if(self.markers){
			        			var markerList = self.markers.markers;
			        			self.clearMarkers(markerList);
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
		        }
	        },{
	        	id:'btnPositionHide',
	            text: i18n('tMarkerEntfernen'),
		        handler: function () {
		        	if(self.markers){
		        		var markerList = self.markers.markers;
		        		self.clearMarkers(markerList);
		        		self.map.removeLayer(self.markers);
	    			}
		        	self.markers = null;
		        }
	        }]
		});
		
		Ext.apply(this, {
			items: self.formPanel
		});
		de.ingrid.mapclient.frontend.controls.PositionDialog.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		de.ingrid.mapclient.frontend.controls.PositionDialog.superclass.onRender.apply(this, arguments);
	},
	getPosition: function() {
		var self = this;
		var textfieldValue = Ext.getCmp('position').getValue().trim();
		var positionLat = "";
		var positionLon = "";
		var splitValues = textfieldValue.replace(/\s{2,}/g, ' ');
		
		if(splitValues){
			splitValues = splitValues.split(" ");
		}
		
		if(splitValues && splitValues.length == 1){
			splitValues = textfieldValue.split("\t");
		}
		
		if(self.map.displayProjection.proj){
			if(self.map.displayProjection.proj.projName == "tmerc"){
				positionLat = splitValues[1];
				positionLon = splitValues[0];
			}else if(self.map.displayProjection.proj.projName == "utm"){
				positionLat = splitValues[1];
				positionLon = splitValues[0];
			}else{
				positionLat = splitValues[1];
				positionLon = splitValues[0];
			}
		}else{
			positionLat = splitValues[1];
			positionLon = splitValues[0];
		}
		
		if(positionLat && positionLon){
			return new OpenLayers.LonLat(positionLon.replace(",", "."),positionLat.replace(",", "."));
		}else{
			return null;
		}
	},
	loadData: function(url, callback){
		var self = this;
		Ext.getBody().mask('Daten werden berechnet ...');
		var ajax = Ext.Ajax.request({
			url: url,
			method: 'GET',
			success: function(response, request) {
				Ext.getBody().unmask();
				if(response){
					var data = JSON.parse(response.responseText);
					if(data){
						if(data.result){
							var results = data.result;
							for(var i=0; i<results.length; i++){
								var result = results[i]
								if(result.error){
				    				Ext.MessageBox.alert('Fehler', 'Fehler bei der Abfrage! (' + result.error.message + ')');
				    			}else{
				    				callback(result, self);
				    			}
							}
						}else if(data.error){
							Ext.MessageBox.alert('Fehler', 'Keine Stationierungsdaten vorhanden!');
						}
					}
				}
			},
			failure: function(response, request) {
				Ext.getBody().unmask();
			}
		});
	},
	addStationPin: function(result, self){
		var position = self.getPosition();
		if(position){
			if(self.markers){
				var markerList = self.markers.markers;
				self.clearMarkers(markerList);
				self.map.removeLayer(self.markers);
			}
			
			self.markers = new OpenLayers.Layer.Markers( "Markers" );
			de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, self.markers, position.lon, position.lat, self.createPopUpTemplate(self, result), "blue", true);
			self.map.addLayer(self.markers);
		}
	},
	createPopUpTemplate: function (self, result){
		var popUpTmp = "";
		if(result){
			var r = result.geometry.coordinates[0];
			var h = result.geometry.coordinates[1];
			var s = result.stationierung.km_wert;
			var o = result.stationierung.offset;
			if(!(r instanceof String)){
				r = de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(r);
			}
			if(!(h instanceof String)){
				h = de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(h);
			}
			if(!(s instanceof String)){
				s = de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(s, 3);
			}
			if(!(o instanceof String)){
				o = de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(o, 3);
			}
			
			var strR = self.map.displayProjection.proj.units == "degrees" ? 'L&auml;nge [Dezimalgrad]:' : 'Rechtswert [m]:';
			var strH = self.map.displayProjection.proj.units == "degrees" ? 'Breite [Dezimalgrad]:' : 'Hochwert [m]:';
			
			popUpTmp = "<table style=''>";
			popUpTmp = popUpTmp + "<tr><td>BWaStr-IdNr:</td><td>" + result.bwastrid + "</td></tr>";
			popUpTmp = popUpTmp + "<tr><td>BWaStr-Bezeichnung:</td><td>" + result.bwastr_name + "</td></tr>";
			popUpTmp = popUpTmp + "<tr><td>Streckenbezeichnung:</td><td>" + result.strecken_name + "</td></tr>";
			popUpTmp = popUpTmp + "<tr><td>" + strR + "</td><td>" + r + "</td></tr>";
			popUpTmp = popUpTmp + "<tr><td>" + strH + "</td><td>" + h + "</td></tr>";
			popUpTmp = popUpTmp + "<tr><td>Station [km]:</td><td>" + s + "</td></tr>";
			popUpTmp = popUpTmp + "<tr><td>Abstand [m]:</td><td>" + o + "</td></tr>";
			popUpTmp = popUpTmp + "</table>";
		}
		return popUpTmp;
	},
	clearMarkers: function (markerList){
		if(markerList){
			for(var i=0; i<markerList.length; i++){
				var markerEntry = markerList[i];
				if(markerEntry.feature){
					if(markerEntry.feature.popup){
						markerEntry.feature.popup.toggle();
					}
				}
			}
		}
	}
});
