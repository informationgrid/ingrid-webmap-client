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
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultExtendPanel is used to configure the proxy server.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.ProxyPanel', { 
	extend: 'Ext.form.Panel',
	id: 'proxyPanel',
	title: 'Proxy Zugriff',
	layout: {
	    type: 'vbox',
	    pack: 'start',
	    align: 'stretch'
	},
	border: false,
	autoScroll: true,
	bodyPadding: 10,
	
	/**
	 * The field that contains the proxy url
	 */
	proxyUrlField: Ext.create('Ext.form.TextField', {
		id: 'proxyPanelTextField',
		fieldLabel: 'Proxy Url',
		labelAlign: 'top',
		labelSeparator: '',
		anchor: '99%'
	}),
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		var self = this;
		Ext.apply(this, {
			items: [{
				html: '<p>Die Proxy Zugriffs Url benutzt der Browser des Anwenders, um auf den Karten-Client zuzugreifen.<br />'+
					'Verwenden Sie diese Einstellung, wenn Sie die Karten-Client Applikation hinter einem Proxy installiert haben.</p>',
				border: false
			}, {
			    // spacer
				xtype: 'container',
				height: 20
		    }, {
				xtype: 'container',
				layout: 'column',
				anchor: '100%',
				items: [{
					xtype: 'container',
					columnWidth: 1,
					layout: 'form',
					labelAlign: 'top',
					labelSeparator: '',
					height: 50,
					items: [this.proxyUrlField]
				}]
			}],
			buttons:[
			    {
			    	id: 'proxyPanelBtnSave',
					xtype: 'button',
					text: 'Einstellungen speichern',
					fieldLabel: '&nbsp;',
					anchor: '100%',
						handler: function() {
						self.saveProxyUrl();
						}
			    }
			]
		});
		de.ingrid.mapclient.admin.modules.basic.ProxyPanel.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		de.ingrid.mapclient.admin.modules.basic.ProxyPanel.superclass.onRender.apply(this, arguments);

		// initialize the proxyUrl field
		var proxyUrl = de.ingrid.mapclient.Configuration.getValue("proxyUrl");
		this.proxyUrlField.setValue(proxyUrl);
	},
	/**
	 * Save the proxy url on the server
	 */
	saveProxyUrl: function() {
		var proxyUrl = this.proxyUrlField.getValue();
		de.ingrid.mapclient.Configuration.setValue('proxyUrl', proxyUrl, de.ingrid.mapclient.admin.DefaultSaveHandler);
	}
});