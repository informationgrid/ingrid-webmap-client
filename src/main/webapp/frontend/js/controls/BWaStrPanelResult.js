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
                header   : 'Rechtswert [m]', 
                sortable : false, 
                dataIndex: 'rechtswert'
            },
            {
                header   : 'Hochwert [m]', 
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
        	    				if(j == 0){
        	    					if(firstPoint == null){
        	    						firstPoint = [coordinatesValue[0], coordinatesValue[1], de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([coordinatesValue[0], coordinatesValue[1], measure])];        	    						
        	    					}
    	    					}
        	    				if(count == measures.length -1){
									lastPoint = [coordinatesValue[0], coordinatesValue[1], de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([coordinatesValue[0], coordinatesValue[1], measure])];
        	    				}
        	    				tableData.push([de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinatesValue[0]), de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(coordinatesValue[1]), de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(measure, 3)]);
        	    				vectorData.push(new OpenLayers.Geometry.Point(coordinatesValue[0], coordinatesValue[1]));
        	    				count++;
        	    			}		
    	    			}else{
    	    				var measure = "0";
    	    				if(measures[0]){
    	    					measure = measures[0];
    	    				}
							lastPoint = [coordinates[0], coordinates[1], de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([coordinates[0], coordinates[1], measure])];
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
    	
    	// Create vector Layer
    	var styleMap = new OpenLayers.StyleMap({'default':{
   		 fillColor: "blue", 
   		 strokeColor: "blue", 
            strokeWidth: 2
        }});
    	
    	var bWaStrVector = new OpenLayers.Layer.Vector("bWaStrVectorTmp", {
    		styleMap: styleMap
    	});
		bWaStrVector.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(vectorData, null))]);
		self.map.addLayer(bWaStrVector);
		
		var bWaStrMarker = new OpenLayers.Layer.Markers( "bWaStrVectorMarkerTmp" );
		self.map.addLayer(bWaStrMarker);
		
		if(firstPoint){
			var marker = de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,firstPoint[0],firstPoint[1],firstPoint[2], "blue");
			bWaStrMarker.addMarker(marker);
		}
		
		if(lastPoint){
			var marker = de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,lastPoint[0],lastPoint[1],lastPoint[2], "blue");
			bWaStrMarker.addMarker(marker);
		}
		
		if(bWaStrVector){
			if(firstPoint){
				self.map.zoomToExtent(bWaStrVector.getDataExtent());
			}else{
				if(bWaStrMarker){
					if(bWaStrMarker.markers){
						if(bWaStrMarker.markers.length > 1){
							self.map.zoomToExtent(bWaStrMarker.getDataExtent());
						}else{
							var point = bWaStrMarker.markers[0];
							self.map.setCenter(point.lonlat, 5);
						}
					}
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
                                text: 'Von [km]:'
                        	},{
                        		columnWidth:.33,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
                                text: 'Bis [km]:'
                        	},{
                        		columnWidth:.33,
                                xtype: 'label',
                                style: {
                                    fontWeight: 'bold'
                                },
        	                    text: 'Abstand [m]:'
                        	},{
                            	columnWidth:.33,
                                xtype: 'label',
                                text: this.data.stationierung.km_von ? this.data.stationierung.km_von : "0"
                        	},{
                        		columnWidth:.33,
                                xtype: 'label',
                                text: this.data.stationierung.km_bis
                        	},{
                        		columnWidth:.33,
                                xtype: 'label',
        	                    text: this.data.stationierung.offset ? this.data.stationierung.offset : "0"
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