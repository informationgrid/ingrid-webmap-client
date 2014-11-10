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
