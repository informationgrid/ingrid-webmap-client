/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.data");


de.ingrid.mapclient.frontend.data.BWaStrUtils = function() {

};

de.ingrid.mapclient.frontend.data.BWaStrUtils.createVectorLayer = function (self, points, firstPoint, lastPoint){
	
	// Clear draw
	de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVector");
	de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVectorTmp");
	de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");
	
	// Textfield selection
	var bWaStrVector = self.map.getLayersByName("bWaStrVector");
	if(bWaStrVector.length == 0){
		bWaStrVector = new OpenLayers.Layer.Vector("bWaStrVector", {
			styleMap: new OpenLayers.StyleMap({'default':{
				 fillColor: "red", 
				 strokeColor: "red", 
		         strokeWidth: 2
		    }})
		});
		self.map.addLayer(bWaStrVector);
	}else{
		bWaStrVector = bWaStrVector[0];
	}
	bWaStrVector.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(points, null))]);
	
	// Custom lines
	var bWaStrVectorTmp = self.map.getLayersByName("bWaStrVectorTmp");
	if(bWaStrVectorTmp.length == 0){
		bWaStrVectorTmp = new OpenLayers.Layer.Vector("bWaStrVectorTmp", {
			styleMap: new OpenLayers.StyleMap({'default':{
				 fillColor: "blue", 
				 strokeColor: "blue", 
		         strokeWidth: 2
		    }})
		});
		self.map.addLayer(bWaStrVectorTmp);
	}else{
		bWaStrVectorTmp = bWaStrVectorTmp[0];
	}
	
	// Markers
	var bWaStrMarker = self.map.getLayersByName("bWaStrVectorMarker");
	if(bWaStrMarker.length == 0){
		bWaStrMarker = new OpenLayers.Layer.Markers( "bWaStrVectorMarker" );
		self.map.addLayer(bWaStrMarker);
	}else{
		bWaStrMarker = bWaStrMarker[0];
	}
	
	if(firstPoint){
		var marker = de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,firstPoint[0],firstPoint[1],firstPoint[2], "red");
		bWaStrMarker.addMarker(marker);
	}
	
	if(lastPoint){
		var marker = de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,lastPoint[0],lastPoint[1],lastPoint[2], "red");
		bWaStrMarker.addMarker(marker);
	}
	
	if(bWaStrVector){
		self.map.zoomToExtent(bWaStrVector.getDataExtent());
	}
};
de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker = function (self, layer, lon, lat, popupContentHTML, color) {
	 
    var ll = new OpenLayers.LonLat(lon, lat);
    var data = {};
    var size = new OpenLayers.Size(21,25);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	if(color=="red"){ 
		data.icon = new OpenLayers.Icon('/ingrid-webmap-client/shared/images/icon_pin_red.png', size, offset);
    }
    if(color=="blue"){
    	data.icon = new OpenLayers.Icon('/ingrid-webmap-client/shared/images/icon_pin_blue.png', size, offset);
    }

   var feature = new OpenLayers.Feature(layer, ll, data); 
   feature.closeBox = false;
   feature.popupClass = OpenLayers.Class(OpenLayers.Popup.FramedCloud,{autoSize: true } );
   feature.data.popupContentHTML = popupContentHTML;
   feature.data.overflow = "hidden";
   
   var marker = new OpenLayers.Marker(ll,data.icon);
   marker.feature = feature;

   var markerClick = function(evt) {
        if (this.popup == null) {
            this.popup = this.createPopup(this.closeBox);
            self.map.addPopup(this.popup);
            this.popup.show();
        } else {
            this.popup.toggle();
        }
        OpenLayers.Event.stop(evt);
    };
    marker.events.register("mousedown", feature, markerClick);
    marker.events.register("mouseover", feature, markerClick);
    marker.events.register("mouseout", feature, markerClick);

    return marker;
};

de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer = function(map, name) {
	var bWaStrVector = map.getLayersByName(name);
	if(bWaStrVector){
		for(var i=0; i<bWaStrVector.length;i++){
			bWaStrVector[i].removeAllFeatures()
		}
	}
};

de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker = function(map, name) {
	var bWaStrMarker = map.getLayersByName(name);
	var bWaStrVector = map.getLayersByName("bWaStrVector");
	var isVectorVisible = false;
	
	if(bWaStrVector.length > 0){
		if(bWaStrVector[0].features.length > 0){
			isVectorVisible = true;
		}
	}
	if(bWaStrMarker){
		for(var i=0; i<bWaStrMarker.length;i++){
			var marker = bWaStrMarker[i];
			for(var j=0; j<marker.markers.length;j++){
				if(isVectorVisible){
					if(j != 0 && j != 1){
						marker.removeMarker(marker.markers[j]);
						j--;
					}
				}else{
					marker.removeMarker(marker.markers[j]);
					j--;
				}
			}
		}
	}
};

