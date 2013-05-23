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
 * Get the current projection of a map
 * @return OpenLayers.Projection instance
 */
de.ingrid.mapclient.frontend.data.MapUtils.changeProjection = function(newProjCode, map, container, zoomToExtent) {
	var oldProjection = de.ingrid.mapclient.frontend.data.MapUtils.getMapProjection(map);
	var newProjection = new OpenLayers.Projection(newProjCode);
	var newMaxExtent = de.ingrid.mapclient.frontend.data.MapUtils.getMaxExtent(newProjection);
	var newExtent;
	var mapExtent = container.bounds;
	if (mapExtent) {
		newExtent = mapExtent.clone().transform(oldProjection, newProjection);
	} else {
		newExtent = container.map.baseLayer.maxExtent.clone().transform(oldProjection, newProjection);
	}
	var options = {
		maxExtent: newExtent,
		projection: newProjection.getCode(),
		units: newProjection.getUnits(),
		maxResolution: 'auto'
	};

	// reset map
	map.setOptions(options);
	// reset layers
	for(var i=0,len=map.layers.length; i<len; i++) {
		map.layers[i].addOptions(options);
	}
	// reproject map.layerContainerOrigin, in case the next
	// call to moveTo does not change the zoom level and
	// therefore centers the layer container
	if(map.layerContainerOrigin) {
		map.layerContainerOrigin.transform(oldProjection, newProjection);
	}
	
	// only zoom into extent if the map initially had an extent
	if (typeof(zoomToExtent) === "undefined" || zoomToExtent) {
		map.zoomToExtent(newMaxExtent);
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
            	var newExtent = control.ovmap.getExtent().clone().transform(oldProjection, newProjection);
            	control.ovmap.setOptions(options);
            	control.ovmap.baseLayer.addOptions(options);            	
            	control.ovmap.zoomToExtent(newExtent);
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
            	var newExtent = control.ovmap.getExtent().clone().transform(oldProjection, newProjection);
            	control.ovmap.setOptions(options);            	
            	control.ovmap.baseLayer.addOptions(options);            	
            	control.ovmap.zoomToExtent(newExtent);
            }
            if (control.redraw) {
                control.redraw();
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









