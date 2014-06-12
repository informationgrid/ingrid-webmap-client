/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class BWaStr is the dialog used for BWaStr Locator.
 */
de.ingrid.mapclient.frontend.controls.BWaStrPanelResult = Ext.extend(Ext.Panel, {
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
                dataIndex: 'rechtswert'
            },
            {
                header   : self.map.displayProjection.proj.units == "degrees" ? 'Breite [Dezimalgrad]' : 'Hochwert [m]', 
                sortable : true, 
                dataIndex: 'hochwert'
            },
            {
                header   : 'Station [km]', 
                sortable : true, 
                dataIndex: 'station'
            }
    	];
    	
    	this.store = new Ext.data.ArrayStore({
    		fields:[
              {name: 'rechtswert'},
              {name: 'hochwert'},
              {name: 'station'}
            ],
            sortInfo: {
                field: 'station',
                direction: 'ASC'
            }
        });
    	
    	var tableData = [];
    	var vectorData = [];
    	var firstPoint = null;
    	var lastPoint = null;
    	if(this.data){
    		var geometry = this.data.geometry;
        	if(geometry){
        		if(geometry.coordinates){
    	    		var coordinates = geometry.coordinates;
    	    		var measures = geometry.measures;
    	    		var count = 0;
    	    		for(var i=0; i<coordinates.length;i++){
    	    			var coordinatesValues = coordinates[i];
    	    			if(coordinatesValues instanceof Array){
    	    				for(var j=0; j<coordinatesValues.length; j++){
    	    					var coordinatesValue = coordinatesValues[j];
        	    				var measure = "0";
        	    				if(measures[count]){
        	    					measure = measures[count];
        	    				}
        	    				tableData.push([de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinatesValue[0]), de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinatesValue[1]), de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(measure, 3)]);
        	    				count++;
        	    			}		
    	    			}else{
    	    				var measure = "0";
    	    				if(measures[0]){
    	    					measure = measures[0];
    	    				}
							lastPoint = [coordinates[0], coordinates[1], de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([coordinates[0], coordinates[1], measure], self)];
							tableData.push([de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinates[0]), de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinates[1]), de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(measure, 3)]);
    	    				break;
    	    			}
    	    		}
    	    	}
        	}
    	}
    	this.store.loadData(tableData);
    	
    	var table = new Ext.grid.GridPanel({
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
    	
    	var items = this.store.data.items;
    	for(var i=0; i<items.length;i++){
    		var item = items[i];
    		if(i == 0){
				if(firstPoint == null){
					firstPoint = [item.data.rechtswert, item.data.hochwert, de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([item.data.rechtswert, item.data.hochwert, item.data.station], self)];        	    						
				}
			}
			if(i == items.length -1){
				lastPoint = [item.data.rechtswert, item.data.hochwert, de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([item.data.rechtswert, item.data.hochwert, item.data.station], self)];
			}
			
    		vectorData.push(new OpenLayers.Geometry.Point(item.data.rechtswert, item.data.hochwert));
    	}
    	// Create vector Layer
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
		bWaStrVectorTmp.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(vectorData, null))]);
		
		var bWaStrMarker = self.map.getLayersByName("bWaStrVectorMarker");
		if(bWaStrMarker.length == 0){
			bWaStrMarker = new OpenLayers.Layer.Markers( "bWaStrVectorMarker" );
			self.map.addLayer(bWaStrMarker);
		}else{
			bWaStrMarker = bWaStrMarker[0];
		}
		
		if(firstPoint){
			var marker = de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,firstPoint[0],firstPoint[1],firstPoint[2], "blue");
			bWaStrMarker.addMarker(marker);
		}
		
		if(lastPoint){
			var marker = de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,lastPoint[0],lastPoint[1],lastPoint[2], "blue");
			bWaStrMarker.addMarker(marker);
		}
		
		if(bWaStrVectorTmp){
			self.map.zoomToExtent(bWaStrVectorTmp.getDataExtent());
			if(bWaStrVectorTmp.features.length > 1){
				self.map.zoomTo(self.map.getZoom() - 1);
			}else{
				self.map.zoomTo(self.map.getZoom() - 5);
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
                                text: this.data.stationierung.km_von ? this.data.stationierung.km_von : "0",
                                hidden: this.data.stationierung.km_wert ? true : false
                        	},{
                        		columnWidth:.33,
                                xtype: 'label',
                                text: this.data.stationierung.km_bis,
                                hidden: this.data.stationierung.km_wert ? true : false
                        	},{
                        		columnWidth:.33,
                                xtype: 'label',
        	                    text: this.data.stationierung.offset ? this.data.stationierung.offset : "0",
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