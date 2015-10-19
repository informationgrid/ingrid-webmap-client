/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
Ext.namespace("de.ingrid.mapclient.frontend.data");


de.ingrid.mapclient.frontend.data.BWaStrUtils = function() {

};

de.ingrid.mapclient.frontend.data.BWaStrUtils.createVectorLayer = function (self, points){
    
    // Clear draw
    de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVector");
    de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVectorTmp");
    de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");
    
    // Textfield selection
    var bWaStrVector = self.map.getLayersBy("id", "bWaStrVector");
    if(bWaStrVector.length == 0){
        bWaStrVector = new OpenLayers.Layer.Vector("BWaStr Locator", {
            styleMap: new OpenLayers.StyleMap(
                    new OpenLayers.Style(
                        {}, 
                        {
                            rules:[new OpenLayers.Rule({
                                title: "Gesamtstrecke",
                                symbolizer: {
                                    fillColor: "red", 
                                    strokeColor: "red", 
                                    strokeWidth: 2
                                }
                            })]
                        }
                    )
                )
            }
        );
        bWaStrVector.id = "bWaStrVector";
        self.map.addLayer(bWaStrVector);
    }else{
        bWaStrVector = bWaStrVector[0];
    }
    bWaStrVector.setVisibility(true);
    
    var pointFeatures = [];
    var firstPoint = null;
    var lastPoint = null;
    
    if(points instanceof Array){
        points.forEach(function(entry1) {
            var linePoints = [];
            entry1.forEach(function(entry2) {
                if(firstPoint == null){
                    firstPoint = entry2;
                }else{
                    lastPoint = entry2;
                }
                linePoints.push(entry2.point);
            });
            pointFeatures.push(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(linePoints, null)));
        });
    }
    bWaStrVector.addFeatures(pointFeatures);
    
    // Custom lines
    var bWaStrVectorTmp = self.map.getLayersBy("id", "bWaStrVectorTmp");
    if(bWaStrVectorTmp.length == 0){
        bWaStrVectorTmp = new OpenLayers.Layer.Vector("BWaStr Locator", {
            styleMap: new OpenLayers.StyleMap(
                new OpenLayers.Style(
                    {}, 
                    {
                        rules:[new OpenLayers.Rule({
                            title: "Teilstrecke",
                            symbolizer: {
                                fillColor: "blue", 
                                strokeColor: "blue", 
                                strokeWidth: 2
                            }
                        })]
                    }
                ))
            }
        );
        bWaStrVectorTmp.id = "bWaStrVectorTmp";
        self.map.addLayer(bWaStrVectorTmp);
    }else{
        bWaStrVectorTmp = bWaStrVectorTmp[0];
    }
    bWaStrVectorTmp.setVisibility(false);
    
    // Markers
    var bWaStrMarker = self.map.getLayersByName("bWaStrVectorMarker");
    if(bWaStrMarker.length == 0){
    	bWaStrMarker = new OpenLayers.Layer.Markers( "bWaStrVectorMarker", {
    		displayInLayerSwitcher: false
    	});
    	bWaStrMarker.id = "bWaStrVectorMarker";
    	self.map.addLayer(bWaStrMarker);
    }else{
    	bWaStrMarker = bWaStrMarker[0];
    }
   
    if(firstPoint){
        de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,firstPoint.point.x,firstPoint.point.y,de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([firstPoint.point.x, firstPoint.point.y, firstPoint.measure], self), "red");
    }
    if(lastPoint){
        de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,lastPoint.point.x,lastPoint.point.y,de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([lastPoint.point.x, lastPoint.point.y, lastPoint.measure], self), "red");
    }
    
    if(bWaStrVector){
        self.map.zoomToExtent(bWaStrVector.getDataExtent());
        self.map.zoomTo(self.map.getZoom() - 1);
    }
};
de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker = function (self, layer, lon, lat, popupContentHTML, color, defaultDisplay) {
     
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
   if(defaultDisplay){
       if (feature.popup == null) {
            feature.popup = feature.createPopup(feature.closeBox);
            self.map.addPopup(feature.popup);
            feature.popup.show();
        } 
   }else{
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

   }
   layer.addMarker(marker);
};

