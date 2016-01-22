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
 * @class SaveDialog is the dialog used for saving the current map state.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.SaveDialog', {
	extend: 'Ext.Window',
	title: i18n('tKarteSpeichern'),
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
    titleField: null,
    descriptionField: null,
    /**
     * Check if the user pressed the save button
     * @returns Boolean
     */
    isSave: function() {
    	return this.savePressed;
    },
    /**
     * Get the title entered by the user
     * @returns String
     */
    getTitle: function() {
    	return this.titleField.getValue();
    },
    /**
     * Get the description entered by the user
     * @returns String
     */
    getDescription: function() {
    	return this.descriptionField.getValue();
    },
    /**
     * Initialize the component (called by Ext)
     */
    initComponent: function() {

    	this.titleField = Ext.create('Ext.form.field.Text', {
    		id:"saveTitleDialog",
    		fieldLabel: i18n('tTitle'),
    		hideLabel: false,
    		allowBlank: false
    	});

    	this.descriptionField = Ext.create('Ext.form.field.TextArea', {
    		id:"saveDescriptionDialog",
    		fieldLabel: i18n('tBeschreibung'),
    		hideLabel: false,
    		allowBlank: true
    	});

    	var self = this;
    	var windowContent = Ext.create('Ext.form.Panel', {
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
    		dockedItems: [{
			    xtype: 'toolbar',
			    dock: 'bottom',
			    ui: 'footer',
			    cls : 'dialogToolbarBottom',
			    defaults: {minWidth: 75},
			    items: [
			        '->',
			        {
		    			id: "saveButtonDialog",
		    			text: i18n('tSpeichern'),
		    			handler: function(btn) {
		    	        	if (self.titleField.validate() && self.descriptionField.validate()) {
		    		    		self.savePressed = true;
		    		        	self.close();
		    	        	}
		    	        }
		    		}, {
		    			text: i18n('tAbbrechen'),
		    	        handler: function(btn) {
		    	        	self.close();
		    	        }
		    		}
			    ]
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

    	this.superclass.initComponent.call(this);
    },
    /**
     * Render callback (called by Ext)
     */
    onRender: function() {
    	this.superclass.onRender.apply(this, arguments);

    }
});
