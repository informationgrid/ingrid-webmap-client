/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient");

/**
 * The base url for all requests
 * TODO: This needs to be dynamically replaced by the configured Proxy Url
 */
de.ingrid.mapclient.BASE_URL = '../rest/';

/**
 * Base url for all requests related to the dynamic application configuration.
 * A GET request to this url serves a complete dynamic configuration object.
 * Single configuration properties maybe written by POSTing to sub paths
 * named as the property (e.g. CONFIG_BASE_URL+'/wmsCapUrl')
 * @see de.ingrid.mapclient.Configuration
 */
de.ingrid.mapclient.DYNAMIC_CONFIG_BASE_URL = de.ingrid.mapclient.BASE_URL+'config/dynamic';

/**
 * Url for retrieving the static application configuration.
 * @see de.ingrid.mapclient.Configuration
 */
de.ingrid.mapclient.STATIC_CONFIG_BASE_URL = de.ingrid.mapclient.BASE_URL+'config/static';

/**
 * Url of the WMS capabilities proxy. Expected GET parameters:
 * - url The url of the WMS server to get the capabilities from
 */
de.ingrid.mapclient.WMS_PROXY_URL = de.ingrid.mapclient.BASE_URL+'wms/capabilities';

/**
 * Url for retrieving and saving session data
 */
de.ingrid.mapclient.SESSION_DATA_URL = de.ingrid.mapclient.BASE_URL+'session';