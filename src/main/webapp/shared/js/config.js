/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient");

/**
 * The base url for all requests
 * TODO: This needs to be dynamically replaced by the configured Proxy Url
 */
de.ingrid.mapclient.BASE_URL = '/ingrid-webmap-client/rest/';

/**
 * Base url for all requests related to the dynamic application configuration.
 * A GET request to this url serves a complete dynamic configuration object.
 * Single configuration properties maybe written by POSTing to sub paths
 * named as the property (e.g. CONFIG_BASE_URL+'/wmsCapUrl')
 * @see de.ingrid.mapclient.Configuration
 */
de.ingrid.mapclient.DYNAMIC_CONFIG_BASE_URL = de.ingrid.mapclient.BASE_URL+'config/dynamic';

/**
 * Base url for all requests related to the dynamic application persistentconfiguration.
 * A GET request to this url serves a complete dynamic persistentconfiguration object.
 * Single persistentconfiguration properties maybe written by POSTing to sub paths
 * named as the property (e.g. CONFIG_BASE_URL+'/wmsCapUrl')
 * @see de.ingrid.mapclient.PersistentConfiguration
 */
de.ingrid.mapclient.PERSISTENT_DYNAMIC_CONFIG_BASE_URL = de.ingrid.mapclient.BASE_URL+'config/persdynamic';

/**
 * the url to send the data for copying a service to
 * @see de.ingrid.mapclient.frontend.data.ServiceContainer
 */
de.ingrid.mapclient.COPY_SERVICE_URL = de.ingrid.mapclient.BASE_URL+'config/copyservice';

/**
 * the url to send the data for adding a service to
 * @see de.ingrid.mapclient.frontend.data.ServiceContainer
 */
de.ingrid.mapclient.ADD_SERVICE_URL = de.ingrid.mapclient.BASE_URL+'config/addservice';

/**
 * the url to send the data for editing a service to
 * @see de.ingrid.mapclient.frontend.data.ServiceContainer
 */
de.ingrid.mapclient.UPDATE_SERVICE_URL = de.ingrid.mapclient.BASE_URL+'config/updateservice';
/**
 * the url to send the data for removing a service to
 * @see de.ingrid.mapclient.frontend.data.ServiceContainer
 */
de.ingrid.mapclient.REMOVE_SERVICE_URL = de.ingrid.mapclient.BASE_URL+'config/removeservice';
/**
 * the url to send the data for getting a service 
 * @see de.ingrid.mapclient.frontend.data.ServiceContainer
 */
de.ingrid.mapclient.GET_SERVICE_URL = de.ingrid.mapclient.BASE_URL+'config/getservice';

/**
 * Url for retrieving the static application configuration.
 * @see de.ingrid.mapclient.Configuration
 */
de.ingrid.mapclient.STATIC_CONFIG_BASE_URL = de.ingrid.mapclient.BASE_URL+'config/static';

/**
 * Url of the WMS proxy. Expected GET parameters:
 * - url The url of the WMS server make the request to
 */
de.ingrid.mapclient.WMS_PROXY_URL = de.ingrid.mapclient.BASE_URL+'wms/proxy';
/**
 * Url of the WMS proxy. Expected GET parameters:
 * - url The url of the WMS server make the request to
 */
de.ingrid.mapclient.WMS_ADMIN_INFO_PROXY_URL = de.ingrid.mapclient.BASE_URL+'wms/proxyAdministrativeInfos';
/**
 * Url for retrieving and saving session data
 */
de.ingrid.mapclient.SESSION_DATA_URL = de.ingrid.mapclient.BASE_URL+'data/session';

/**
 * Url for retrieving and saving user data
 */
de.ingrid.mapclient.USER_DATA_URL = de.ingrid.mapclient.BASE_URL+'data/user';

/**
 * Url for retrieving user data encoded in a short url
 */
de.ingrid.mapclient.SHORTURL_DATA_URL = de.ingrid.mapclient.BASE_URL+'data/maps';

/**
 * Url of print server
 */
de.ingrid.mapclient.PRINT_URL = de.ingrid.mapclient.BASE_URL+'../pdf';

