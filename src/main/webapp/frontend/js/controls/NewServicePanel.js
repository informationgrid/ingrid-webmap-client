/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class NewServicePanel is the dialog used for adding a new service to the list
 * of active services.
 */
de.ingrid.mapclient.frontend.controls.NewServicePanel = Ext.extend(Ext.Panel, {
	id : 'externServicePanel',
	title : i18n('tExternServicePanel'),
	
    /**
     * @cfg activeServicesPanel de.ingrid.mapclient.frontend.controls.ActiveServicesPanel instance
     */
    activeServicesPanel: null,
    

    /**
     * Form fields
     */
    capabilitiesUrlField: null,
    activateLayersCheckbox: null,
    activateZoomCheckbox: null,
    addButton: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.NewServicePanel.prototype.initComponent = function() {

	this.capabilitiesUrlField = new Ext.form.TextField({
		allowBlank: false,
		emptyText: i18n('tUrlEingabe'),
		blankText: i18n('tPfichtfeld'),
		hideLabel: true,
		anchor:'100%'
	});

	this.activateLayersCheckbox = new Ext.form.Checkbox({
        boxLabel: i18n('tEbenenAktivieren'),
        hideLabel: true,
		ctCls:'font'
	});

	this.activateZoomCheckbox = new Ext.form.Checkbox({
        boxLabel: i18n('tEbenenZoomen'),
        hideLabel: true,
		ctCls:'font'
	});

	this.addButton = {
		xtype : 'button',
		text : i18n('tDienstHinzufuegen'),
		handler: function(btn) {
			if (self.activeServicesPanel && self.capabilitiesUrlField.validate()) {
        		var capabilitiesUrl = self.capabilitiesUrlField.getValue();
        		var service = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(capabilitiesUrl);
        		self.activateService(service);
        		
        		self.capabilitiesUrlField.setValue("");
        		self.activateLayersCheckbox.setValue(false);
        		self.activateZoomCheckbox.setValue(false);
        		var servicePanel = Ext.getCmp('servicePanel');
        		servicePanel.items.itemAt(0).expand();
			}
		}
	};
	
	var placeholder = {
    	xtype: 'container',
		height: 10
    };
	
	var panel = new Ext.Panel({
		bodyStyle: 'padding:5px;',
		bodyCssClass: 'background ',
		layout: 'form',
		items:[{
			html: i18n('tBitteCapabilitiesExternerService'),
			border: false,
			bodyCssClass: 'background font'
			},
			placeholder,
		    this.capabilitiesUrlField,
		    placeholder,
		    this.activateLayersCheckbox,
		    placeholder,
		    this.activateZoomCheckbox,
		    placeholder,
		    this.addButton,
		    placeholder,
		    {
				title: i18n('tHinweis'),
				html: i18n('tHintZoomToView'),
				bodyStyle: 'padding:5px;',
		        border: true,
		        collapsible: true,
				bodyCssClass: 'background font hint'
		    }],
	    autoScroll: true
	});
	
	var self = this;
	Ext.apply(this, {
		bodyStyle: 'padding: 4px;',
		layout: 'fit',
		items: [panel],
	    autoScroll: false,
	    bodyCssClass: 'background'
	});

	de.ingrid.mapclient.frontend.controls.NewServicePanel.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.NewServicePanel.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.NewServicePanel.superclass.onRender.apply(this, arguments);

};

/**
 * Activate the given service.
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.NewServicePanel.prototype.activateService = function(service) {
	var callback = Ext.util.Functions.createDelegate(this.onServiceLoaded, this);
	de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback);
};

/**
 * Callback to be called after the service is loaded.
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.NewServicePanel.prototype.onServiceLoaded = function(service) {

	// activate layers if requested
	var activateLayers = this.activateLayersCheckbox.checked;
	if (activateLayers) {
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
	var activateZoomCheckbox = this.activateZoomCheckbox.checked;
	if (activateZoomCheckbox) {
	var llbbox = service.capabilitiesStore.data.items[0].data.llbbox;
	var bounds = new OpenLayers.Bounds.fromArray(llbbox);
	this.activeServicesPanel.map.zoomToExtent(bounds);
	}
	
	// add the service
	this.activeServicesPanel.addService(service, true);
};