de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer = function(map, name) {
    var bWaStrVector = map.getLayersBy("id", name);
    if(bWaStrVector){
        for(var i=0; i<bWaStrVector.length;i++){
            bWaStrVector[i].setVisibility(false);
            bWaStrVector[i].removeAllFeatures();
        }
    }
};

de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker = function(map, name) {
    var bWaStrMarker = map.getLayersBy("id", name);
    var bWaStrVector = map.getLayersBy("id", "bWaStrVector");
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
            if(value.toString().indexOf(",") > -1){
                value = value.toString().replace(",", ".");
                value = parseFloat(value);
            }
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
        var projection;
        if(self.map.projection instanceof OpenLayers.Projection){
            projection = self.map.projection.projCode;
        }else{
            projection = self.map.projection;
        }
        var content = '{"limit":200,"queries":[{"qid":1,"bwastrid":"'
            + rec.data.bwastrid +'","stationierung":{"km_von":'
            + km_von + ',"km_bis":'
            + km_bis + ',"offset":0},"spatialReference":{"wkid":'
            + projection.split(":")[1] + '}}]}';
        de.ingrid.mapclient.frontend.data.BWaStrUtils.loadLayerData(self, "/ingrid-webmap-client/rest/jsonCallback/queryPost?url=" + de.ingrid.mapclient.Configuration.getSettings("viewBWaStrGeokodierung")+ "&data=" + content);
    }
};
de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate = function (values, self){
    var r = values[0];
    var h = values[1];
    var s = values[2];
    if(!(r instanceof String)){
        r = de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(r);
    }
    if(!(h instanceof String)){
        h = de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(h);
    }
    if(!(s instanceof String)){
        s = de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(s, 3);
    }
    
    var strR = self.map.displayProjection.proj.units == "degrees" ? 'L&auml;nge [Dezimalgrad]:' : 'Rechtswert [m]:';
    var strH = self.map.displayProjection.proj.units == "degrees" ? 'Breite [Dezimalgrad]:' : 'Hochwert [m]:';
    
    var popUpTmp = "<table style=''>" +
        "<tr><td>" + strR + "</td><td>" + r.toString().replace(".", ",") + "</td></tr>" +
        "<tr><td>" + strH + "</td><td>" + h.toString().replace(".", ",") + "</td></tr>" +
        "<tr><td>Station [km]:</td><td>" + s.toString().replace(".", ",") + "</td></tr>" +
    "</table>";
    return popUpTmp;
};

de.ingrid.mapclient.frontend.data.BWaStrUtils.loadLayerData = function(self, url){
    Ext.getBody().mask('Layer wird erstellt ...');
    var ajax = Ext.Ajax.request({
        url: url,
        method: 'GET',
        success: function(response, request) {
            Ext.getBody().unmask();
            if(response){
                if(response.responseText){
                    var data = JSON.parse(response.responseText);
                    if(data){
                        if(data.result){
                            var results = data.result;
                            for(var i=0; i<results.length; i++){
                                var result = results[i];
                                var name = result.bwastr_name;
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
                                                if(coordinate instanceof Array){
                                                    var pointsRoad = [];
                                                    for(var k=0; k<coordinate.length;k++){
                                                        var coordinateEntry = coordinate[k];
                                                        var measure = "0";
                                                        if(measures[count]){
                                                            measure = measures[count];
                                                        }
                                                        pointsRoad.push({"point": new OpenLayers.Geometry.Point(coordinateEntry[0], coordinateEntry[1]), "measure": measure});
                                                        count++;
                                                    }
                                                    pointsRoad.sort(function(a, b){
                                                        var measureA = a.measure;
                                                        var measureB = b.measure;
                                                        if(measureA < measureB) return -1;
                                                        if(measureA > measureB) return 1;
                                                        return 0;
                                                    });
                                                    points.push(pointsRoad);
                                                }
                                            }
                                        }
                                        de.ingrid.mapclient.frontend.data.BWaStrUtils.createVectorLayer(self, points);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        failure: function(response, request) {
            Ext.getBody().unmask();
        }
    });
};