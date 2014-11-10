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
Ext.namespace("de.ingrid.mapclient");

/**
 * @class Configuration holds all configuration parameters and gives access to them.
 * On application startup the de.ingrid.mapclient.Configuration.load() method must
 * be called to initialize the configuration.
 *
 * @constructor
 */
de.ingrid.mapclient.Configuration = function() {

	/**
	 * The static configuration
	 */
	this.staticConfig = {};

	/**
	 * The dynamic configuration
	 */
	this.dynamicConfig = {};

	/**
	 * Indicates if the configuration is loaded
	 */
	this.isLoaded = false;
	
	/**
	 * hide (or not) experimental features
	 */
	this.hiddenFeature = true;
};

/**
 * Load the configuration from the server
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.Configuration.load = function(responseHandler) {
	
	de.ingrid.mapclient.Configuration.instance = new de.ingrid.mapclient.Configuration();
	// load the dynamic configuration
	Ext.Ajax.request({
		url: de.ingrid.mapclient.PERSISTENT_DYNAMIC_CONFIG_BASE_URL,
		method: 'GET',
		success: function(response, request) {
			// merge the configuration values into the instance
			var config = Ext.decode(response.responseText);
			Ext.apply(de.ingrid.mapclient.Configuration.instance.dynamicConfig, config);

			// load the static configuration
			Ext.Ajax.request({
				url: de.ingrid.mapclient.STATIC_CONFIG_BASE_URL,
				method : 'GET',
				success : function(response, request) {
					// merge the configuration values into the instance
					var config = Ext.decode(response.responseText);
					for (var i=0, count=config.length; i<count; i++) {
						var curValue = config[i];
						de.ingrid.mapclient.Configuration.instance.staticConfig[curValue['@name']] = curValue['@value'];
					}

					// set the load status
					de.ingrid.mapclient.Configuration.instance.isLoaded = true;

					// call the callback
					if (responseHandler.success instanceof Function) {
						responseHandler.success(response.responseText);
					}
				}
			});
		},
		failure: function(response, request) {
			if (responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		}
	});
};

/**
 * Get a value from the dynamic configuration
 * @param key The name of the value
 * @return Object
 */
de.ingrid.mapclient.Configuration.getValue = function(key) {
	this.checkLoaded();
	return de.ingrid.mapclient.Configuration.instance.dynamicConfig[key];
};

/**
 * Set a value in the configuration and store it to the server. Each value is
 * supposed to be stored by sending a POST request to DYNAMIC_CONFIG_BASE_URL+'/'+key
 * @param key The name of the value
 * @param value The value as JSON encoded string
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.Configuration.setValue = function(key, value, responseHandler) {
	this.checkLoaded();
	Ext.Ajax.request({
		url: de.ingrid.mapclient.DYNAMIC_CONFIG_BASE_URL+'/'+key,
		method: 'POST',
		headers: { 'Content-Type': 'text/plain' },
		success: function(response, request) {
			if (responseHandler.success instanceof Function) {
				responseHandler.success(response.responseText);
			}
			// only change local value on success
			de.ingrid.mapclient.Configuration.instance.dynamicConfig[key] = value;
		},
		failure: function(response, request) {
			if (responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		},
		xmlData: value
	});
};

/**
 * Get a value from the static configuration
 * @param key The name of the value
 * @return String
 */
de.ingrid.mapclient.Configuration.getProperty = function(key) {
	this.checkLoaded();
	return de.ingrid.mapclient.Configuration.instance.staticConfig[key];
};

/**
 * Get a parameter from the application url
 * @param key The name of the parameter
 * @return String
 */
de.ingrid.mapclient.Configuration.getUrlParameter = function(key) {
	var getParams = document.URL.split("?");
	if (getParams.length > 1) {
		var params = Ext.urlDecode(getParams[getParams.length-1]);
		if (params[key]) {
			return params[key];
		}
	}
	return undefined;
};

/**
 * Check if the configuration is loaded and throw an exception if not
 */
de.ingrid.mapclient.Configuration.checkLoaded = function() {
	var instance = de.ingrid.mapclient.Configuration.instance;
	if (!instance || !instance.isLoaded) {
		throw "The configuration is not loaded.";
	}
};


/**
 * Get Settings from Admin
 */
de.ingrid.mapclient.Configuration.getSettings = function(key) {
	var settings = de.ingrid.mapclient.Configuration.getValue('settings');
	if(settings){
		for (var j=0, countJ=settings.length; j<countJ; j++) {
			var setting = settings[j];
			if(setting.key == key){
				var value = setting.value;
				// Check if boolean value
				if (value.toLowerCase()=='false'){
					value = false;
				} else if (value.toLowerCase()=='true'){
				    value =  true;
				}
				return value;
			}
		}
	}
};