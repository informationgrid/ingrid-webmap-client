/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.basic");

/**
 * @class DefaultExtendPanel is used to configure the proxy server.
 */
de.ingrid.mapclient.admin.modules.basic.ProxyPanel = Ext.extend(Ext.Panel, {

	title: 'Proxy Zugriff',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,

	/**
	 * The field that contains the proxy url
	 */
	proxyUrlField: new Ext.form.TextField({
		fieldLabel: 'Proxy Url',
		anchor: '99%'
	})

});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.ProxyPanel.prototype.initComponent = function() {

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
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.admin.modules.basic.ProxyPanel.prototype.onRender = function() {
	de.ingrid.mapclient.admin.modules.basic.ProxyPanel.superclass.onRender.apply(this, arguments);

	// initialize the proxyUrl field
	var proxyUrl = de.ingrid.mapclient.Configuration.getValue("proxyUrl");
	this.proxyUrlField.setValue(proxyUrl);
};

/**
 * Save the proxy url on the server
 */
de.ingrid.mapclient.admin.modules.basic.ProxyPanel.prototype.saveProxyUrl = function() {
	var proxyUrl = this.proxyUrlField.getValue();
	de.ingrid.mapclient.Configuration.setValue('proxyUrl', proxyUrl, de.ingrid.mapclient.admin.DefaultSaveHandler);
};