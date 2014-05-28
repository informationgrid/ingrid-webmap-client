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
    	    		if(coordinates[0]){
    	    			var coordinatesValues = coordinates[0];
    	    			if(coordinatesValues.length){
    	    				for(var j=0; j<coordinatesValues.length; j++){
    	    					var coordinatesValue = coordinatesValues[j];
        	    				var measure = "0";
        	    				if(measures[j]){
        	    					measure = measures[j];
        	    				}
        	    				
        	    				if(j == 0){
        	    					firstPoint = coordinatesValue;
    	    					}
        	    				lastPoint = coordinatesValue;
        	    				tableData.push([this.convertStringFloatValue(coordinatesValue[0]), this.convertStringFloatValue(coordinatesValue[1]), this.convertStringFloatValue(measure, 3)]);
        	    				vectorData.push(new OpenLayers.Geometry.Point(coordinatesValue[0], coordinatesValue[1]));
        	    			}		
    	    			}else{
    	    				var measure = "0";
    	    				if(measures[0]){
    	    					measure = measures[0];
    	    				}
    	    				lastPoint = coordinates;
    	    				tableData.push([this.convertStringFloatValue(coordinates[0]), this.convertStringFloatValue(coordinates[1]), this.convertStringFloatValue(measure, 3)]);
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
            height: 300,
            autoScroll: true,
            viewConfig: {
    			forceFit: true
            }
        });
    	
    	// Create vector Layer
    	var bWaStrVector = new OpenLayers.Layer.Vector("bWaStrVector", {});
		bWaStrVector.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(vectorData, null))]);
		self.map.addLayer(bWaStrVector);
		
		var bWaStrMarker = new OpenLayers.Layer.Markers( "bWaStrMarker" );
		self.map.addLayer(bWaStrMarker);
		
		if(firstPoint){
			var size = new OpenLayers.Size(21,25);
			var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
			var icon = new OpenLayers.Icon('/ingrid-webmap-client/shared/images/icon_pin_red.png', size, offset);
			bWaStrMarker.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(firstPoint[0],firstPoint[1]),icon));
		}
		
		if(lastPoint){
			var size = new OpenLayers.Size(21,25);
			var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
			var icon = new OpenLayers.Icon('/ingrid-webmap-client/shared/images/icon_pin_red.png', size, offset);
			bWaStrMarker.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(lastPoint[0],lastPoint[1]),icon));
		}
		
		if(bWaStrVector){
			self.map.zoomToExtent(bWaStrVector.getDataExtent());
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
        	                    text: this.data.stationierung.offset
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
	},
	convertStringFloatValue: function (value, index){
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
	}
});