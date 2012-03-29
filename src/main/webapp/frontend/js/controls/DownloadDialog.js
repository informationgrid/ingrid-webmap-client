/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class DownloadDialog is the dialog used for saving the current map state.
 */
de.ingrid.mapclient.frontend.controls.DownloadDialog = Ext.extend(Ext.Window, {
	title: "Karte herunterladen",
	closable: true,
	draggable: true,
	resizable: false,
	width: 300,
	autoHeight: true,
	shadow: false,
	initHidden: false,
	modal: true,

	/**
	 * Signals if the save button was pressed
	 */
	savePressed: false,

    /**
     * Form fields
     */
    titleField: null,
    descriptionField: null
});

/**
 * Check if the user pressed the save button
 * @returns Boolean
 */
de.ingrid.mapclient.frontend.controls.DownloadDialog.prototype.isSave = function() {
	return this.savePressed;
};

/**
 * Get the title entered by the user
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.DownloadDialog.prototype.getTitle = function() {
	return this.titleField.getValue();
};

/**
 * Get the description entered by the user
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.DownloadDialog.prototype.getDescription = function() {
	return this.descriptionField.getValue();
};

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.DownloadDialog.prototype.initComponent = function() {

	this.titleField = new Ext.form.TextField({
		fieldLabel: "Titel",
		hideLabel: false,
		allowBlank: false
	});

	this.descriptionField = new Ext.form.TextArea({
		fieldLabel: "Beschreibung",
		hideLabel: false,
		allowBlank: true
	});

	var self = this;
	var windowContent = new Ext.FormPanel({
		border: false,
		bodyStyle: 'padding: 10px',
		labelAlign: 'top',
		defaults: {
			anchor: '100%'
		},
		items: [
		    this.titleField,
		    this.descriptionField
		],
		buttons: [{
			text: 'Speichern',
			handler: function(btn) {
	        	if (self.titleField.validate() && self.descriptionField.validate()) {
		    		self.savePressed = true;
		        	self.close();
	        	}
	        }
		}, {
			text: 'Abbrechen',
	        handler: function(btn) {
	        	self.close();
	        }
		}]
	});

	Ext.apply(this, {
		items: windowContent
	});

	de.ingrid.mapclient.frontend.controls.DownloadDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.DownloadDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.DownloadDialog.superclass.onRender.apply(this, arguments);

};
