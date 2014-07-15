/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultExtendPanel is used to configure the proxy server.
 */
Ext.define('de.ingrid.mapclient.admin.modules.basic.ProxyPanel', { 
	extend: 'Ext.panel.Panel',
	title: 'Proxy Zugriff',
	layout: 'form',
	buttonAlign: 'right',
	border: false,
	bodyPadding: 10,
	
	/**
	 * The field that contains the proxy url
	 */
	proxyUrlField: Ext.create('Ext.form.TextField', {
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
					items: this.proxyUrlField
				}, {
					xtype: 'container',
					width: 100,
					layout: 'form',
					labelAlign: 'top',
					labelSeparator: '',
					height: 50,
					items: {
						xtype: 'button',
						text: 'Speichern',
						fieldLabel: '&nbsp;',
						anchor: '100%',
						handler: function() {
							self.saveProxyUrl();
						}
					}
				}]
			}]
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