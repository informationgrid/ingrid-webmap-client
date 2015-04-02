/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
Ext.namespace("de.ingrid.mapclient.frontend.data");

/**
 * @class Service represents a mapclient session.
 */
de.ingrid.mapclient.frontend.data.MapUtils = function() {

};

/**
 * Get the current projection of a map
 * @return OpenLayers.Projection instance
 */
de.ingrid.mapclient.frontend.data.MapUtils.getMapProjection = function(map) {
	return (map.projection && map.projection instanceof OpenLayers.Projection) ? map.projection : new OpenLayers.Projection(map.projection);
};

/**
 * Zoom passed map to passed BBOX ("xMin,yMin,xMax,yMax"), also pass BBOX SRS as String (e.g. "EPSG:4326") !
 */
de.ingrid.mapclient.frontend.data.MapUtils.zoomTo = function(map, bbox, bboxSrs) {
    if (bbox != null && bboxSrs != null) {
        var inBounds = new OpenLayers.Bounds.fromString(bbox);
        var inProjection = new OpenLayers.Projection(bboxSrs);
        var mapProjection = map.getProjectionObject();
        if (mapProjection.getCode() != inProjection.getCode()){
            inBounds = inBounds.clone().transform(inProjection, mapProjection);                     
        }
        map.zoomToExtent(inBounds);
    }
};

/**
 * Get bounds
 * @return OpenLayers.Bounds instance
 */
de.ingrid.mapclient.frontend.data.MapUtils.getBoundsYX = function(layer, newProjCode) {
	var bounds = null;
	var version = layer.params.VERSION; 
	if(version == "1.3.0"){
		if(layer.yx){
			if(layer.yx[newProjCode]){
				if(layer.bbox[newProjCode]){
					var bbox = layer.bbox[newProjCode].bbox;
					bounds = new OpenLayers.Bounds(bbox[1], bbox[0], bbox[3], bbox[2]);
				}
			}else{
				for(var k in layer.yx){
					if(layer.bbox[k]){
						var bbox = layer.bbox[k].bbox;
						var tmpBounds = new OpenLayers.Bounds(bbox[1], bbox[0], bbox[3], bbox[2]);
						var bboxProjection = new OpenLayers.Projection(k);
						var newProjection = new OpenLayers.Projection(newProjCode);
						bounds = tmpBounds.clone().transform(bboxProjection, newProjection);
						break;
					}
				}
			}
		}
	}
	
	if(bounds == null){
		bounds = OpenLayers.Bounds.fromArray(layer.bbox[newProjCode].bbox);
	}
	return bounds
};

/**
 * Get the current projection of a map
 * @return OpenLayers.Projection instance
 */
de.ingrid.mapclient.frontend.data.MapUtils.changeProjection = function(newProjCode, map, container, zoomToExtent) {
	var oldProjection = de.ingrid.mapclient.frontend.data.MapUtils.getMapProjection(map);
	var newProjection = new OpenLayers.Projection(newProjCode);
	var initialExtent = de.ingrid.mapclient.frontend.data.MapUtils.getMaxExtent(newProjection);
	var mapExtent;
	
	if((oldProjection.projCode != newProjection.projCode) || zoomToExtent != undefined){
		if(zoomToExtent == undefined || zoomToExtent == true){
			var wgs84Proj = new OpenLayers.Projection("EPSG:4326");
			var bbox = map.baseLayer.llbbox;
			var bounds = null;
			if(bbox){
				bounds = new OpenLayers.Bounds.fromArray([bbox[0], bbox[1], bbox[2], bbox[3]]);
			}else{
				bounds = map.baseLayer.maxExtent;
			}
			var extent = bounds.transform(wgs84Proj, newProjection);
			mapExtent = extent;
		}else{
			// Reload from session
			if(container.map){
				if(container.map.baseLayer){
					mapExtent = container.map.baseLayer.maxExtent;
				}
			}
		}
		
		if(mapExtent){
			var options = {
					maxExtent: mapExtent,
					projection: newProjection.getCode(),
					units: newProjection.getUnits(),
					maxResolution: 'auto',
					numZoomLevels: parseInt(de.ingrid.mapclient.Configuration.getSettings("defaultNumZoomLevels").trim())
			};
			// reset map
			map.setOptions(options);
			// reset layers
			for(var i=0,len=map.layers.length; i<len; i++) {
				var layer = map.layers[i];
				layer.addOptions(options);
				// Transform features by projection change
				if(layer.features){
					for(key in layer.features){
						var feature = layer.features[key];
						feature.geometry.transform(oldProjection, newProjection); 
					}
				}
			}
			
			// reproject map.layerContainerOrigin, in case the next
			// call to moveTo does not change the zoom level and
			// therefore centers the layer container
			if(map.layerContainerOrigin) {
				map.layerContainerOrigin.transform(oldProjection, newProjection);
			}
			// only zoom into extent if the map initially had an extent
			if (zoomToExtent === undefined || zoomToExtent) {
				if(zoomToExtent == undefined){
					map.zoomToExtent(map.getExtent());
				}else{
					map.zoomToExtent(initialExtent);
				}
			}
			map.displayProjection = newProjection;
			var control = null;
			if (container && container.controls) {
				for (var k = 0; k < container.controls.length; k++) {
					control = container.controls[k];
					if (control.displayProjection) {
						control.displayProjection = newProjection;
					}
					if (control instanceof OpenLayers.Control.OverviewMap) {
						// reset map
						control.ovmap.setOptions(options);
						control.ovmap.baseLayer.addOptions(options);
						control.ovmap.zoomToExtent(mapExtent);
					}
					if (control.redraw) {
						control.redraw();
					}
				}
			} else {
				for (var i = 0; i < map.controls.length; i++) {
					control = map.controls[i];
					if (control.displayProjection) {
						control.displayProjection = newProjection;
					}
					if (control instanceof OpenLayers.Control.OverviewMap) {
						// reset map
						control.ovmap.setOptions(options);
						control.ovmap.baseLayer.addOptions(options);
						control.ovmap.zoomToExtent(mapExtent);
					}
						if (control.redraw) {
							control.redraw();
						}
				}
			}
		}
	}
};

