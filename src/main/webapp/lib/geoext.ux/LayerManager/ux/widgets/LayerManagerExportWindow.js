/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

Ext.namespace('GeoExt.ux');

/**
 * @include OpenLayers/Lang.js
 */

/** private: property[scriptSource]
 *  ``String``  Source of this script: complete URL
 */
var scriptSourceLayerManagerExportWindow = (function() {
    var scripts = document.getElementsByTagName('script'),
            script = scripts[scripts.length - 1];

    if (script.getAttribute.length !== undefined) {
        return script.src;
    }

    return script.getAttribute('src', -1);
}());

/** api: (define)
 *  module = GeoExt.ux
 *  class = LayerManagerExportWindow
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Window>`_
 */

GeoExt.ux.LayerManagerExportWindow = Ext.extend(Ext.Window, {
    /** private: property[id]
     *  ``String``  id set to layermanagerexportwindow (don't change it)
     */
    id: 'layermanagerexportwindow',

    /** private: property[modal]
     *  ``Boolean``  Define the window as modal.
     */
    modal: true,

    /** private: property[title]
     *  ``String``  Define the title of the window: OpenLayers.i18n('Export Window')
     */
    title: OpenLayers.i18n('Export KML'),

    /** private: property[width]
     *  ``Number``  Width of the window: 500
     */
    width: 500,

    /** private: property[height]
     *  ``Number``  Height of the window: 300
     */
    height:300,

    /** private: property[minWidth]
     *  ``Number``  Minimal width of the window: 300
     */
    minWidth: 300,

    /** private: property[minHeight]
     *  ``Number``  Minimal height of the window: 200
     */
    minHeight: 200,

    /** private: property[layout]
     *  ``String``  Layout set to absolute
     */
    layout:'absolute',

    /** private: property[plain]
     *  ``Boolean``  Plain set to true
     */
    plain:true,

    /** private: property[bodyStyle]
     *  ``String``  Body style set to 'padding:5px;'
     */
    bodyStyle:'padding:5px;',

    /** private: property[filename]
     *  ``String``  Export filename set by the window
     */
    filename: null,

    /** private: property[filecontent]
     *  ``String``  Export filecontent
     */
    filecontent: null,

    /** private: property[downloadBox]
     *  ``Ext.BoxComponent``  Box use to present the download button
     */
    downloadBox: null,

    /** private: property[downloadLoaded]
     *  ``Boolean``  Flag used to check that download has been used
     */
    downloadLoaded: false,

    /** api: config[baseUrl]
     *  ``Boolean``  Base URL in order to get the images from the donwloadify directory. Has to be set if this file is integrated in a JS build.
     */
    /** private: property[baseUrl]
     *  ``String``  Base URL in order to get the images from the donwloadify directory
     */
    baseUrl: scriptSourceLayerManagerExportWindow.replace('/widgets/LayerManagerExportWindow.js', ''),

    /** private: method[initComponent]
     *  Private initComponent override.
     */
    initComponent: function() {
        this.downloadBox = new Ext.Button({
        	id:'saveExportBtn',
			iconCls : 'iconSave',
			x: 405,
            y: 6,
            tooltip : i18n('tSpeichern'),
			enableToggle : false,
			handler: function(btn) {
				try {
				    var isFileSaverSupported = !!new Blob();
				    if(isFileSaverSupported){
					    var blob = new Blob([document.getElementById('data').value], {
						    type: "text/plain;charset=utf-8;",
						});
						saveAs(blob, document.getElementById('filename').value);
				    }
				} catch (e) {
					w = window.open();
					doc = w.document;
					doc.open( "text/xml",'replace');
					doc.charset = "utf-8";
					doc.write(document.getElementById('data').value);
					doc.close();
					doc.execCommand("SaveAs", true, document.getElementById('filename').value + ".xml");
					w.close();
				}
				
			}
		})


        this.items = [
            {
                x: 10,
                y: 5,
                xtype: 'textfield',
                id: 'filename',
                name: 'filename',
                value: this.filename,
                width: 384
            },
            this.downloadBox,
            {
                x: 10,
                y: 35,
                xtype: 'textarea',
                id: 'data',
                name: 'data',
                value: this.filecontent,
                anchor: '100% 100%'  // anchor width and height
            }
        ];

        GeoExt.ux.LayerManagerExportWindow.superclass.initComponent.call(this);
    }
});

/** api: xtype = gxux_layermanagerexportwindow */
Ext.reg('gxux_layermanagerexportwindow', GeoExt.ux.LayerManagerExportWindow);
