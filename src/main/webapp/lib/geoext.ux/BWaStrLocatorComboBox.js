/**
* Copyright (c) 2008-2012 The Open Source Geospatial Foundation
* Published under the BSD license.
* See http://geoext.org/svn/geoext/core/trunk/license.txt for the full text
* of the license.
*/

/** api: (define)
* module = GeoExt.form
* class = BWaStrLocator
* base_link = `Ext.form.ComboBox <http://dev.sencha.com/deploy/dev/docs/?class=Ext.form.ComboBox>`_
*/
Ext.namespace("GeoExt.form");

/** api: constructor
* .. class:: BWaStrLocator(config)
*/
GeoExt.form.BWaStrLocator = Ext.extend(Ext.form.ComboBox, {
    
    /** api: config[emptyText]
* ``String`` Text to display for an empty field (i18n).
*/
    emptyText: "Search",
    
    /** api: config[map]
* ``GeoExt.MapPanel|OpenLayers.Map`` The map that will be controlled by
* this BWaStrLocator. Only used if this component is not added as item
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
    valueField: "bwastrid",

    /** api: config[displayField]
* ``String`` The field to display in the combo boy. Default is
* "name" for instant use with the default store for this component.
*/
    displayField: "concat_name",
    
    /** api: config[locationField]
* ``String`` The field to get the location from. This field is supposed
* to contain an array of [x, y] for a location. Default is "lonlat" for
* instant use with the default store for this component.
*/
    locationField: "lonlat",
    
    /** api: config[url]
* ``String`` URL template
*/
    url: "http://atlas.wsv.bvbs.bund.de/bwastr-locator-qs/client?limit=200&searchfield=all",
    
    /** api: config[queryParam]
* ``String`` The query parameter for the user entered search text.
* Default is "q" for instant use with OSM Nominatim.
*/
    queryParam: "searchterm",
    
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
        if (!this.store) {
            this.store = new Ext.data.JsonStore({
                root: "result",
                fields: [
                    {name: "qid", mapping: "qid"},
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
                    url: this.url,
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
        
        return GeoExt.form.BWaStrLocator.superclass.initComponent.apply(this, arguments);
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

        // Show Dialog
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
        GeoExt.form.BWaStrLocator.superclass.beforeDestroy.apply(this, arguments);
    }
});

/** api: xtype = gx_bwastrlocator */
Ext.reg("gx_bwastrlocator", GeoExt.form.BWaStrLocator);