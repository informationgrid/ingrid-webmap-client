/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class NewServiceDialog is the dialog for adding a new service to the list
 * of active services.
 */
de.ingrid.mapclient.frontend.controls.NewServiceDialog = Ext.extend(Ext.Window, {
	title: "Dienst hinzufügen",
	closable: true,
	draggable: true,
	resizable: false,
	width: 300,
	autoHeight: true,
	shadow: false,
	initHidden: false,

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

	this.capabilitiesUrlField = new Ext.form.TextField({
		hideLabel: true,
		allowBlank: false
	});

	this.activateLayersCheckbox = new Ext.form.Checkbox({
		hideLabel: true,
        boxLabel: 'Ebenen des Kartendienstes aktivieren'
	});

	this.activateZoomCheckbox = new Ext.form.Checkbox({
		hideLabel: true,
        boxLabel: 'Auf Ebenenausdehnung des Kartendienstes heranzoomen'
	});

	var self = this;
	var windowContent = new Ext.FormPanel({
		border: false,
		bodyStyle: 'padding: 10px',
		labelAlign: 'top',
		defaults: {
			anchor:'100%'
		},
		items: [{
				html: 'Bitte geben Sie eine GetCapabilities-URL eines externen web map service (WMS) an:',
				border: false
			},
		    this.capabilitiesUrlField,
		    this.activateLayersCheckbox,
		    this.activateZoomCheckbox, {
				html: 'Hinweis: Möglicherweise müssen Sie die Ansicht vergrößern, um Ebenen von externen Kartendiensten '+
					'betrachten zu können. Der Betreiber des Kartendienstes ist für die Anzeige verantwortlich. '+
					'PortalU hat keine Beteiligung an dessen Verhalten.',
					bodyStyle: {
			            color: '#A8A8A8'
			        },
			        border: false
			}
		],
		buttons: [{
			text: 'Dienst hinzufügen',
	        handler: function(btn) {
	        	if (self.activeServicesPanel && self.capabilitiesUrlField.validate()) {
	        		var capabilitiesUrl = self.capabilitiesUrlField.getValue();
	        		var service = de.ingrid.mapclient.frontend.data.Service.createFromCapabilitiesUrl(capabilitiesUrl);
	        		self.activateService(service);
	        		self.close();
	        	}
	        }
		}]
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
			layer.visibility = true;
		}
	}

	// add the service
	this.activeServicesPanel.addService(service);
};
