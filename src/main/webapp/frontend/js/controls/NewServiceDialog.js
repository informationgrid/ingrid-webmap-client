/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class NewServiceDialog is the dialog used for adding a new service to the list
 * of active services.
 */
de.ingrid.mapclient.frontend.controls.NewServiceDialog = Ext.extend(Ext.Window, {
	title: i18n('tDienstHinzufuegen'),
	closable: true,
	draggable: true,
	resizable: false,
	width: 300,
	autoHeight: true,
	shadow: false,
	initHidden: false,
	modal: true,
	ctrls:null,
    /**
     * @cfg activeServicesPanel de.ingrid.mapclient.frontend.controls.ActiveServicesPanel instance
     */
    activeServicesPanel: null,
    

    /**
     * Form fields
     */
    capabilitiesUrlField: null,
    activateLayersCheckbox: null,
    activateZoomCheckbox: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.NewServiceDialog.prototype.initComponent = function() {

	Ext.override(Ext.form.TextField, {
    //  Add functionality to Field's initComponent to enable the change event to bubble
	// We dont want the map to move while in focus therefore we do this
    initComponent : Ext.form.TextField.prototype.initComponent.createSequence(function() {
        this.enableBubble(['focus','blur']);
    }),

    //  We know that we want Field's events to bubble directly to the FormPanel.
    getBubbleTarget : function() {
        if (!this.windowContent) {
            this.windowContent = this.findParentByType('form');
        }
        return this.windowContent;
    }
	});	
	this.capabilitiesUrlField = new Ext.form.TextField({
		hideLabel: true,
		allowBlank: false
	});

	this.activateLayersCheckbox = new Ext.form.Checkbox({
		hideLabel: true,
        boxLabel: i18n('tEbenenAktivieren')
	});

	this.activateZoomCheckbox = new Ext.form.Checkbox({
		hideLabel: true,
        boxLabel: i18n('tEbenenZoomen')
	});

	var self = this;
	var windowContent = new Ext.FormPanel({
		border: false,
		bodyStyle: 'padding: 10px',
		labelAlign: 'top',
		defaults: {
			anchor: '100%'
		},
		items: [{
				html: i18n('tBitteCapabilitiesExternerService'),
				border: false
			},
		    this.capabilitiesUrlField,
		    this.activateLayersCheckbox,
		    this.activateZoomCheckbox, {
				html: i18n('tHintZoomToView'),
					bodyStyle: {
			            color: '#A8A8A8'
			        },
			        border: false
			}
		],
		buttons: [{
			text: i18n('tDienstHinzufuegen'),
	        handler: function(btn) {
	        	if (self.activeServicesPanel && self.capabilitiesUrlField.validate()) {
	        		var capabilitiesUrl = self.capabilitiesUrlField.getValue();
	        		var service = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(capabilitiesUrl);
	        		self.activateService(service);
	        		self.close();
	        	}
	        }
		}],
		listeners: {
        focus: function() {
            // We deactivate keyboard control when in focus
        	 self.activeServicesPanel.ctrls['keyboardControl'].deactivate();
        },
        blur: function() {
            // activate it again
            self.activeServicesPanel.ctrls['keyboardControl'].activate();
        }        
    	}
	});

	Ext.apply(this, {
		items: windowContent
	});

	de.ingrid.mapclient.frontend.controls.NewServiceDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.NewServiceDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.NewServiceDialog.superclass.onRender.apply(this, arguments);

};

/**
 * Activate the given service.
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.NewServiceDialog.prototype.activateService = function(service) {
	var callback = Ext.util.Functions.createDelegate(this.onServiceLoaded, this);
	de.ingrid.mapclient.frontend.data.Service.load(service.getCapabilitiesUrl(), callback);
};

/**
 * Callback to be called after the service is loaded.
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.NewServiceDialog.prototype.onServiceLoaded = function(service) {

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
