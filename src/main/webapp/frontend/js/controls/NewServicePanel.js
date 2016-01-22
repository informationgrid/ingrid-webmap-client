/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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
 * @class NewServicePanel is the dialog used for adding a new service to the list
 * of active services.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.NewServicePanel', {
	extend: 'Ext.Panel',
	id : 'externServicePanel',
	title : i18n('tExternServicePanel'),
	
    /**
     * Initialize the component (called by Ext)
     */
    initComponent: function() {
    	var capabilitiesUrlField = Ext.create('Ext.form.TextField', {
    		id:'externServicePanel_capabilitiesUrlField',
            allowBlank: false,
    		emptyText: i18n('tUrlEingabe'),
    		blankText: i18n('tPfichtfeld'),
    		hideLabel: true,
    		anchor:'100%'
    	});

    	var activateLayersCheckbox = Ext.create('Ext.form.Checkbox', {
    		id:'externServicePanel_activateLayersCheckbox',
            boxLabel: i18n('tEbenenAktivieren'),
            hideLabel: true,
    		ctCls:'font'
    	});

    	var activateZoomCheckbox = Ext.create('Ext.form.Checkbox', {
    		id:'externServicePanel_activateZoomCheckbox',
            boxLabel: i18n('tEbenenZoomen'),
            hideLabel: true,
    		ctCls:'font'
    	});

    	var addButton = {
    		id: 'externServicePanel_addButton',
    		xtype : 'button',
    		text : i18n('tDienstHinzufuegen'),
    		handler: function(btn) {
    			var activeServicesPanel = Ext.getCmp('activeServices');
    			var capabilitiesUrlField = Ext.getCmp('externServicePanel_capabilitiesUrlField');
    			if (activeServicesPanel && capabilitiesUrlField.validate()) {
            		var capabilitiesUrl = de.ingrid.mapclient.frontend.data.MapUtils.addCapabilitiesParameter(capabilitiesUrlField.getValue());
            		var service = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(capabilitiesUrl);
            		self.activateService(service);
            		
            		var servicePanel = Ext.getCmp('servicePanel');
            		servicePanel.items.items[0].expand();
    			}
    		}
    	};
    	
    	var placeholder = {
        	xtype: 'container',
    		height: 10
        };
    	
    	var panel = Ext.create('Ext.form.Panel', {
    		bodyStyle: 'padding:5px;',
    		bodyCssClass: 'background ',
    		layout: 'form',
    		items:[{
	    			html: i18n('tBitteCapabilitiesExternerService'),
	    			border: false,
	    			bodyCssClass: 'background font'
    			},
    		    capabilitiesUrlField,
    		    placeholder,
    		    activateLayersCheckbox,
    		    placeholder,
    		    activateZoomCheckbox,
    		    placeholder,
    		    addButton,
    		    placeholder,
    		    {
    				title: i18n('tHinweis'),
    				html: i18n('tHintZoomToView'),
    				bodyStyle: 'padding:5px;',
    		        border: true,
    		        collapsible: true,
    				bodyCssClass: 'background font hint'
    		    }],
    	    autoScroll: true,
    	    keys:[{ key: [Ext.EventObject.ENTER], handler: addButton.handler
    			}]
    	});
    	
    	var self = this;
    	Ext.apply(this, {
    		bodyStyle: 'padding: 4px;',
    		layout: 'fit',
    		items: [panel],
    	    autoScroll: false,
    	    bodyCssClass: 'background'
    	});

    	this.superclass.initComponent.call(this);
    },
    /**
     * Render callback (called by Ext)
     */
    onRender: function() {
    	this.superclass.onRender.apply(this, arguments);
    },
    /**
     * Activate the given service.
     * @param service de.ingrid.mapclient.frontend.data.Service instance
     */
    activateService: function(service) {
    	var callback = Ext.Function.bind(this.onServiceLoaded, this);
    	de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback);
    },
    /**
     * Callback to be called after the service is loaded.
     * @param service de.ingrid.mapclient.frontend.data.Service instance
     */
    onServiceLoaded: function(service) {
    	// activate layers if requested
    	var activeServicesPanel = Ext.getCmp('activeServices');
    	var activateLayersCheckbox = Ext.getCmp('externServicePanel_activateLayersCheckbox');
    	var activateZoomCheckbox = Ext.getCmp('externServicePanel_activateZoomCheckbox');
    	var capabilitiesUrlField = Ext.getCmp('externServicePanel_capabilitiesUrlField');
    	
    	if (activateLayersCheckbox.checked) {
    		var layers = service.getLayers();
    		for (var i=0, count=layers.length; i<count; i++) {
    			var layer = layers[i];
    		     
    			/* the problem is that we give random names to our layers,
    		     * that dont have one, to make them visible in tree view.
    		     * This gives us another problem, now every layer has a node,
    		     * but in GeoExt every node also is a layer with a request when 
    		     * checked. A little bit of a hack: we set all layers with random 
    		     * IDs starting with "INGRID-" invisible.
    		     */
    		    if(layer.params['LAYERS'].indexOf('INGRID-') != -1)
    		    	layer.visibility = false;
    		    else 
    		    	layer.visibility = true;
    		}
    	}
    	
    	//zoom to map service map extent if requested
    	//TODO use service method from activeServicesPanel
    	if (activateZoomCheckbox.checked) {
    		var llbbox = service.capabilitiesStore.data.items[0].data.llbbox;
    		var bounds = new OpenLayers.Bounds.fromArray(llbbox);
    		activeServicesPanel.map.zoomToExtent(bounds);
    	}
    	
    	// add the service
    	activeServicesPanel.addService(service, true, false, de.ingrid.mapclient.Configuration.getSettings("viewHasActiveServiceTreeExpandAddNode"), activateZoomCheckbox.value);
    	
    	// Reset form
    	capabilitiesUrlField.reset();
    	activateLayersCheckbox.setValue(false);
    	activateZoomCheckbox.setValue(false);
    }
});
