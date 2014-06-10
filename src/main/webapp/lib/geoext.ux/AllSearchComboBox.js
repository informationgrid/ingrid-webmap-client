/**
* Copyright (c) 2008-2012 The Open Source Geospatial Foundation
* Published under the BSD license.
* See http://geoext.org/svn/geoext/core/trunk/license.txt for the full text
* of the license.
*/

/** api: (define)
* module = GeoExt.form
* class = AllSearchComboBox
* base_link = `Ext.form.ComboBox <http://dev.sencha.com/deploy/dev/docs/?class=Ext.form.ComboBox>`_
*/
Ext.namespace("GeoExt.form");

/** api: constructor
* .. class:: AllSearchComboBox(config)
*/
GeoExt.form.AllSearchComboBox = Ext.extend(Ext.form.ComboBox, {
    
    /** api: config[emptyText]
* ``String`` Text to display for an empty field (i18n).
*/
    emptyText: "Search",
    
    /** api: config[map]
* ``GeoExt.MapPanel|OpenLayers.Map`` The map that will be controlled by
* this AllSearchComboBox. Only used if this component is not added as item
* or toolbar item to a ``GeoExt.MapPanel``.
*/
    
    /** private: property[map]
* ``OpenLayers.Map``
*/
    map : null,
    
    /** api: config[srs]
* ``String|OpenLayers.Projection`` The srs used by the geocoder service.
* Default is "EPSG:4326".
*/
    srs: "EPSG:4326",
    
    /** api: property[srs]
* ``OpenLayers.Projection``
*/
    
    /** api: config[zoom]
* ``String`` The minimum zoom level to use when zooming to a location.
* Not used when zooming to a bounding box. Default is 10.
*/
    zoom: 10,
    
    /** api: config[layer]
* ``OpenLayers.Layer.Vector`` If provided, a marker will be drawn on this
* layer with the location returned by the geocoder. The location will be
* cleared when the map panned.
*/
    
    /** api: config[queryDelay]
* ``Number`` Delay before the search occurs. Default is 100ms.
*/
    queryDelay: 100,
    
    /** api: config[valueField]
* ``String`` Field from selected record to use when the combo's
* :meth:`getValue` method is called. Default is "bounds". This field is
* supposed to contain an array of [left, bottom, right, top] coordinates
* for a bounding box or [x, y] for a location.
*/
    valueField: "value_field",

    /** api: config[displayField]
* ``String`` The field to display in the combo boy. Default is
* "name" for instant use with the default store for this component.
*/
    displayField: "display_field",
    
    /** api: config[locationField]
* ``String`` The field to get the location from. This field is supposed
* to contain an array of [x, y] for a location. Default is "lonlat" for
* instant use with the default store for this component.
*/
    locationField: "lonlat",
    
    /** api: config[url]
* ``String`` URL template
*/
    url: "/ingrid-webmap-client/rest/jsonCallback/queryAll?",
    
    /** api: config[queryParam]
* ``String`` The query parameter for the user entered search text.
* Default is "q" for instant use with OSM Nominatim.
*/
    queryParam: "searchTerm",
    
    /** api: config[minChars]
* ``Number`` Minimum number of entered characters to trigger a search.
* Default is 3.
*/
    minChars: 3,
    
    vector: null,
    
    /** private: method[initComponent]
* Override
*/
    initComponent: function() {
        if (this.map) {
            this.setMap(this.map);
        }
        if (Ext.isString(this.srs)) {
            this.srs = new OpenLayers.Projection(this.srs);
        }
        var data = '{cmp:[';
        var entry = '';
        if(de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorEnable")){
        	entry = entry + 
        	'{' +
        	'"group":"bwastrlocator",' +
        	'"url":"'+ de.ingrid.mapclient.Configuration.getSettings("viewBWaStrLocatorParams") + '",' +
        	'"queryPost": "true",' +
        	'"identifier":"searchterm",' +
        	'"displayPre":"'+ i18n("tSearchToolBWaStrLocator") + '"' +
        	'}';
    	}
    	if(de.ingrid.mapclient.Configuration.getSettings("viewNominatimEnable")){
    		if(entry != ''){
    			entry = entry + ',';
    		}
    		entry = entry + 
        	'{' +
        	'"group":"nominatim",' +
        	'"url":"'+ de.ingrid.mapclient.Configuration.getSettings("viewNominatimParams") + '",' +
        	'"queryPost": "false",' +
        	'"identifier":"q",' +
        	'"displayPre":"'+ i18n("tSearchToolNominatim") + '"' +
        	'}';
    	}
    	if(de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchEnable")){
    		if(entry != ''){
    			entry = entry + ',';
    		}
    		entry = entry + 
        	'{' +
        	'"group":"portalsearch",' +
        	'"url":"'+ de.ingrid.mapclient.Configuration.getSettings("viewPortalSearchParams") + '",' +
        	'"queryPost": "false",' +
        	'"identifier":"searchTerm",' +
        	'"displayPre":"'+ i18n("tSearchToolPortalSearch") + '"' +
        	'}';
    	}
    	
    	data = data + '' + entry + ']}';
    	
        if (!this.store) {
            this.store = new Ext.data.JsonStore({
                fields: [
                    {name: "value_field", mapping: "value_field"},
                    {name: "display_field", mapping: "display_field"},
                    {name: "displayPre", mapping: "displayPre"},
                    {name: "group", mapping: "group"},
                    {name: "qid", mapping: "qid"},
                    
                    {name: "name", mapping: "name"},
                    {name: "capabilitiesUrl", mapping: "capabilitiesUrl" },
                    
                    {name: "name", mapping: "display_name"},
                    {name: "bounds", mapping: "bounds"},
                    {name: "lonlat", mapping: "lonlat"},
                    
                    
                    {name: "bwastrid", mapping: "bwastrid"},
                    {name: "bwastr_name", mapping: "bwastr_name"},
                    {name: "strecken_name", mapping: "strecken_name"},
                    {name: "concat_name", mapping: "concat_name"},
                    {name: "km_von", mapping: "km_von"},
                    {name: "km_bis", mapping: "km_bis"},
                    {name: "priority", mapping: "priority"},
                    {name: "fehlkilometer", mapping: "fehlkilometer"},
                    {name: "fliessrichtung", mapping: "fliessrichtung"}
                ],
                proxy: new Ext.data.ScriptTagProxy({
                    url: this.url + "&data=" + data,
                    callbackParam: "json_callback"
                })
            });
        }
        
        this.on({
            added: this.handleAdded,
            select: this.handleSelect,
            focus: function() {
                this.clearValue();
                this.removeLocationFeature();
            },
            scope: this
        });
        
        return GeoExt.form.AllSearchComboBox.superclass.initComponent.apply(this, arguments);
    },
    
    /** private: method[handleAdded]
* When this component is added to a container, see if it has a parent
* MapPanel somewhere and set the map
*/
    handleAdded: function() {
        var mapPanel = this.findParentBy(function(cmp) {
            return cmp instanceof GeoExt.MapPanel;
        });
        if (mapPanel) {
            this.setMap(mapPanel);
        }
    },
    
    /** private: method[handleSelect]
* Zoom to the selected location, and also set a location marker if this
* component was configured with an :obj:`layer`.
*/
    handleSelect: function(combo, rec) {
    	var value = this.getValue();
        if(rec.data){
        	var group = rec.data.group;
            if(group == "bwastrlocator"){
                var bWaStrDialog = Ext.getCmp("bWaStrDialog");
                if(bWaStrDialog){
                	bWaStrDialog.close();
                }
                
            	bWaStrDialog = new de.ingrid.mapclient.frontend.controls.BWaStr({
                	id: 'bWaStrDialog',
        			record: rec,
        			map: this.map,
        			x: 20,
        			y: 100
                });
                bWaStrDialog.show();
            }else if(group == "nominatim"){
            	if (Ext.isArray(value)) {
                    var mapProj = this.map.getProjectionObject();
                    delete this.center;
                    delete this.locationFeature;
                    if (rec.data.bounds.length === 4) {
                        this.map.zoomToExtent(
                            OpenLayers.Bounds.fromArray(rec.data.bounds)
                                .transform(this.srs, mapProj)
                        );
                        // Set zoom to 10
                        if(this.map.getZoom() == 15){
                        	this.map.zoomTo(10);
                        }
                    } else {
                        this.map.setCenter(
                            OpenLayers.LonLat.fromArray(rec.data.bounds)
                                .transform(this.srs, mapProj),
                            Math.max(this.map.getZoom(), this.zoom)
                        );
                    }
                    this.center = this.map.getCenter();

                    var lonlat = rec.get(this.locationField);
                    if (this.layer && lonlat) {
                        var geom = new OpenLayers.Geometry.Point(
                            lonlat[0], lonlat[1]).transform(this.srs, mapProj);
                        this.locationFeature = new OpenLayers.Feature.Vector(geom, rec.data);
                        this.layer.addFeatures([this.locationFeature]);
                    }
                }
                // blur the combo box
                //TODO Investigate if there is a more elegant way to do this.
                (function() {
                    this.triggerBlur();
                    this.el.blur();
                }).defer(100, this);
            }else if(group == "portalsearch"){
            	var url = value;
                if(url){
                	if(url.indexOf("?") == -1){
            			url = url+"?SERVICE=WMS&REQUEST=GetCapabilities";
            		}else if(url.toLowerCase().indexOf("service=wms") == -1)
            		 	url = url + "SERVICE=WMS&REQUEST=GetCapabilities";
            		var service = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(url);
            		var activeServicesPanel = Ext.getCmp("activeServices");
            		var callback = Ext.util.Functions.createDelegate(activeServicesPanel.addService, activeServicesPanel);
            		var showFlash = true;
            		de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback, showFlash, de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpandAddNode"), de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeZoomToExtend"));
                }
            }
        }
    },

    /** private: method[removeLocationFeature]
* Remove the location marker from the :obj:`layer` and destroy the
* :obj:`locationFeature`.
*/
    removeLocationFeature: function() {
        if (this.locationFeature) {
            this.layer.destroyFeatures([this.locationFeature]);
        }
    },
    
    /** private: method[clearResult]
* Handler for the map's moveend event. Clears the selected location
* when the map center has changed.
*/
    clearResult: function() {
        if (this.center && !this.map.getCenter().equals(this.center)) {
            this.clearValue();
        }
    },
    
    /** private: method[setMap]
* :param map: ``GeoExt.MapPanel||OpenLayers.Map``
*
* Set the :obj:`map` for this instance.
*/
    setMap: function(map) {
        if (map instanceof GeoExt.MapPanel) {
            map = map.map;
        }
        this.map = map;
        map.events.on({
            "moveend": this.clearResult,
            "click": this.removeLocationFeature,
            scope: this
        });
    },
    
    /** private: method[addToMapPanel]
* :param panel: :class:`GeoExt.MapPanel`
*
* Called by a MapPanel if this component is one of the items in the panel.
*/
    addToMapPanel: Ext.emptyFn,
    
    /** private: method[beforeDestroy]
*/
    beforeDestroy: function() {
        this.map.events.un({
            "moveend": this.clearResult,
            "click": this.removeLocationFeature,
            scope: this
        });
        this.removeLocationFeature();
        delete this.map;
        delete this.layer;
        delete this.center;
        GeoExt.form.AllSearchComboBox.superclass.beforeDestroy.apply(this, arguments);
    }
});

/** api: xtype = gx_allsearchcombobox */
Ext.reg("gx_allsearchcombobox", GeoExt.form.AllSearchComboBox);