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
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class BWaStr is the dialog used for BWaStr Locator.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.BWaStrPanelResult', {
    extend: 'Ext.Panel',
    cls: 'bWaStrPanelResult',
    columns: null,
    store: null,
    data: null,
    map: null,
    /**
     * Initialize the component (called by Ext)
     */
    initComponent: function() {
        var self = this;
        this.columns = [{
                header   : self.map.displayProjection.proj.units == "degrees" ? 'L&auml;nge [Dezimalgrad]' : 'Rechtswert [m]', 
                sortable : false, 
                dataIndex: 'rechtswert',
                flex: 1 
            },
            {
                header   : self.map.displayProjection.proj.units == "degrees" ? 'Breite [Dezimalgrad]' : 'Hochwert [m]', 
                sortable : true, 
                dataIndex: 'hochwert',
                flex: 1 
            },
            {
                header   : 'Station [km]', 
                sortable : true, 
                dataIndex: 'station',
                flex: 1 
            }
        ];
        
        this.store = Ext.create('Ext.data.ArrayStore', {
            fields:[
              {name: 'rechtswert'},
              {name: 'hochwert'},
              {name: 'station'},
              {name: 'id'}
            ],
             sortInfo: {
                field: 'id',
                    direction: 'ASC'
              }
        });
        
        var tableData = [];
        var pointFeatures = [];
        var firstPoint = null;
        var lastPoint = null;
        var singlePoint = null;
        
        if(this.data){
            var geometry = this.data.geometry;
            if(geometry){
                if(geometry.coordinates){
                    var coordinates = geometry.coordinates;
                    var measures = geometry.measures;
                    var count = 0;
                    var points = [];
                    for(var i=0; i<coordinates.length;i++){
                        var coordinatesValues = coordinates[i];
                        if(coordinatesValues instanceof Array){
                            var pointsRoad = [];
                            for(var j=0; j<coordinatesValues.length; j++){
                                var coordinatesValue = coordinatesValues[j];
                                var measure = "0";
                                if(measures[count]){
                                    measure = measures[count];
                                }
                                tableData.push([(de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinatesValue[0]) + "").replace(".", ","), (de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinatesValue[1]) + "").replace(".", ","), (de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(measure, 3) + "").replace(".", ","), de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(measure, 3)]);
                                pointsRoad.push({"point": new OpenLayers.Geometry.Point(coordinatesValue[0], coordinatesValue[1]), "measure": measure});
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
                        }else{
                            var measure = "0";
                            if(measures[0]){
                                measure = measures[0];
                            }
                            singlePoint = {"point": new OpenLayers.Geometry.Point(coordinates[0], coordinates[1]), "measure": measure};
                            tableData.push([(de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinates[0]) + "").replace(".", ","), (de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinates[1]) + "").replace(".", ","), (de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(measure, 3) + "").replace(".", ","), de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(measure, 3)]);
                            break;
                        }
                    }
                }
            }
        }
        this.store.loadData(tableData);
        
        var table = Ext.create('Ext.grid.Panel', {
            store: this.store,
            columns: this.columns,
            stripeRows: true,
            autoWidth: true,
            border: false,
            height: 300,
            autoScroll: true,
            viewConfig: {
                forceFit: true
            }
        });
        
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
        
        if(points instanceof Array){
            if(points.length > 0){
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
            }else{
                if(singlePoint){
                    pointFeatures.push(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([singlePoint.point], null)));
                }
            }
        }
        bWaStrVectorTmp.addFeatures(pointFeatures);
        
        if(pointFeatures.length > 0){
            bWaStrVectorTmp.setVisibility(true);
        }
        
        var bWaStrMarker = self.map.getLayersByName("bWaStrVectorMarker");
        if(bWaStrMarker.length == 0){
            bWaStrMarker = new OpenLayers.Layer.Markers( "bWaStrVectorMarker" );
            bWaStrMarker.id = "bWaStrVectorMarker";
            self.map.addLayer(bWaStrMarker);
        }else{
            bWaStrMarker = bWaStrMarker[0];
        }
        
        if(firstPoint){
            de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,firstPoint.point.x,firstPoint.point.y,de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([firstPoint.point.x, firstPoint.point.y, firstPoint.measure], self), "blue");
        }
        if(lastPoint){
            de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,lastPoint.point.x,lastPoint.point.y,de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([lastPoint.point.x, lastPoint.point.y, lastPoint.measure], self), "blue");
        }
        if(singlePoint){
            de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,singlePoint.point.x,singlePoint.point.y,de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([singlePoint.point.x, singlePoint.point.y, singlePoint.measure], self), "blue");
        }
        
        if(bWaStrVectorTmp){
            self.map.zoomToExtent(bWaStrVectorTmp.getDataExtent());
            if(bWaStrVectorTmp.features.length > 1){
                self.map.zoomTo(self.map.getZoom() - 1);
            }else{
                if(singlePoint){
                    self.map.zoomTo(self.map.getZoom() - 5);
                }else{
                    self.map.zoomTo(self.map.getZoom() - 1);
                }
            }
        }
        
        Ext.apply(this, {
            items: [{
                xtype: 'panel',
                border: false,
                items:[{
                    bodyStyle: 'padding: 0 10px;',
                    border: false,
                    items: [{
                        xtype: 'fieldset',
                        title: 'BWaStr-Info',
                        autoHeight: true,
                        items: [{
                            xtype: 'panel',
                            title: '',
                            layout: 'column',
                            border: false,
                            items: [{
                                columnWidth:.33,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
                                text: 'BWaStr-IdNr:'
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
                                text: 'BWaStr-Bezeichnung:'
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
                                text: 'Streckenbezeichnung :'
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                text: this.data.bwastrid
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                text: this.data.bwastr_name
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                text: this.data.strecken_name
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
                                text: 'Von [km]:',
                                hidden: this.data.stationierung.km_wert ? true : false
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
                                text: 'Bis [km]:',
                                hidden: this.data.stationierung.km_wert ? true : false
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
                                text: 'Abstand [m]:',
                                hidden: this.data.stationierung.km_wert ? true : false
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                text: this.data.stationierung.km_von ? (this.data.stationierung.km_von + "").replace(".", ",") : "0",
                                hidden: this.data.stationierung.km_wert ? true : false
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                text: (this.data.stationierung.km_bis + "").replace(".", ","),
                                hidden: this.data.stationierung.km_wert ? true : false
                            },{
                                columnWidth:.33,
                                xtype: 'label',
                                text: this.data.stationierung.offset ? (this.data.stationierung.offset + "").replace(".", ",") : "0",
                                hidden: this.data.stationierung.km_wert ? true : false
                            },{
                                columnWidth:1,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
                                text: 'Koordinatensystem:'
                            },{
                                columnWidth:1,
                                xtype: 'label',
                                text: this.map.projection
                            }]
                        }]
                    }]
                }]
            }, table]
        });
        de.ingrid.mapclient.frontend.controls.BWaStrPanelResult.superclass.initComponent.call(this);
    },
    /**
     * Render callback (called by Ext)
     */
    onRender: function() {
        var self = this;
        de.ingrid.mapclient.frontend.controls.BWaStrPanelResult.superclass.onRender.apply(this, arguments);
    }
});