de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue = function (value, index){
	if(value){
		if(index){
			value = Math.round(value * Math.pow(10,index)) / Math.pow(10,index) ;
		}else{
			if(value.toString().indexOf(".") > -1){
				var splitValue = value.toString().split(".");
				if(splitValue[0].length < 3){
					value = Math.round(value * Math.pow(10,8)) / Math.pow(10,8) ;
				}else{
					value = Math.round(value * Math.pow(10,2)) / Math.pow(10,2) ;
				}
			}
		}
	}
	return value;
};

de.ingrid.mapclient.frontend.data.BWaStrUtils.renderLayer = function(rec, self){
	if(rec.data){
		var km_von = rec.data.km_von;
    	var km_bis = rec.data.km_bis;
    	var projection = self.map.projection;
    	var content = '{"limit":200,"queries":[{"qid":1,"bwastrid":"'
    		+ rec.data.bwastrid +'","stationierung":{"km_von":'
    		+ km_von + ',"km_bis":'
    		+ km_bis + ',"offset":0},"spatialReference":{"wkid":'
    		+ projection.split(":")[1] + '}}]}';
    	de.ingrid.mapclient.frontend.data.BWaStrUtils.loadLayerData(self, "/ingrid-webmap-client/rest/jsonCallback/queryPost?url=http://atlas.wsv.bvbs.bund.de/bwastr-locator-qs/rest/geokodierung/query&data=" + content);
	}
};
de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate = function (values){
	var popUpTmp = "<div style=''>" +
		"Rechtswert [m]: " + values[0] + "<br>" +
		"Hochwert [m]: " + values[1] + "<br>" +
		"Station [km]: " + values[2] + "<br>" +
	"</div>";
	return popUpTmp;
};

de.ingrid.mapclient.frontend.data.BWaStrUtils.loadLayerData = function(self, url){
	var loadingMask = new Ext.LoadMask(Ext.getBody(), { msg:'Layer wird erstellt ...' });
	loadingMask.show();
	var ajax = Ext.Ajax.request({
		url: url,
		method: 'GET',
		success: function(response, request) {
			if(response){
				if(response.responseText){
					var data = JSON.parse(response.responseText);
					if(data){
						if(data.result){
							var results = data.result;
			    			for(var i=0; i<results.length; i++){
			    				var result = results[i];
			    				var name = result.bwastr_name;
			    				var firstPoint = null;
			    				var lastPoint = null;
			    				var geometry = result.geometry;
			    				if(geometry){
			    					if(geometry.type == "MultiLineString"){
			    						var coordinates = geometry.coordinates;
			    						var measures = geometry.measures;
			    	    	    		var count = 0;
			    	    	    		var points = [];
			    						if(coordinates){
			    							for(var j=0; j<coordinates.length;j++){
			    								var coordinate = coordinates[j];
			    								if(coordinate  instanceof Array){
			    									for(var k=0; k<coordinate.length;k++){
			    										var coordinateEntry = coordinate[k];
			    										var measure = "0";
			    		        	    				if(measures[count]){
			    		        	    					measure = measures[count];
			    		        	    				}
			    		        	    				if(k == 0){
					    									if(firstPoint == null){
							        	    					firstPoint = [coordinateEntry[0],coordinateEntry[1], de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([coordinateEntry[0], coordinateEntry[1], measure])];
					    									}
					    								}
			    		        	    				if(count == measures.length -1){
						        	    					lastPoint = [coordinateEntry[0],coordinateEntry[1], de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([coordinateEntry[0], coordinateEntry[1], measure])];
			    		        	    				}
					    								points.push(new OpenLayers.Geometry.Point(coordinateEntry[0], coordinateEntry[1]));
					    								count++;
			    									}
			    								}else{
			    									points.push(new OpenLayers.Geometry.Point(coordinate[0], coordinate[1]));
			    								}
			    							}
			    						}
			    						de.ingrid.mapclient.frontend.data.BWaStrUtils.createVectorLayer(self, points, firstPoint, lastPoint);
			    					}
			    				}
			    			}
						}
					}
				}
			}
			loadingMask.hide();
		},
		failure: function(response, request) {
			loadingMask.hide();
		}
	});
};