/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class DownloadDialog is the dialog used for saving the current map state.
 */
de.ingrid.mapclient.frontend.controls.DownloadDialog = Ext.extend(Ext.Window, {
	title: i18n('tKarteHerunterladen'),
	closable: true,
	draggable: true,
	resizable: false,
	width: 300,
	autoHeight: true,
	shadow: false,
	initHidden: false,
	modal: true,
	ctrls:null,
	constrain: true,
	
	/**
	 * Signals if the save button was pressed
	 */
	savePressed: false,

    /**
     * Form fields
     */
    titleField: null
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
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.DownloadDialog.prototype.initComponent = function() {

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
	
	this.titleField = new Ext.form.TextField({
		fieldLabel: i18n('tTitle'),
		hideLabel: false,
		allowBlank: false
	});



	var self = this;
	var windowContent = new Ext.FormPanel({
		border: false,
		autoScroll:false,
		bodyStyle: 'padding: 10px',
		labelAlign: 'top',
		defaults: {
			anchor: '100%'
		},
		items: [
		    this.titleField
		],
		buttons: [{
			text: i18n('tSpeichern'),
			handler: function(btn) {
	        	if (self.titleField.validate()) {
		    		self.savePressed = true;
		        	self.close();
	        	}
	        }
		}, {
			text: i18n('tAbbrechen'),
	        handler: function(btn) {
	        	self.close();
	        }
		}],
		listeners: {
        focus: function() {
            // We deactivate keyboard control when in focus
            self.ctrls['keyboardControl'].deactivate();
        },
        blur: function() {
            // activate it again
            self.ctrls['keyboardControl'].activate();
        }        
    }
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
