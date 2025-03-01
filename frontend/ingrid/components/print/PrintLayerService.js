goog.provide('ga_printlayer_service');

// INGRID: Add 'ga_wms_service'
goog.require('ga_wms_service');
goog.require('ga_layers_service');
goog.require('ga_maputils_service');
goog.require('ga_printstyle_service');
goog.require('ga_translation_service');
goog.require('ga_urlutils_service');

(function() {

  var module = angular.module('ga_printlayer_service', [
    // INGRID: Add 'ga_wms_service'
    'ga_wms_service',
    'ga_translation_service',
    'ga_urlutils_service',
    'ga_printstyle_service',
    'ga_maputils_service',
    'ga_layers_service',
    'pascalprecht.translate'
  ]);

  module.provider('gaPrintLayer', function() {

    // INGRID: Add param 'gaWms'
    this.$get = function($document, $translate, gaGlobalOptions,
        gaLayers, gaTime, gaLang, gaPrintStyle, gaMapUtils,
        gaUrlUtils, gaWms) {

      return {
        // INGRID: Add param 'gaWms', 'gaGlobalOptions'
        encodeLegend: getEncodeLegend(gaLang, gaWms, gaGlobalOptions),
        encodeMatrixIds: getMatrixIds(gaMapUtils),
        encodeBase: encodeBase,
        encodeGroup: getEncodeGroup(gaLayers, gaPrintStyle,
            gaTime, gaMapUtils, gaGlobalOptions),
        encodeWMS: encodeWMS,
        // INGRID: Add OSM
        encodeOSM: encodeOSM,
        encodeDimensions: encodeDimensions,
        encodeWMTS: getEncodeWMTS(gaTime, gaMapUtils, gaGlobalOptions),
        // INGRID: Add 'gaMapUtils', 'gaGlobalOptions'
        encodeFeatures: getEncodeFeatures(gaPrintStyle, gaMapUtils,
            gaGlobalOptions),
        // INGRID: Add 'gaMapUtils', 'gaGlobalOptions'
        encodeVector: getEncodeVector(gaPrintStyle, gaMapUtils,
            gaGlobalOptions),
        encodeLayer: getEncodeLayer(gaLayers, gaPrintStyle,
            gaTime, gaMapUtils, gaGlobalOptions),
        encodeOverlay: getEncodeOverlay(gaUrlUtils),
        // INGRID: Change to 'getEncodeGraticule'
        encodeGraticule: getEncodeGraticule(gaMapUtils, gaGlobalOptions)
      };
    };
  });

  /* INGRID: Not in use
  var pdfLegendString = '_big.pdf';
  */
  var POINTS_PER_INCH = 72; // PostScript points 1/72"
  var UNITS_RATIO = 39.37; // inches per meter
  var styleId = 0;
  var format = new ol.format.GeoJSON();

  // INGRID: Add getEncodeGraticule
  function getEncodeGraticule(gaMapUtils, gaGlobalOptions) {
    return function encodeGraticule(dpi, map) {
      var l = gaGlobalOptions.defaultPrintGraticuleLayer;
      if (gaGlobalOptions.printDependOnMouseProj) {
        var mpProj = gaMapUtils.getMousePositionProjection(map);
        l = gaGlobalOptions.defaultPrintGraticuleLayer[mpProj.getCode()] ||
          gaGlobalOptions.defaultPrintGraticuleLayer;
      }
      return {
        'baseURL': l.url,
        'opacity': 1,
        'singleTile': true,
        'type': 'WMS',
        'layers': l.layers,
        'format': 'image/png',
        'styles': [''],
        'customParams': {
          'TRANSPARENT': true,
          'MAP_RESOLUTION': dpi
        }
      };
    }
  };

  function getEncodeOverlay(gaUrlUtils) {
    return function(overlay, resolution, options) {

      var encOverlayLayer;

      var elt = overlay.getElement();
      // We print only overlay added by the MarkerOverlayService
      // or by crosshair permalink
      if ($(elt).hasClass('popover')) {
        return;
      }
      var center = overlay.getPosition();
      if (center) {
        var style = 1, $elt = $(elt);
        if ($elt.text()) {
          style = 2;
          if ($elt.hasClass('ga-draw-measure-tmp')) {
            style = 3;
          }
        }
        encOverlayLayer = {
          'type': 'Vector',
          'styles': {
            '1': { // Style for marker position
              'externalGraphic': options.markerUrl,
              'graphicWidth': 20,
              'graphicHeight': 30,
              // the icon is not perfectly centered in the image
              // these values must be the same in map.less
              'graphicXOffset': -12,
              'graphicYOffset': -30
            },
            '2': { // Style for measure tooltip
              'externalGraphic': options.bubbleUrl,
              'graphicWidth': 97,
              'graphicHeight': 27,
              'graphicXOffset': -48,
              'graphicYOffset': -27,
              'label': $elt.text(),
              'labelXOffset': 0,
              'labelYOffset': 18,
              'fontColor': '#ffffff',
              'fontSize': 10,
              'fontWeight': 'normal'
            },
            '3': { // Style for intermediate measure tooltip
              'label': $elt.text(),
              'labelXOffset': 0,
              'labelYOffset': 10,
              'fontColor': '#ffffff',
              'fontSize': 8,
              'fontWeight': 'normal',
              'fillColor': '#ff0000',
              'strokeColor': '#ff0000'
            }
          },
          'styleProperty': '_gx_style',
          'geoJson': {
            'type': 'FeatureCollection',
            'features': [{
              'type': 'Feature',
              'properties': {
                '_gx_style': style
              },
              'geometry': {
                'type': 'Point',
                'coordinates': [center[0], center[1], 0]
              }
            }]
          },
          'name': 'drawing',
          'opacity': 1
        };
      }
      return encOverlayLayer;
    }
  };

  function getEncodeGroup(gaLayers, gaPrintStyle, gaTime,
      gaMapUtils, gaGlobalOptions) {
    return function(layer, viewProj, scaleDenom, printRectangeCoords,
        resolution, dpi) {
      var encs = [];
      var subLayers = layer.getLayers();
      subLayers.forEach(function(subLayer, idx, arr) {
        if (subLayer.visible) {
          // Is sublayer always not a Group?
          var enc = encodeBase(layer);
          var encodeLayer = getEncodeLayer(gaLayers, gaPrintStyle,
              gaTime, gaMapUtils, gaGlobalOptions);
          var layerEnc = encodeLayer(subLayer, viewProj, scaleDenom,
              printRectangeCoords, resolution, dpi);
          if (layerEnc && layerEnc.layer) {
            $.extend(enc, layerEnc);
            encs.push(enc.layer);
          }
        }
      });
      return encs;
    };
  };

  function getEncodeLayer(gaLayers, gaPrintStyle, gaTime, gaMapUtils,
      gaGlobalOptions) {
    // INGRID: Add 'map'
    return function(layer, viewProj, scaleDenom, printRectangeCoords,
        resolution, dpi, map) {

      var encLayer, encLegend;

      if (!(layer instanceof ol.layer.Group)) {
        var src = layer.getSource();
        var layerConfig = gaLayers.getLayer(layer.bodId) || {};

        var minResolution = layerConfig.minResolution || 0;
        var maxResolution = layerConfig.maxResolution || Infinity;

        if (resolution <= maxResolution &&
            resolution >= minResolution) {
          if (src instanceof ol.source.WMTS) {
            var encodeWMTS = getEncodeWMTS(gaTime, gaMapUtils, gaGlobalOptions);
            encLayer = encodeWMTS(layer, layerConfig);
          } else if (src instanceof ol.source.ImageWMS ||
              src instanceof ol.source.TileWMS) {
            encLayer = encodeWMS(layer, viewProj,
                layerConfig, dpi);
          } else if (src instanceof ol.source.OSM) {
            // INGRID: Add print OSM
            encLayer = encodeOSM(layer, layerConfig);
          } else if (src instanceof ol.source.Vector) {
            // INGRID: Add 'gaMapUtils', 'gaGlobalOptions'
            var encodeVector = getEncodeVector(gaPrintStyle, gaMapUtils,
                gaGlobalOptions);
            // INGRID: Add 'map'
            encLayer = encodeVector(layer,
                src.getFeatures(),
                scaleDenom,
                printRectangeCoords,
                dpi,
                map);
          }
        }
      } else {
        console.error('Trying to encode a group with the layer encoder!');
      }

      return {
        layer: encLayer,
        legend: encLegend
      };
    }
  };

  function encodeBase(oLayer) {
    var enc = {
      opacity: oLayer.getOpacity()
    };
    if (oLayer.bodId) {
      enc.layer = oLayer.bodId;
    }
    return enc;
  };

  // INGRID: Add 'gaMapUtils', 'gaGlobalOptions'
  function getEncodeVector(gaPrintStyle, gaMapUtils, gaGlobalOptions) {
    // INGRID: Add 'map'
    return function(layer, features, scale, printRectangle, dpi, map) {

      var enc = encodeBase(layer);
      var encStyles = {};
      var encFeatures = [];

      // Sort features by geometry type
      var newFeatures = [];
      var polygons = [];
      var lines = [];
      var points = [];

      // INGRID: Add 'gaMapUtils', 'gaGlobalOptions', 'map'
      var encodeFeatures = getEncodeFeatures(gaPrintStyle, gaMapUtils,
          gaGlobalOptions, map);

      angular.forEach(features, function(feature) {
        var geotype = feature.getGeometry().getType();
        if (/^(Polygon|MultiPolygon|Circle|GeometryCollection)$/.
            test(geotype)) {
          polygons.push(feature);
        } else if (/^(LineString|MultiLineString)$/.test(geotype)) {
          lines.push(feature);
        } else {
          points.push(feature);
        }
      });

      features = newFeatures.concat(polygons, lines, points);

      angular.forEach(features, function(feature) {
        // INGRID: Add 'map'
        var encoded = encodeFeatures(layer, feature, false,
            scale, printRectangle, dpi, map);

        encFeatures = encFeatures.concat(encoded.encFeatures);
        angular.extend(encStyles, encoded.encStyles);
      });

      angular.extend(enc, {
        type: 'Vector',
        styles: encStyles,
        styleProperty: '_gx_style',
        geoJson: {
          type: 'FeatureCollection',
          features: encFeatures
        },
        name: layer.bodId
      });

      return enc;
    };
  };

  // INGRID: Add 'gaMapUtils', 'gaGlobalOptions'
  function getEncodeFeatures(gaPrintStyle, gaMapUtils, gaGlobalOptions) {
    // INGRID: Add 'map'
    return function(layer, feature, styles, scale,
        printRectangleCoords, dpi, map) {

      dpi = parseInt(dpi) || 150;
      var resolution = scale / UNITS_RATIO / POINTS_PER_INCH;
      var encStyles = {};
      var encFeatures = [];
      var encStyle = {
        id: styleId++
      };

      // Get the styles of the feature
      if (!styles) {
        if (feature.getStyleFunction()) {
          styles = feature.getStyleFunction()(feature, resolution);
        } else if (layer.getStyleFunction()) {
          styles = layer.getStyleFunction()(feature, resolution);
        }
      }
      var geometry = feature.getGeometry();
      var styleToEncode;
      if (styles && styles.length > 0) {
        styleToEncode = styles[0];
      }

      // We encode the feature only if the feature has a style.
      if (!styleToEncode) {
        return {
          encFeatures: [],
          encStyles: []
        };
      }

      // Transform an ol.geom.Circle to a ol.geom.Polygon
      if (geometry instanceof ol.geom.Circle) {
        geometry = gaPrintStyle.olCircleToPolygon(geometry);
        feature = new ol.Feature(geometry);
      }

      // Handle ol.style.RegularShape by converting points to polygons
      var image = styleToEncode.getImage();
      if (geometry instanceof ol.geom.Point &&
          image instanceof ol.style.RegularShape &&
          !(image instanceof ol.style.Circle)) {
        // var scale = parseFloat($scope.scale.value);
        geometry = gaPrintStyle.olPointToPolygon(
            feature.getGeometry(),
            image.getRadius(),
            resolution,
            image.getPoints(),
            image.getRotation()
        );
        feature = new ol.Feature(geometry);
      }

      // Encode a feature if it intersects with the extent and
      // if the map is not rotated

      if (geometry.intersectsExtent(printRectangleCoords)) {
        // INGRID: Transform coordinates
        var transformFeature = feature;
        if (gaGlobalOptions.printDependOnMouseProj) {
          var mpProj = gaMapUtils.getMousePositionProjection(map);
          if (gaGlobalOptions.defaultEpsg !== mpProj.getCode()) {
            transformFeature = feature.clone();
            transformFeature.getGeometry().
                transform(gaGlobalOptions.defaultEpsg,
                    mpProj.getCode());
          }
        }

        // INGRID: Change 'feature' to 'transformFeature'
        var encFeature = format.writeFeatureObject(transformFeature);
        // We remove all attributes to reduce the size of the request
        // and to avoid bugs like #1213. The style attribute is always
        // '_gx_style', which is hardcoded.
        encFeature.properties = {};
        encFeature.properties._gx_style = encStyle.id;
        encFeatures.push(encFeature);

        // Encode the style of the feature added
        angular.extend(encStyle, gaPrintStyle.olStyleToPrintLiteral(
            styleToEncode, dpi));

        // Apply the layer's opacity on fill and stroke
        if (encStyle.fillOpacity) {
          encStyle.fillOpacity *= layer.getOpacity();
        }

        if (encStyle.strokeOpacity) {
          encStyle.strokeOpacity *= layer.getOpacity();
        }

        encStyles[encStyle.id] = encStyle;
      }

      // INGRID: Add 'gaMapUtils','gaGlobalOptions'
      var encodeFeatures = getEncodeFeatures(gaPrintStyle, gaMapUtils,
          gaGlobalOptions);

      // If a feature has a style with a geometryFunction defined, we
      // must also display this geometry with the good style (used for
      // azimuth).
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        if (angular.isFunction(style.getGeometry())) {
          var geom = style.getGeometry()(feature);
          if (geom) {
            var encoded = encodeFeatures(layer, new ol.Feature(geom),
                [style], scale, printRectangleCoords, dpi);
            encFeatures = encFeatures.concat(encoded.encFeatures);
            angular.extend(encStyles, encoded.encStyles);
          }
        }
      }

      return {
        encFeatures: encFeatures,
        encStyles: encStyles
      };
    }
  };

  function getEncodeWMTS(gaTime, gaMapUtils, gaGlobalOptions) {
    return function(layer, config) {
      // config is not defined for external WMTS
      // For internal WMTS layer, we use the simplified
      // mapfish print protocol, and the standard for
      // external WMTS layers.
      // See http://www.mapfish.org/doc/print/protocol.html#wmts
      // TODO: simplified protocol is only valid for LV03 layers!

      var enc = encodeBase(layer);
      var source = layer.getSource();
      var tileGrid = source.getTileGrid();
      var extent = layer.getExtent();
      var requestEncoding = source.getRequestEncoding() || 'REST';
      // Not all layers have projection assigned
      var dfltTileMatrixSet = gaGlobalOptions.defaultEpsg.split(':')[1];
      /* INGRID: Not in used
      var isExternalWmts = angular.equals(config, {});
      */

      // resourceURL for RESTful, service endpoint for KVP
      var url = source.getUrls()[0];
      var baseUrl = url.replace(/^\/\//, 'https://');

      if (requestEncoding === 'REST') {
        // INGRID: Add replace 'Style'
        baseUrl = baseUrl.
            replace(/\{Time\}/i, '{TIME}').
            replace(/\{Style\}/i, source.getStyle() || '{Style}').
            replace(/\{/g, '%7B').
            replace(/\}/g, '%7D');
      }

      var wmtsDimensions = encodeDimensions(source.getDimensions());
      var encodeMatrixIds = getMatrixIds(gaMapUtils);
      var matrices = encodeMatrixIds(tileGrid, extent);

      // use the full monty WMTS definition fo external source
      // the simplified definition was EPSG:21781 swisstopo only
      angular.extend(enc, {
        type: 'WMTS',
        layer: source.getLayer(),
        version: source.getVersion() || '1.0.0',
        requestEncoding: requestEncoding,
        formatSuffix: source.getFormat().replace('image/', ''),
        style: source.getStyle() || 'default',
        dimensions: Object.keys(wmtsDimensions),
        params: wmtsDimensions,
        matrixSet: source.getMatrixSet() || dfltTileMatrixSet
      });
      // INGRID: Remove check 'isExternalWmts'
      /*
      if (!isExternalWmts) {
        angular.extend(enc, {
          baseURL: baseUrl.slice(0, baseUrl.indexOf('/1.0.0')),
          zoomOffset: tileGrid.getMinZoom(),
          tileOrigin: tileGrid.getOrigin(),
          tileSize: [tileGrid.getTileSize(), tileGrid.getTileSize()],
          resolutions: tileGrid.getResolutions(),
          maxExtent: extent
        });
      } else {
       */
      // use the full monty WMTS definition fo external source
      angular.extend(enc, {
        layer: source.getLayer(),
        baseURL: baseUrl,
        serviceURL: config.serviceUrl,
        matrixIds: matrices
      });
      // }

      var multiPagesPrint = false;
      if (config.timestamps) {
        multiPagesPrint = !config.timestamps.some(function(ts) {
          return ts === '99991231';
        });
      }
      // printing time series
      if (config.timeEnabled && gaTime.get() === undefined &&
          multiPagesPrint) {
        enc['timestamps'] = config.timestamps;
      }

      return enc;
    }
  };

  function encodeWMS(layer, viewProj, config, dpi) {
    dpi = dpi || 150;
    var enc = encodeBase(layer);
    var source = layer.getSource();
    var params = source.getParams();
    var layers = params.LAYERS.split(',') || [];
    var styles = (params.STYLES !== undefined) ?
      params.STYLES.split(',') :
      new Array(layers.length).join(',').split(',');
    var url = (source.getUrls && source.getUrls()[0]) ||
        (source.getUrl && source.getUrl());
    var epsgCode = (source.getProjection() &&
        source.getProjection().getCode()) || viewProj.getCode();

    var customParams = {
    // INGRID: Remove param 'EXCEPTIONS'
    // 'EXCEPTIONS': 'XML',
      'TRANSPARENT': 'true'
    };
    if (params.TIME) {
      customParams['TIME'] = params.TIME;
    }
    // Do not try this parameter on not opensource WMS
    /*
    var mapservWMS = 'wms(.*).(dev|int|prod|geo|swisstopo).(admin|bgdi).ch';
    var regexMapservWMS = new RegExp(mapservWMS, 'gi');
    var match = regexMapservWMS.test(url);
    if (match) {
      customParams['MAP_RESOLUTION'] = dpi;
    }
    */

    params.VERSION = params.VERSION || '1.3.0';
    customParams['VERSION'] = params.VERSION;
    if (params.VERSION === '1.3.0') {
      customParams['CRS'] = epsgCode;
    } else {
      customParams['SRS'] = epsgCode;
    }

    angular.extend(enc, {
      type: 'WMS',
      baseURL: url.replace(/^\/\//, 'https://'),
      layers: layers,
      styles: styles,
      format: 'image/' + (config.format || 'png'),
      customParams: customParams,
      singleTile: config.singleTile || false
    });
    return enc;
  }

  function encodeOSM(layer, config) {
    var enc = encodeBase(layer);
    var source = layer.getSource();
    var tileGrid = source.getTileGrid();
    angular.extend(enc, {
      type: 'OSM',
      baseURL: 'http://tile.openstreetmap.org',
      maxExtent: source.getProjection().getExtent(),
      tileSize: [tileGrid.getTileSize(), tileGrid.getTileSize()],
      extension: 'png',
      resolutions: tileGrid.getResolutions(),
      singleTile: config.singleTile || false
    });
    return enc;
  }

  function encodeDimensions(dimensions) {
    var params = {};
    angular.forEach(dimensions, function(value, key) {
      params[key.toUpperCase()] = value;
    });
    return params;
  }

  function getMatrixIds(gaMapUtils) {
    return function(tilegrid, extent) {

      var matrixIds = [];
      var ids = tilegrid.getMatrixIds();
      var resolutions = tilegrid.getResolutions();
      var defaultExtent = gaMapUtils.defaultExtent;

      angular.forEach(resolutions, function(value, key) {
        var resolution = parseFloat(value);
        var z = tilegrid.getZForResolution(resolution);
        var tileSize = tilegrid.getTileSize(z);
        var topLeftCorner = tilegrid.getOrigin(z);
        var minX = topLeftCorner[0];
        var maxY = topLeftCorner[1];
        var maxX = extent[2] || defaultExtent[2];
        var minY = extent[1] || defaultExtent[1];
        var topLeftTile = tilegrid.
            getTileCoordForCoordAndZ([minX, maxY], z);
        var bottomRightTile = tilegrid.
            getTileCoordForCoordAndZ([maxX, minY], z);
        var tileWidth = 1 + bottomRightTile[1] - topLeftTile[1];
        var tileHeight = 1 + topLeftTile[2] - bottomRightTile[2];

        var matrix = {
          identifier: ids[key],
          resolution: resolution,
          topLeftCorner: tilegrid.getOrigin(z),
          tileSize: [tileSize, tileSize],
          matrixSize: [tileWidth, tileHeight]
        };
        this.push(matrix);

      }, matrixIds);

      return matrixIds;
    }
  };

  // INGRID: Add param 'gaWms', 'gaGlobalOptions'
  function getEncodeLegend(gaLang, gaWms, gaGlobalOptions) {
    return function(layer, config, options) {

      /* INGRID: Not in used
      var format = '.png';
      if (options.pdfLegendList.indexOf(layer.bodId) !== -1) {
        format = pdfLegendString;
      }
      */

      var enc = {
        // INGRID Check layer label
        name: config.label || layer.label,
        classes: []
      };
      if (config.legendUrl) {
        var legends = config.legendUrl.split('|');
        angular.forEach(legends, function(legend) {
          // INGRID: Update legendURL
          legend = legend.replaceAll('Ä','%C3%84');
          legend = legend.replaceAll('ä','%C3%A4');
          legend = legend.replaceAll('Ö','%C3%96');
          legend = legend.replaceAll('ö','%C3%B6');
          legend = legend.replaceAll('Ü','%C3%9C');
          legend = legend.replaceAll('ü','%C3%BC');
          legend = legend.replaceAll('ß','%C3%9F');
          enc.classes.push({
            name: '',
            icon: legend
          });
        });
      } else {
        if (layer) {
          if (layer.getSource()) {
            var paramLayerNames = layer.getSource().getParams().LAYERS;
            if (paramLayerNames) {
              var layerNames = paramLayerNames.split(',');
              angular.forEach(layerNames, function(layerName) {
                enc.classes.push({
                  name: '',
                  icon: gaGlobalOptions.imgproxyUrl +
                    encodeURIComponent(gaWms.getLegendURL(layer, layerName)) +
                    '&blankImage=true'
                });
              });
            }
          }
        }
      }
      return enc;
    }
  }
})();