/**
 * Url for help content
 */
de.ingrid.mapclient.HELP_URL = de.ingrid.mapclient.BASE_URL+'../../hilfe?hkey=maps-1';
/**
 * Url for help extended search help content
 */
de.ingrid.mapclient.HELP_URL_EXT_SEARCH = de.ingrid.mapclient.BASE_URL+'../../hilfe?hkey=ext-search-spacial-6';

/**
 * Url for retrieving projection definitions
 */
de.ingrid.mapclient.PROJ4S_DEFS_URL = de.ingrid.mapclient.BASE_URL+'proj4s/defs';
/**
 * Url for searching
 */
de.ingrid.mapclient.SEARCH_URL = de.ingrid.mapclient.BASE_URL+'search/query';
/**
 * Url for downloading
 */
de.ingrid.mapclient.DOWNLOAD_URL = de.ingrid.mapclient.BASE_URL+'data/currentmap';
/**
 * Url for downloading
 */
de.ingrid.mapclient.MAP_SITE = de.ingrid.mapclient.BASE_URL+'data/mapsite';
/**
 * View configurations for the map client frontend.
 * @see de.ingrid.mapclient.frontend.Workspace
 * TODO: This may be moved to the server
 */
de.ingrid.mapclient.VIEW_CONFIG = {
		"default": {
	    	hasServicesPanel: true,
	    	hasInfoTool: true,
	    	hasHistoryTool: true,
	    	hasMeasureTool: true,
	    	hasPrintTool: true,
	    	hasLoadTool: true,
	    	hasSaveTool: true,
	    	hasHelpTool: true,
	    	hasProjectionsList: true,
	    	hasScaleList: true,
	    	hasAreasList: true,
	    	hasPermaLink: false,
	    	isFullScreen: true,
	    	hasSettings: true,
	    	hasDownloadTool : true,
	    	hasZoomTool : true
	    	
		},
		"portalu-fullmap": {
	    	hasServicesPanel: true,
	    	hasInfoTool: true,
	    	hasHistoryTool: true,
	    	hasMeasureTool: true,
	    	hasPrintTool: true,
	    	hasLoadTool: true,
	    	hasSaveTool: true,
	    	hasHelpTool: true,
	    	hasProjectionsList: true,
	    	hasScaleList: true,
	    	hasAreasList: true,
	    	hasPermaLink: false,
	    	isFullScreen: true,
	    	spacerTop: 142,
	    	hasSettings: true,
	    	hasDownloadTool : true,
	    	hasZoomTool : true
	    	
		},
		"portalu-facete-search": {
	    	hasServicesPanel: false,
	    	hasAreaTool:true,
	    	hasInfoTool: true,
	    	hasHistoryTool: false,
	    	hasMeasureTool: false,
	    	hasPrintTool: false,
	    	hasLoadTool: false,
	    	hasSaveTool: false,
	    	hasHelpTool: true,
	    	hasProjectionsList: false,
	    	hasScaleList: true,
	    	hasAreasList: true,
	    	hasPermaLink: false,
	    	isFullScreen: false,
	    	panelHeight: 500,
	    	hasBboxSelectTool: true,
	    	hasSettings: false,
	    	hasZoomTool : false
		},
		"portalu-extended-search": {
	    	hasServicesPanel: false,
	    	hasAreaTool:true,
	    	hasInfoTool: true,
	    	hasHistoryTool: false,
	    	hasMeasureTool: false,
	    	hasPrintTool: false,
	    	hasLoadTool: false,
	    	hasSaveTool: false,
	    	hasHelpTool: true,
	    	hasProjectionsList: false,
	    	hasScaleList: true,
	    	hasAreasList: true,
	    	hasPermaLink: false,
	    	isFullScreen: false,
	    	panelHeight: 676,
	    	hasBboxSelectTool: true,
	    	hasSettings: false,
	    	hasZoomTool : false
		}		
};

/**
 * Proxy for OpenLayers XMLHttpRequests
 */
OpenLayers.ProxyHost = de.ingrid.mapclient.BASE_URL+'wms/proxy?url=';