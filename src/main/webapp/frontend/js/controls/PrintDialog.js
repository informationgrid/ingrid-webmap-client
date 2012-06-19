/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class PrintDialog is the dialog used for printing the current map.
 */
de.ingrid.mapclient.frontend.controls.PrintDialog = Ext.extend(Ext.Window, {
	title: "Karte drucken",
	closable: true,
	draggable: true,
	resizable: false,
	width: 250,
	height: 300,
	shadow: false,
	initHidden: false,
	modal: false,
	layout: "fit",

	/**
	 * @cfg GeoExt.MapPanel instance
	 */
	mapPanel: null,

	/**
	 * @cfg GeoExt.LegendPanel instance
	 */
	legendPanel: null,

	/**
	 * GeoExt.data.PrintProvider instance
	 */
	printProvider: null,

	/**
	 * Ext.LoadMask instance
	 */
	loadMask: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.PrintDialog.prototype.initComponent = function() {

	var self = this;

	// create the print provider
	this.printProvider = new GeoExt.data.PrintProvider({
		url: de.ingrid.mapclient.PRINT_URL,
		autoLoad: true,
		listeners: {
			"loadcapabilities": function(provider, capabilities) {
				self.loadMask.hide();
				// create the printform and show it
				var printForm = self.createPrintForm();
				self.add(printForm);
				self.doLayout();
			},
			"printexception": function(provider, response) {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.MAP_PRINT_FAILURE+" "+response.statusText);
				self.close();
			}
		}
	});
	self.setPagePosition(250,200);
	de.ingrid.mapclient.frontend.controls.PrintDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.PrintDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.PrintDialog.superclass.onRender.apply(this, arguments);

	this.loadMask = new Ext.LoadMask(this.body, {
		msg:"Lade Druckkonfiguration..."
	});
};

/**
 * Create the window content (print form)
 * @return GeoExt.ux.SimplePrint instance
 */
de.ingrid.mapclient.frontend.controls.PrintDialog.prototype.createPrintForm = function() {

	var self = this;
	// create the print form
	var printForm = new GeoExt.ux.SimplePrint({
		mapPanel: this.mapPanel,
		autoFit: true,
		printProvider: this.printProvider,
		bodyStyle: {
			padding: "5px"
		},
		labelWidth: 70,
		defaults: {
			width: 150
		},
		border: false,
		layoutText: "Format",
		dpiText: "DPI",
		scaleText: "Ma&szlig;tab",
		rotationText: "Drehung",
		printText: "PDF erstellen",
		creatingPdfText: "Erzeuge PDF..."

	});
	// add title and description fields to the form
	printForm.insert(0, {
		xtype: "textfield",
		name: "mapTitle",
		value: "", // don't send null values because printing will fail
		fieldLabel: "Titel",
		plugins: new GeoExt.plugins.PrintPageField({
			printPage: printForm.printPage
		})
	});
	printForm.insert(1, {
		xtype: "textarea",
		name: "comment",
		value: "", // don't send null values because printing will fail
		fieldLabel: "Kommentar",
		plugins: new GeoExt.plugins.PrintPageField({
			printPage: printForm.printPage
		})
	});
	printForm.insert(2, {
		xtype: "checkbox",
		fieldLabel: "Legende",
		name: "legend",
		listeners: {
			"check": function(checkbox, checked) {
				// add the legend panel to the printOptions if selected
				if (checked) {
					printForm.printOptions = {
						legend: self.legendPanel
					};
				}
				else {
					if (printForm.printOptions) {
						delete printForm.printOptions.legend;
					}
				}
			}
		}
	});
	printForm.on("beforedestroy", function(form) {
		// hide the busy mask in every case (also if an exception ocurred)
		if (form.busyMask.hide) {
			form.busyMask.hide();
		}
	});
    this.printProvider.on({
    	// close this form after printing
        "print": self.close,
        scope: self
    });

	return printForm;
};
