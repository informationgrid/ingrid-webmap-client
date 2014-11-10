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
 * Copyright (c) 2012 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.data");

Ext.define('de.ingrid.mapclient.frontend.data.WMSCapabilitiesReader', {
	extend: 'GeoExt.data.reader.WmsCapabilities',
	require: [
	          'GeoExt.data.WmsCapabilitiesLayerModel',
	          'GeoExt.data.reader.WmsCapabilities'
	],
	model: 'GeoExt.data.WmsCapabilitiesLayerModel',
	/**
	 * @see GeoExt.data.WMSCapabilitiesReader.readRecords
	 * This method is overwritten in order to add a nestedLayers attribute to the
	 * created records.
	 */
	readRecords: function(data) {
		// do parent class processing
		var result = this.superclass.readRecords.call(this, data);

		// parse capabilities data to get the layers
		// NOTE: this is actually done twice, but it seems to be a cheap operation
		if(typeof data === "string" || data.nodeType) {
			data = this.format.read(data);
		}
		var capability = data.capability || {};
		var layers = capability.layers;

		// add nestedLayer/isRootLayer option to each layer
		if(layers) {
			for(var i=0, lenI=layers.length; i<lenI; i++){
				var layer = layers[i];

				var customOptions = {
					nestedLayers: this.getNestedLayerNames(layer),
					isRootLayer: this.isRootLayer(layer, layers),
					service: data.service
				};

				var record = result.records[i];
				var recordLayer = record.getLayer();
				recordLayer.options = Ext.apply(recordLayer.options, customOptions);
				record.set("layer", recordLayer);
			}
		}

		return result;
	},

	/**
	 * Extract the names of nested layers contained in the given layer
	 * @param layer The layer to extract the layers from
	 * @return Array of strings
	 */
	getNestedLayerNames: function(layer) {
		var nestedLayerNames = [];
		var nestedLayers = layer.nestedLayers;
		if (nestedLayers) {
			for (var i=0, count=nestedLayers.length; i<count; i++) {
				nestedLayerNames.push(nestedLayers[i].name);
			}
		}
		return nestedLayerNames;
	},

	/**
	 * Check if the given layer is contained in nested layers of any other layer
	 * @param layer The layer to check
	 * @param allLayers Array of all layers
	 * @return Boolean
	 */
	isRootLayer: function(layer, allLayers) {
		for (var i=0, countI=allLayers.length; i<countI; i++) {
			var curLayer = allLayers[i];
			for (var j=0, countJ=curLayer.nestedLayers.length; j<countJ; j++) {
				if (layer.name == curLayer.nestedLayers[j].name) {
					return false;
				}
			}
		}
		return true;
	}
});
