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
 * @class FeatureInfoControl extends OpenLayers WMSGetFeatureInfo in order to
 * handle all responses returned from the server
 */
Ext.define('de.ingrid.mapclient.frontend.controls.FeatureInfoControl', {
	extend: 'OpenLayers.Control.WMSGetFeatureInfo',
	constructor: function (config) {
		this.initialize();
		this.initConfig(config);
		this.callParent(arguments);
	},
	/**
	 * @see OpenLayers.Control.WMSGetFeatureInfo.findLayers
	 */
	findLayers: function() {
		var layers = this.superclass.findLayers.call(this);

		// only use queryable layers
		var queryableLayers = [];
		for (var i=0, count=layers.length; i<count; i++) {
			if (layers[i].queryable == true) {
				queryableLayers.push(layers[i]);
			}
		}

		return queryableLayers;
	},
	/**
	 * @see OpenLayers.Control.WMSGetFeatureInfo.buildWMSOptions
	 */
	buildWMSOptions: function(url, layers, clickPosition, format) {
		var options = this.superclass.buildWMSOptions.call(this, url, layers, clickPosition, format);

		// use overridden callback
		options.callback = function(request) {
			this.handleResponse(clickPosition, request, url, layers);
		};
		return options;
	},
	/**
	 * @see OpenLayers.Control.WMSGetFeatureInfo.buildWMSOptions
	 */
	triggerGetFeatureInfo: function(request, xy, features, url, layers) {
		this.events.triggerEvent("getfeatureinfo", {
			text: request.responseText,
			features: features,
			request: request,
			xy: xy,
			url: url,
			layers: layers
		});

		// Reset the cursor.
		OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
	},
	/**
	 * @see OpenLayers.Control.WMSGetFeatureInfo.handleResponse
	 */
	handleResponse: function(xy, request, url, layers) {
		var doc = request.responseXML;
		if(!doc || !doc.documentElement) {
			doc = request.responseText;
		}
		var features = this.format.read(doc);
		this.triggerGetFeatureInfo(request, xy, features, url, layers);

		this._requestCount++;
		if (this._requestCount === this._numRequests) {
			delete this._features;
			delete this._requestCount;
			delete this._numRequests;
		}
	}
});