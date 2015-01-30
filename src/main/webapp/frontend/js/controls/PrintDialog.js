/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
 * @class PrintDialog is the dialog used for printing the current map.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.PrintDialog', {
	extend: 'Ext.Window',
	title: i18n('tKarteDrucken'),
	closable: true,
	draggable: true,
	resizable: false,
	width: 250,
	height: 300,
	shadow: false,
	initHidden: false,
	modal: false,
	layout: "fit",
	constrain: true,

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
	loadMask: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		// create the print provider
		this.printProvider = Ext.create('GeoExt.data.MapfishPrintProvider', {
			url: de.ingrid.mapclient.PRINT_URL,
			autoLoad: true,
			listeners: {
				"loadcapabilities": function(provider, capabilities) {
					// Edit capabilities entries to https urls
					if(window.location.protocol == "https:"){
						this.capabilities.createURL = this.capabilities.createURL.replace("http:", window.location.protocol);
		                this.capabilities.printURL = this.capabilities.printURL.replace("http:", window.location.protocol);
					}

					if(self.loadMask){
						self.loadMask.hide();
					}
					// create the printform and show it
					var printForm = self.createPrintForm();
					self.add(printForm);
					self.doLayout();
					self.show();
					self.setPagePosition(350,300);
				},
				"printexception": function(provider, response) {
					de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.MAP_PRINT_FAILURE+" "+response.statusText);
					self.close();
				}
			}
		});
		this.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		this.superclass.onRender.apply(this, arguments);
		this.loadMask = new Ext.LoadMask(this.body, {
			msg:i18n('tLadeDruckkonfiguration')
		});
	},
	/**
	 * Create the window content (print form)
	 * @return GeoExt.ux.SimplePrint instance
	 */
	createPrintForm: function() {
		var self = this;
		// create the print form
		var printForm = Ext.create('GeoExt.ux.SimplePrint', {
			mapPanel: this.mapPanel,
			autoFit: true,
			printProvider: this.printProvider,
			bodyStyle: {
				padding: "5px"
			},
			labelWidth: 70,
			defaults: {
    			anchor: '100%'
    		},
			border: false,
			layoutText: i18n('tFormat'),
			dpiText: "DPI",
			scaleText: i18n('tMaszstab'),
			rotationText: i18n('tDrehung'),
			printText: i18n('tPDFErstellen'),
			creatingPdfText: i18n('tPDFErstellen') + "..."

		});
		// add title and description fields to the form
		printForm.insert(0, {
			xtype: "textfield",
			name: "mapTitle",
			value: "", // don't send null values because printing will fail
			fieldLabel: i18n('tTitle'),
			plugins: Ext.create('GeoExt.plugins.PrintPageField',{
				printPage: printForm.printPage
			})
		});
		printForm.insert(1, {
			xtype: "textarea",
			name: "comment",
			value: "", // don't send null values because printing will fail
			fieldLabel: i18n('tKommentar'),
			plugins: Ext.create('GeoExt.plugins.PrintPageField',{
				printPage: printForm.printPage
			})
		});
		printForm.insert(2, {
			xtype: "checkbox",
			fieldLabel: i18n('tLegende'),
			name: "legend",
			listeners: {
				"change": function( checkbox, newValue, oldValue, eOpts ) {
					// add the legend panel to the printOptions if selected
					if (newValue) {
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
	}
});
