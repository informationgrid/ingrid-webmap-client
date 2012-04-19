/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class SaveDialog is the dialog used for saving the current map state.
 */
de.ingrid.mapclient.frontend.controls.SaveDialog = Ext.extend(Ext.Window, {
	title: "Karte speichern",
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
de.ingrid.mapclient.frontend.controls.SaveDialog.prototype.isSave = function() {
	return this.savePressed;
};

/**
 * Get the title entered by the user
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.SaveDialog.prototype.getTitle = function() {
	return this.titleField.getValue();
};

/**
 * Get the description entered by the user
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.SaveDialog.prototype.getDescription = function() {
	return this.descriptionField.getValue();
};

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SaveDialog.prototype.initComponent = function() {

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
	Ext.override(Ext.form.TextArea, {
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

	de.ingrid.mapclient.frontend.controls.SaveDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.SaveDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.SaveDialog.superclass.onRender.apply(this, arguments);

};
