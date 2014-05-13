/**
 * Copyright (c) 2010 The Open Source Geospatial Foundation
 */

/**
 * Copyright (c) 2010 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 *
 * This is loosely based on The Open Planning Project Styler:
 *   http://svn.opengeo.org/suite/trunk/styler/
 */
Ext.namespace("GeoExt.ux");

/** api: (define)
 *  module = GeoExt.ux.form
 *  class = StyleSelectorPalette
 *  base_link = `Ext.form.FormPanel <http://extjs.com/deploy/dev/docs/?class=Ext.form.FormPanel>`_
 */

/** api: constructor
 *  .. class:: StyleSelectorPalette
 *
 *  Todo
 */
GeoExt.ux.StyleSelectorPalette = Ext.extend(Ext.Panel, {

    palette: null,
    defaultColor: 'FF0000',
    
    /** private: method[initComponent]
     */
    initComponent: function() {

        this.addEvents(
            /**
             * Event: change
             * Fires when the style is changed.
             *
             * Listener arguments:
             * style - {OpenLayers.Style} The style selected.
             */
            "change"

        );

        this.initPalette();

        GeoExt.ux.StyleSelectorPalette.superclass.initComponent.call(this);
    },


    /** public: method[createLayout]
     *  This function returns a GeoExt object (Panel, Window, etc)
     *  If a generic Styler class is created, then this class would be an 
     *  Observable that create and return a Panel in this function.
     */
    createLayout: function(config) {
        return this;
    },

    /** private: method[initComoboBox]
     *  Create the GeoExt ComboBox from the styleStore.
     */
    initPalette: function() {
    	var self = this;
        var oItems= Array();

        var oPalette = new Ext.ColorPalette({
        	id: 'colorPaletteRedling',
        	layout: 'fit',
        	value: self.defaultColor.toUpperCase()
        });
        oItems.push(oPalette);

        oPalette.on('select', 
        	function(palette, selColor) {
        		var obj = { 
    				fontColor: "#" + selColor.toLowerCase(),
    				fillColor: "#" + selColor.toLowerCase(),
        			strokeColor: "#" + selColor.toLowerCase()
        		};
        		self.fireEvent("change", OpenLayers.Util.applyDefaults(obj, OpenLayers.Feature.Vector.style['default']));
        	}
        );
        
        Ext.apply(this, {items: oItems});

        this.palette = oPalette;
    }

});

/** api: xtype = gx_minisymbolizer */
Ext.reg("gx_StyleSelectorPalette", GeoExt.ux.StyleSelectorPalette);
