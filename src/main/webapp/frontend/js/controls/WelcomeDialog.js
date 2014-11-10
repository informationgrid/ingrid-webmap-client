/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
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
 * @class WelcomeDialog is the dialog for configuring the map view.
 */
Ext.define('de.ingrid.mapclient.frontend.controls.WelcomeDialog', {
	extend: 'Ext.Window',
    id: 'welcomeDialog',
    //title: i18n('tWillkommen'),
    autoLoad:{
        url:'/ingrid-webmap-client/frontend/data/welcome_part.html', 
        scripts: true
    },
    bodyStyle: "background-color: white;",
    closable: true,
    draggable: true,
    resizable: false,
    constrain: true,
    collapsible: false,
    collapsed: false,
    expandOnShow: false,
    width: 650,
    //height: 560, // do not set height, since content defines the height!
    y: 100,
    shadow: false,
    initHidden: false,
    ctrls:null,
    windowContent: null,
    buttonAlign: 'left',
    getWindow: function() {
    	return this;
	},
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
	    var self = this;
	    // register the baselayer change handler
	    this.map.events.on({
	        'changebaselayer': this.onBaseLayerChange,
	        scope: this
	    });
	    
	    var cookieState = Ext.util.Cookies.get("ingrid.webmap.client.welcome.dialog.hide") === "true";

	    var self = this;
	    this.buttons = [
	      Ext.create('Ext.form.Checkbox', {
	    	  id: 'disableWelcomeDialog', 
	    	  boxLabel: i18n('tDisableWelcome'), 
	          checked: cookieState, 
	          handler: self.handleDisableWelcomeDialog 
	      })/*,
	      new Ext.Toolbar.Fill(),
	      { 
	        text: 'Close', handler: function() {
	            self.close();
	        }
	      }*/
	    ];
	    this.superclass.initComponent.call(this);
	},
	handleDisableWelcomeDialog: function(element, isActive) {
		// cookie is valid one year from now
		var date = new Date();
		var nextDate = new Date();
		nextDate.setFullYear(date.getFullYear()+1);
	    Ext.util.Cookies.set("ingrid.webmap.client.welcome.dialog.hide", isActive, nextDate);
	}
});