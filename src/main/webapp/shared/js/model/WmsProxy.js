/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.model");

/**
 * @class WmsProxy provides functionalities for proxying WMS servers.
 *
 * @constructor
 */
de.ingrid.mapclient.model.WmsProxy = function() {
};

/**
 * Get the proxy url for a GetCapabilities request
 * @param url The url
 */
de.ingrid.mapclient.model.WmsProxy.getCapabilitiesUrl = function(url) {
	return de.ingrid.mapclient.WMS_PROXY_URL+'/?url='+url.replace(/\?/g, "%3F").replace(/&/g, "%26");
};
