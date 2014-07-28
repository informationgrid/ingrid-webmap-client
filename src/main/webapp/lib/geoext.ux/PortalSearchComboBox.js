/** api: (define)
* module = GeoExt.form
* class = BWaStrLocator
* base_link = `Ext.form.ComboBox <http://dev.sencha.com/deploy/dev/docs/?class=Ext.form.ComboBox>`_
*/
Ext.namespace("GeoExt.form");

/** api: constructor
* .. class:: BWaStrLocator(config)
*
*/
Ext.define('GeoExt.form.PortalSearch', {
	extend: 'Ext.form.field.ComboBox',
    alias: 'gx_portalsearch',
	/** api: config[emptyText]
* ``String`` Text to display for an empty field (i18n).
*/
    emptyText: "Search",
    
    /** api: config[valueField]
* ``String`` Field from selected record to use when the combo's
* :meth:`getValue` method is called. Default is "bounds". This field is
* supposed to contain an array of [left, bottom, right, top] coordinates
* for a bounding box or [x, y] for a location.
*/
    valueField: "capabilitiesUrl",

    /** api: config[displayField]
* ``String`` The field to display in the combo boy. Default is
* "name" for instant use with the default store for this component.
*/
    displayField: "name",
    
    /** api: config[url]
* ``String`` URL template for querying the geocoding service. If a
* :obj:`store` is configured, this will be ignored. Note that the
* :obj:`queryParam` will be used to append the user's combo box
* input to the url. Default is
* "http://nominatim.openstreetmap.org/search?format=json", for instant
* use with the OSM Nominatim geolocator. However, if you intend to use
* that, note the
* `Nominatim Usage Policy <http://wiki.openstreetmap.org/wiki/Nominatim_usage_policy>`_.
*/
    url: "/ingrid-webmap-client/rest/search/query?",
    
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
    
    /** private: method[initComponent]
* Override
*/
    initComponent: function() {
        if (!this.store) {
            this.store = new Ext.data.JsonStore({
            	root: null,
                fields: [
                    {name: "name", mapping: "name"},
                    {name: "capabilitiesUrl", mapping: "capabilitiesUrl" }
                ],
                proxy: new Ext.data.ScriptTagProxy({
                    url: this.url,
                    callbackKey: "json_callback"
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
        
        return GeoExt.form.PortalSearch.superclass.initComponent.apply(this, arguments);
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
        var url = this.getValue();
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
        GeoExt.form.PortalSearch.superclass.beforeDestroy.apply(this, arguments);
    }
});