/**
 * Get the configured maximal extent transformed by a projection.
 * 
 * @param protection A projection.
 * @return OpenLayers.Bounds instance
 */
de.ingrid.mapclient.frontend.data.MapUtils.getMaxExtent = function(protection) {
	var wgs84Proj = new OpenLayers.Projection("EPSG:4326");
	var bbox = de.ingrid.mapclient.Configuration.getValue("mapExtend");
	var bounds = new OpenLayers.Bounds.fromArray([bbox.west, bbox.south, bbox.east, bbox.north]);
	var extent = bounds.transform(wgs84Proj, protection);
	return extent;
};


/**
 * Check if the projection code has been loaded. If not load it. Call a callback.
 * 
 * @param protection A projection.
 * @param callback A callback.
 */
de.ingrid.mapclient.frontend.data.MapUtils.assureProj4jsDef = function(protectionCode, callback) {
	if (Proj4js.defs[protectionCode] == undefined) {
		// if the projection is not defined yet, we have to load the definition
		de.ingrid.mapclient.frontend.data.MapUtils.loadProjectionDef(protectionCode, function() {
			// change the projection after loading the definition
			callback();
		});
	}
	else {
		// change the projection directly
		callback();
	}
};

/**
 * Load the projection definition for the given projection
 * @param newProjCode EPSG code
 * @param callback Function to call after loading
 */
de.ingrid.mapclient.frontend.data.MapUtils.loadProjectionDef = function(newProjCode, callback) {
	var codeNumber = newProjCode.replace(/^EPSG:/, '');
	Ext.Ajax.request({
		url: de.ingrid.mapclient.PROJ4S_DEFS_URL+'/'+codeNumber,
		method: 'GET',
		success: function(response, request) {
			// we expect the projection definition in js
			var defJs = response.responseText;
			var regexp = new RegExp('^Proj4js\\.defs\\["'+newProjCode+'"] = ');
			if (defJs && defJs.match(regexp)) {
				// evaluate the js in order to define the projection
				eval(response.responseText);
			}
			if (callback instanceof Function) {
				callback();
			}
		},
		failure: function(response, request) {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_PROJECTION_FAILURE);
		}
	});
};

de.ingrid.mapclient.frontend.data.MapUtils.getParameter = function ( name ){
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
	var regexS = "[\\?&]"+name+"=([^&#]*)";  
	var regex = new RegExp( regexS );  
	var results = regex.exec( window.location.href ); 
	if(results == null)    
		return "";  
	else    
		return results[1];
}

de.ingrid.mapclient.frontend.data.MapUtils.addCapabilitiesParameter = function (capabilities){
	var value = capabilities.toLowerCase();
	var hasService = false;
	var hasRequest = false;
	if(value.indexOf("service=") > -1){
		hasService = true;
	}
	
	if(value.indexOf("request=") > -1){
		hasRequest = true;
	}
	
	if(hasService == false && hasRequest == false){
		if(value.indexOf("?") < 0){
			capabilities = capabilities + "?";
		}
	}
	
	if(hasRequest == false){
		capabilities = capabilities + "&REQUEST=GetCapabilities"
	}
	
	if(hasService == false){
		capabilities = capabilities + "&SERVICE=WMS"
	}
	
	return capabilities;
};
