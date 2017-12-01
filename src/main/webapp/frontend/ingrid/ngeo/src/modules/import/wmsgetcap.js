goog.module('ngeo.wmsGetCapDirective');
goog.module.declareLegacyNamespace();

goog.require('ol.format.WMSCapabilities');
goog.require('ol.extent');
goog.require('ol.proj');


/**
 * @constructor
 * @param {Window} $window The window.
 * @param {gettext} gettext Gettext.
 * @param {angularGettext.Catalog} gettextCatalog Gettext catalog.
 * @param {string|function(!angular.JQLite=, !angular.Attributes=)}
 *     ngeoWmsGetCapTemplateUrl The template url.
 * @ngInject
 */
exports = function($window, gettext, gettextCatalog, ngeoWmsGetCapTemplateUrl) {

  // Get the layer extent defines in the GetCapabilities
  const getLayerExtentFromGetCap = function(getCapLayer, proj) {
    const wgs84 = 'EPSG:4326';
    const layer = getCapLayer;
    const projCode = proj.getCode();

    if (layer['BoundingBox']) {
      for (let i = 0, ii = layer['BoundingBox'].length; i < ii; i++) {
        const bbox = layer['BoundingBox'][i];
        // INGRID: Check extent for WMS version 1.1.1 and 1.3.0
        if (bbox['extent'] && bbox['crs']) {
          const code = bbox['crs'] || bbox['srs'];
          if (code && code.toUpperCase() == projCode.toUpperCase()) {
            return bbox['extent'];
          }
        } else {
          const code = bbox['CRS'] || bbox['SRS'];
          if (code && code.toUpperCase() == projCode.toUpperCase()) {
            return [parseFloat(bbox['minx']), parseFloat(bbox['miny']), parseFloat(bbox['maxx']), parseFloat(bbox['maxy'])];
          }
        }
      }
    }

    const wgs84Extent = layer['EX_GeographicBoundingBox'] || layer['LatLonBoundingBox'];
    if (wgs84Extent) {
      // INGRID: Add 'extent'
      let extent = layer['EX_GeographicBoundingBox'] ||
        [
          parseFloat(wgs84Extent['minx']),
          parseFloat(wgs84Extent['miny']),
          parseFloat(wgs84Extent['maxx']),
          parseFloat(wgs84Extent['maxy'])
        ];
      // If only an extent in wgs 84 is available, we use the
      // intersection between proj extent and layer extent as the new
      // layer extent. We compare extients in wgs 84 to avoid
      // transformations errors of large wgs 84 extent like
      // (-180,-90,180,90)
      const projWgs84Extent = ol.proj.transformExtent(proj.getExtent(), projCode, wgs84);
      const layerWgs84Extent = ol.extent.getIntersection(projWgs84Extent, wgs84Extent);
      // INGRID: Change 'layerWgs84Extent' to 'extent'
      if (extent) {
        return ol.proj.transformExtent(extent, wgs84, projCode);
      }
    }
  };

  // Test if the layer can be displayed with a specific projection
  const canUseProj = function(layer, projCode) {
    const projCodeList = layer['CRS'] || layer['SRS'] || [];
    return (projCodeList.indexOf(projCode.toUpperCase()) != -1 ||
        projCodeList.indexOf(projCode.toLowerCase()) != -1);
  };

  // Go through all layers, assign needed properties,
  // and remove useless layers (no name or bad crs without children
  // or no intersection between map extent and layer extent)
  // INGRID: Add parentLayer param
  const getChildLayers = function(getCap, layer, proj, parentLayer) {

    // If the WMS layer has no name, it can't be displayed
    if (!layer['Name']) {
      layer['isInvalid'] = true;
      layer['Abstract'] = gettext('Invalid layer: missing name');
    }

    if (!layer['isInvalid']) {
      // INGRID: Edit check wmsUrl
      const dcpType = getCap['Capability']['Request']['GetMap']['DCPType'];
      if (dcpType instanceof Array) {
        layer['wmsUrl'] = dcpType[0]['HTTP']['Get']['OnlineResource'];  
      } else {
        layer['wmsUrl'] = dcpType['HTTP']['Get']['OnlineResource']['xlink:href'];
      }
      layer['wmsVersion'] = getCap['version'];
      layer['id'] = `WMS||${layer['wmsUrl']}||${layer['Name']}`;
      layer['extent'] = getLayerExtentFromGetCap(layer, proj);

      // INGRID: inheritance of parent layer params
      if (parentLayer) {
        // INGRID: Check parents 'SRS' or 'CRS'
        const parentProjList = parentLayer['CRS'] || parentLayer['SRS'] || parentLayer;
        if (parentProjList) {
          if (parentProjList instanceof Array) {
            if (layer['SRS']) {
              if (layer['SRS'] instanceof Array) {
                  layer['SRS'] = layer['SRS'].concat(parentProjList.filter(function (item) {
                      return layer['SRS'].indexOf(item) < 0;
                  }));
              } else {
                if(parentProjList.indexOf(layer['SRS']) == -1){
                  layer['SRS'] = parentProjList.concat(layer['SRS']);
                }
              }
            } else if (layer['CRS']) {
              layer['CRS'] = parentProjList.concat(layer['CRS'].filter(function (item) {
                return parentProjList.indexOf(item) < 0;
              }));
            } else if (layer['wmsVersion'] === '1.1.1') {
              layer['SRS'] = parentProjList; 
            } else if (layer['wmsVersion'] === '1.3.0') {
              layer['CRS'] = parentProjList;
            }
          }
        }

        // INGRID: Check parents 'BoundingBox'
        if (!layer['BoundingBox']) {
          if (parentLayer['BoundingBox']) {
            layer['BoundingBox'] = parentLayer['BoundingBox'];
          }
        }

        // INGRID: Check parents 'LatLonBoundingBox'
        if (!layer['LatLonBoundingBox']) {
          if (parentLayer['LatLonBoundingBox']) {
            layer['LatLonBoundingBox'] = parentLayer['LatLonBoundingBox'];
          }
        }

        // INGRID: Check parents 'extent'
        if (!layer['extent']) {
          if (parentLayer['extent']) {
            layer['extent'] = parentLayer['extent'];
          }
        }
        
        // INGRID: Check parent 'queryable'
        if (!layer['queryable']) {
          if (parentLayer['queryable']) {
              layer['queryable'] = parentLayer['queryable'];
          }
        }
      }

      // if the layer has no extent, it is set as invalid.
      // We don't have proj codes list for wms 1.1.1 so we assume the
      // layer can be displayed (wait for
      // https://github.com/openlayers/ol3/pull/2944)
      const projCode = proj.getCode();
      if (getCap['version'] == '1.3.0' && !canUseProj(layer, projCode)) {
        layer['useReprojection'] = true;

        if (!layer['extent']) {
          layer['isInvalid'] = true;
          layer['Abstract'] = gettext('Invalid layer: outside the map');
        }
      }
    }

    // Go through the child to get valid layers
    if (layer.Layer) {

      for (let i = 0; i < layer.Layer.length; i++) {
        // INGRID: Add parent param
        const parent = layer || parentLayer;
        const l = getChildLayers(getCap, layer.Layer[i], proj, parent);
        if (!l) {
          layer.Layer.splice(i, 1);
          i--;
        }
      }

      // No valid child
      if (layer.Layer.length == 0) {
        layer.Layer = undefined;
      }
    }

    if (layer['isInvalid'] && !layer.Layer) {
      return undefined;
    }

    return layer;
  };

  return {
    restrict: 'A',
    templateUrl: ngeoWmsGetCapTemplateUrl,
    scope: {
      'getCap': '=ngeoWmsGetCap',
      'map': '=ngeoWmsGetCapMap',
      'options': '=ngeoWmsGetCapOptions'
    },
    link(scope) {

      // List of layers available in the GetCapabilities.
      // The layerXXXX properties use layer objects from the parsing of
      // a  GetCapabilities file, not ol layer object.
      scope['layers'] = [];
      scope['options'] = scope['options'] || {};
      scope.$watch('getCap', (val) => {
        let err;
        try {
          // INGRID: Read WMS version 1.1.1 as XML
          let capabilities = val.WMT_MS_Capabilities || val.WMS_Capabilities;
          if (capabilities) {
            let version = capabilities.version;
            if (version === '1.3.0') {
              val = new ol.format.WMSCapabilities().read(val.xmlResponse);
            } else {
              val = val.WMT_MS_Capabilities || val.WMS_Capabilities;
            }
          }
        } catch (e) {
          err = e;
        }

        if (err || !val) {
          $window.console.error('WMS GetCap parsing failed: ', err || val);
          scope['userMsg'] = gettext('Parsing failed');
          return;
        }

        scope['limitations'] = '';
        scope['layers'] = [];
        scope['options'].layerSelected = null; // the layer selected on click
        scope['options'].layerHovered = null;

        if (val && val['Service'] && val['Capability']) {
          if (val['Service']['MaxWidth']) {
            scope['limitations'] = `${gettextCatalog.getString('Maximum WMS size allowed')
                } ${val['Service']['MaxWidth']
                } * ${val['Service']['MaxHeight']}`;
          }

          if (val['Capability']['Layer']) {
            const root = getChildLayers(val, val['Capability']['Layer'],
                scope['map'].getView().getProjection());
            if (root) {
              scope['layers'] = root['Layer'] || [root];
            }
          }
        }
      });

      // Add the selected layer to the map
      scope['addLayerSelected'] = function() {
        const getCapLay = scope['options'].layerSelected;
        if (getCapLay && scope['options']['getOlLayerFromGetCapLayer']) {
          let msg = gettextCatalog.getString('WMS layer added succesfully');
          try {
            const olLayer = scope['options']['getOlLayerFromGetCapLayer'](getCapLay);
            if (olLayer) {
              scope['map'].addLayer(olLayer);
            }

          } catch (e) {
            $window.console.error(`Add layer failed:${e}`);
            msg = `${gettextCatalog.getString('WMS layer could not be added')} ${e.message}`;
          }
          $window.alert(msg);
        }
      };

      // Get the abstract to display in the text area
      scope['getAbstract'] = function() {
        const l = scope['options'].layerSelected || scope['options'].layerHovered || {};
        return gettextCatalog.getString(l.Abstract) || '';
      };
    }
  };
};

exports.module = angular.module('ngeo.wmsGetCapDirective', [
  'gettext'
]);

exports.module.value('ngeoWmsGetCapTemplateUrl',
    /**
     * @param {angular.JQLite} element Element.
     * @param {angular.Attributes} attrs Attributes.
     * @return {string} Template URL.
     */
    (element, attrs) => {
      const templateUrl = attrs['ngeoWmsGetCapTemplateUrl'];
      return templateUrl !== undefined ? templateUrl :
          `${ngeo.baseModuleTemplateUrl}/import/partials/wms-get-cap.html`;
    });

/**
 * This directive displays the list of layers available in the
 * GetCapabilities object.
 */
exports.module.directive('ngeoWmsGetCap', exports);
