/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

Ext.namespace('GeoExt.ux');

/**
 * @include LayerManager/ux/data/FormatStore.js
 * @include LayerManager/ux/data/Import.js
 * @include OpenLayers/Lang.js
 */

/** api: (define)
 *  module = GeoExt.ux
 *  class = LayerManagerImportPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.define('GeoExt.ux.LayerManagerImportPanel', {
	extend: 'Ext.panel.Panel',
	alias: 'gxux_layermanagerimportpanel',
    /** api: config[map]
     *  ``OpenLayers.Map``  A configured map
     */
    /** private: property[map]
     *  ``OpenLayers.Map``  The map object.
     */
    map: null,

    /** api: config[border]
     *  ``Boolean``  Default to false
     */
    /** private: property[border]
     *  ``Boolean``  Default to false
     */
    border: false,

    /** api: config[defaultFormat]
     *  ``String``  Default export format. Default: KML
     */
    /** private: property[defaultFormat]
     *  ``String``  Default export format. Default: KML
     */
    defaultFormat: 'KML',

    layer: null,

    /** private: property[formatCombo]
     *  ``Ext.form.ComboBox``  Combo box with format information
     */
    formatCombo: null,


    /** private: method[initComponent]
     *  Private initComponent override.
     */
    initComponent: function() {

        this.formatCombo = new Ext.form.ComboBox({
            id: 'layermanagerimportformat',
            fieldLabel: OpenLayers.i18n('Format'),
            store: GeoExt.ux.data.FormatStore,
            displayField:'shortName',
            typeAhead: true,
            mode: 'local',
            triggerAction: 'all',
            emptyText:'Select a format...',
            selectOnFocus:true,
            resizable:true
        });

        this.formatCombo.setValue(this.defaultFormat);

        this.fileSelectorBox = new Ext.BoxComponent({
            id: 'fileSelectorBox',
            autoEl: {
                // http://www.quirksmode.org/dom/inputfile.html
                html: '<input type="file" name="fileselector" id="fileselector"/>'
            }
        });

        this.items = [
            {
                layout: 'form',
                border:false,
                items: [
                    {
                        layout: 'column',
                        border: false,
                        defaults:{
                            layout:'form',
                            border:false,
                            bodyStyle:'padding:5px 5px 5px 5px'
                        },
                        items:[
                            {
                                columnWidth:1,
                                defaults:{
                                    anchor:'100%'
                                },
                                items: [
                                    this.formatCombo
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                layout: 'column',
                border: false,
                defaults:{
                    layout:'form',
                    border:false,
                    bodyStyle:'padding:5px 5px 5px 5px'
                },
                items: [
                    {
                        columnWidth: 1,
                        bodyCfg: {tag:'center'},
                        items: [
                            this.fileSelectorBox
                        ]
                    }
                ]
            },
            {
                layout: 'column',
                border: false,
                defaults:{
                    layout:'form',
                    border:false,
                    bodyStyle:'padding:5px 5px 5px 5px'
                },
                items: [
                    {
                        columnWidth: 1,
                        bodyCfg: {tag:'center'},
                        items: [
                            {
                                xtype:'button',
                                text: OpenLayers.i18n('Import'),
                                handler: function(a, b, c) {
                                	var self = this;
                                    if (document.getElementById('fileselector').value == "") {
                                        alert(unescape(OpenLayers.i18n('Select a file to import')));
                                    } else {
                                    	var filecontent;
                                    	
                                    	if (Ext.isIE) {
                                            try {
                                                var objFSO = new ActiveXObject("Scripting.FileSystemObject");
                                                if (objFSO.FileExists(document.getElementById('fileselector').value)) {
                                                    filecontent = objFSO.OpenTextFile(document.getElementById('fileselector').value, 1).ReadAll();
                                                }
                                            }
                                            catch (e)
                                            {
                                                alert(OpenLayers.i18n('Dear IE user. Add this site in the list of trusted site and activate the ActiveX.') + " " + e.description);
                                                return;
                                            }
                                        } else {
                                        	var file = document.getElementById('fileselector').files.item(0);
                                        	var reader = new FileReader();
                                            reader.readAsText(file, "UTF-8");
                                            reader.onload = function (evt) {
                                            	filecontent = evt.target.result;
                                            	self.fireEvent('beforedataimported', self, self.formatCombo.getValue(), filecontent);
                                            	self.layer = GeoExt.ux.data.Import(self.map, self.layer, self.formatCombo.getValue(), filecontent, null);
                                            	self.fireEvent('dataimported', self, self.formatCombo.getValue(), filecontent, GeoExt.ux.data.importFeatures);
                                            }
                                            reader.onerror = function (evt) {
                                            	alert(OpenLayers.i18n('Error by reading file.'));
                                                return;
                                            }
                                        }
                                    }
                                },
                                scope: this
                            }
                        ]
                    }
                ]
            }
        ];
        this.addEvents(
            /** api: event[dataimported]
             *  Fires after data have been imported
             *
             *  Listener arguments:
             *  * comp - :class:`GeoExt.ux.LayerManagerImportPanel`` This component.
             *  * format - import format
             *  * filecontent - content of the imported file
             *  * features - imported features
             *  *
             */
                'dataimported',
            /** api: event[beforedataimported]
             *  Fires before data have been imported
             *
             *  Listener arguments:
             *  * comp - :class:`GeoExt.ux.LayerManagerImportPanel`` This component.
             *  * format - import format
             *  * filecontent - content of the imported file
             *  *
             */
                'beforedataimported');
        GeoExt.ux.LayerManagerImportPanel.superclass.initComponent.call(this);
    }
});