goog.provide('ga_maputils_service');

goog.require('ga_definepropertiesforlayer_service');
goog.require('ga_height_service');
goog.require('ga_urlutils_service');

(function() {

  var module = angular.module('ga_maputils_service', [
    'ga_definepropertiesforlayer_service',
    'ga_urlutils_service',
    'ga_height_service'
  ]);

  /**
   * Service provides map util functions.
   */
  module.provider('gaMapUtils', function() {
    // INGRID: Add 'gaPermalink'
    this.$get = function($window, gaGlobalOptions, gaUrlUtils, $q,
        gaDefinePropertiesForLayer, $rootScope, gaHeight, gaPermalink) {
      var resolutions = gaGlobalOptions.resolutions;
      var lodsForRes = gaGlobalOptions.lods;
      var isExtentEmpty = function(extent) {
        for (var i = 0, ii = extent.length; i < ii; i++) {
          if (!extent[i]) {
            return true;
          }
        }
        return extent[0] >= extent[2] || extent[1] >= extent[3];
      };
      // Level of detail for the default resolution
      var proj = ol.proj.get(gaGlobalOptions.defaultEpsg);
      var extent = gaGlobalOptions.defaultExtent || proj.getExtent();
      return {
        Z_PREVIEW_LAYER: 1000,
        Z_PREVIEW_FEATURE: 1100,
        Z_FEATURE_OVERLAY: 2000,
        preload: 6, // Number of upper zoom to preload when offline
        defaultExtent: extent,
        viewResolutions: resolutions,
        defaultResolution: gaGlobalOptions.defaultResolution,
        getViewResolutionForZoom: function(zoom) {
          return resolutions[zoom];
        },
        // Example of a dataURI: 'data:image/png;base64,sdsdfdfsdfdf...'
        dataURIToBlob: function(dataURI) {
          var BASE64_MARKER = ';base64,';
          var base64Index = dataURI.indexOf(BASE64_MARKER);
          var base64 = dataURI.substring(base64Index + BASE64_MARKER.length);
          var contentType = dataURI.substring(5, base64Index);
          var raw = $window.atob(base64);
          var rawLength = raw.length;
          var uInt8Array = new Uint8Array(rawLength);
          for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          return this.arrayBufferToBlob(uInt8Array.buffer, contentType);
        },

        // Advantage of the blob is we have easy access to the size and the
        // type of the image, moreover in the future we could store it
        // directly in indexedDB, no need of fileReader anymore.
        // We could request a 'blob' instead of 'arraybuffer' response type
        // but android browser needs arraybuffer.
        arrayBufferToBlob: function(buffer, contentType) {
          if ($window.WebKitBlobBuilder) {
            // BlobBuilder is deprecated, only used in Android Browser
            var builder = new WebKitBlobBuilder();
            builder.append(buffer);
            return builder.getBlob(contentType);
          } else {
            return new Blob([buffer], {type: contentType});
          }
        },

        // Convert an ol.extent to Cesium.Rectangle
        extentToRectangle: function(e, sourceProj) {
          sourceProj = sourceProj || ol.proj.get(gaGlobalOptions.defaultEpsg);
          e = ol.proj.transformExtent(e, sourceProj, 'EPSG:4326');
          return Cesium.Rectangle.fromDegrees(e[0], e[1], e[2], e[3]);
        },

        /**
         * Defines a unique identifier from a tileUrl.
         * Use by offline to store in local storage.
         */
        getTileKey: function(tileUrl) {
          return tileUrl.replace(/^\/\/(wmts|tod)[0-9]{0,3}/, '').
              replace('prod.bgdi', 'geo.admin');
        },

        /**
         * Search for a layer identified by bodId in the map and
         * return it. undefined is returned if the map does not have
         * such a layer.
         */
        getMapLayerForBodId: function(map, bodId) {
          var layer;
          map.getLayers().forEach(function(l) {
            if (l.bodId === bodId && !l.preview) {
              layer = l;
            }
          });
          return layer;
        },

        /**
         * Search for an overlay identified by bodId in the map and
         * return it. undefined is returned if the map does not have
         * such a layer.
         */
        getMapOverlayForBodId: function(map, bodId) {
          var layer;
          map.getLayers().forEach(function(l) {
            if (l.bodId === bodId && !l.background && !l.preview) {
              layer = l;
            }
          });
          return layer;
        },

        flyToAnimation: function(ol3d, center, extent) {
          var dest;
          var scene = ol3d.getCesiumScene();
          var proj = ol3d.getOlMap().getView().getProjection();

          if (extent) {
            var rect = this.extentToRectangle(extent);
            dest = scene.camera.getRectangleCameraCoordinates(rect);
            center = ol.extent.getCenter(extent);
          }

          return gaHeight.get(ol3d.getOlMap(), center).then(function(height) {
            var defer = $q.defer();
            var pitch = 50; // In degrees
            // Default camera field of view
            // https://cesiumjs.org/Cesium/Build/Documentation/Camera.html
            var cameraFieldOfView = 60;
            center[2] = height;

            if (!dest) {
              pitch = 45; // In degrees
              var deg = ol.proj.transform(center, proj, 'EPSG:4326');
              dest = Cesium.Cartesian3.fromDegrees(deg[0], deg[1], height);
            }

            var carto = scene.globe.ellipsoid.cartesianToCartographic(dest);
            var magnitude = Math.tan(Cesium.Math.toRadians(pitch +
                cameraFieldOfView / 2)) * carto.height;

            // Approx. direction on x and y (only valid for Swiss extent)
            dest.x += (7 / 8) * magnitude;
            dest.y += (1 / 8) * magnitude;

            scene.camera.flyTo({
              destination: dest,
              orientation: {
                pitch: Cesium.Math.toRadians(-pitch)
              },
              complete: function() {
                defer.resolve(center);
                $rootScope.$applyAsync();
              },
              cancel: function() {
                defer.resolve();
                $rootScope.$applyAsync();
              }
            });
            return defer.promise;
          });
        },

        moveTo: function(map, ol3d, zoom, center) {
          if (ol3d && ol3d.getEnabled()) {
            return this.flyToAnimation(ol3d, center, null);
          }
          var view = map.getView();
          view.setZoom(zoom);
          view.setCenter(center);
          return $q.when();
        },

        // INGRID: Add function zoomToExtentScale
        zoomToExtentScale: function(map, ol3d, extent, scale) {
          if (ol3d && ol3d.getEnabled()) {
            return this.flyToAnimation(ol3d, null, extent);
          }
          var view = map.getView();
          if (scale && extent) {
            // We test if the layer extent specified in the
            // getCapabilities fit the minScale value.
            var layerExtentScale = view.getResolutionForExtent(extent,
                map.getSize()) * 39.37 * 72;
            if (layerExtentScale > scale) {
              var layerExtentCenter = ol.extent.getCenter(extent);
              var factor = layerExtentScale / scale;
              var width = ol.extent.getWidth(extent) / factor;
              var height = ol.extent.getHeight(extent) / factor;
              extent = [
                layerExtentCenter[0] - width / 2,
                layerExtentCenter[1] - height / 2,
                layerExtentCenter[0] + width / 2,
                layerExtentCenter[1] + height / 2
              ];

              if (extent) {
                var res = view.constrainResolution(
                    view.getResolutionForExtent(extent, map.getSize()), 0, -1);
                view.setCenter(layerExtentCenter);
                view.setResolution(res);
              }
              return;
            }
          }
          map.getView().fit(extent, {
            size: map.getSize()
          });
          return $q.when();
        },

        zoomToExtent: function(map, ol3d, extent) {
          if (ol3d && ol3d.getEnabled()) {
            return this.flyToAnimation(ol3d, null, extent);
          }
          map.getView().fit(extent, {
            size: map.getSize()
          });
          return $q.when();
        },

        // This function differs from moveTo because it adds panning effect in
        // 2d
        panTo: function(map, ol3d, dest) {
          if (ol3d && ol3d.getEnabled()) {
            return this.moveTo(null, ol3d, null, dest);
          }
          var defer = $q.defer();
          var view = map.getView();
          view.animate({
            center: dest,
            duration: 0
          }, function(success) {
            defer.resolve();
            $rootScope.$apply();
          });
          return defer.promise;
        },

        // This function differs from zoomToExtent because it adds flying effect
        // in 2d
        flyTo: function(map, ol3d, dest, extent) {
          if (ol3d && ol3d.getEnabled()) {
            return this.zoomToExtent(null, ol3d, extent);
          }
          var deferPan = $q.defer();
          var deferZoom = $q.defer();
          var size = map.getSize();
          var source = map.getView().getCenter();
          var sourceRes = map.getView().getResolution();
          var dist = Math.sqrt(Math.pow(source[0] - dest[0], 2),
              Math.pow(source[1] - dest[1], 2));
          var duration = Math.min(Math.sqrt(300 + dist / sourceRes * 1000),
              3000);
          var destRes = Math.max(
              (extent[2] - extent[0]) / size[0],
              (extent[3] - extent[1]) / size[1]);
          destRes = Math.max(map.getView().constrainResolution(destRes, 0, 0),
              2.5);
          var view = map.getView();
          view.animate({
            center: dest,
            duration: duration
          }, function() {
            deferPan.resolve();
            $rootScope.$applyAsync();
          });
          view.animate({
            // destRes * 1.2 needed to don't have up an down and up again
            // in zoom.
            resolution: Math.max(sourceRes, dist / 1000, destRes * 1.2),
            duration: duration / 2
          }, {
            resolution: destRes,
            duration: duration / 2
          }, function(success) {
            deferZoom.resolve();
            $rootScope.$applyAsync();
          });
          return $q.all([deferPan.promise, deferZoom.promise]);
        },

        // Test if a layer is a KML layer added by the ImportKML tool or
        // permalink
        // @param olLayerOrId  An ol layer or an id of a layer
        isKmlLayer: function(olLayerOrId) {
          if (!olLayerOrId) {
            return false;
          }
          if (olLayerOrId instanceof ol.layer.Layer) {
            olLayerOrId = olLayerOrId.id;
          }
          if (angular.isString(olLayerOrId)) {
            return /^KML\|\|/.test(olLayerOrId);
          }
          return false;
        },

        // Test if a layer is a KML layer added by dnd
        // @param olLayer  An ol layer
        isLocalKmlLayer: function(olLayer) {
          return this.isKmlLayer(olLayer) && !/^https?:\/\//.test(olLayer.url);
        },

        // Test if a layer is a GPX layer added by the Import tool or
        // permalink
        // @param olLayerOrId  An ol layer or an id of a layer
        isGpxLayer: function(olLayerOrId) {
          if (!olLayerOrId) {
            return false;
          }
          if (olLayerOrId instanceof ol.layer.Layer) {
            olLayerOrId = olLayerOrId.id;
          }
          if (angular.isString(olLayerOrId)) {
            return /^GPX\|\|/.test(olLayerOrId);
          }
          return false;
        },

        // Test if a layer is a GPX layer added by dnd
        // @param olLayer  An ol layer
        isLocalGpxLayer: function(olLayer) {
          return this.isGpxLayer(olLayer) && !/^https?:\/\//.test(olLayer.url);
        },

        // Test if a KML comes from our s3 storage
        // @param olLayer  An ol layer or an id of a layer
        isStoredKmlLayer: function(olLayerOrId) {
          if (!olLayerOrId) {
            return false;
          }
          // If the parameter is not a string we try to get the url property.
          var url = (!angular.isString(olLayerOrId)) ? olLayerOrId.url :
            olLayerOrId.replace('KML||', '');
          return this.isKmlLayer(olLayerOrId) &&
                  gaUrlUtils.isPublicValid(url);
        },

        // Test if a layer is an external WMS layer added by th ImportWMS tool
        // or permalink
        // @param olLayerOrId  An ol layer or an id of a layer
        isExternalWmsLayer: function(olLayerOrId) {
          if (angular.isString(olLayerOrId)) {
            return /^WMS\|\|/.test(olLayerOrId) &&
                olLayerOrId.split('||').length >= 4;
          }
          return !!(olLayerOrId && !olLayerOrId.bodId &&
              this.isWMSLayer(olLayerOrId));
        },

        // Test if a layer is an external WMTS layer added by the ImportWMTS
        // tool or permalink
        isExternalWmtsLayer: function(olLayerOrId) {
          if (!olLayerOrId) {
            return false;
          }
          if (olLayerOrId instanceof ol.layer.Layer) {
            olLayerOrId = olLayerOrId.id;
          }
          if (angular.isString(olLayerOrId)) {
            // INGRID: Change to >= 3
            return /^WMTS\|\|/.test(olLayerOrId) &&
                olLayerOrId.split('||').length >= 3;
          }
          return false;
        },

        // INGRID: External service
        isExternalService: function(olService) {
          if (!olService) {
            return false;
          }
          if (angular.isString(olService)) {
            return /^(WMS|WMTS)\|\|/.test(olService) &&
              (olService.split('||').length === 2 ||
              olService.split('||').length === 3);
          }
          return false;
        },

        // INGRID: External WFS
        isExternalWfsLayer: function(olLayerOrId) {
          if (!olLayerOrId) {
            return false;
          }
          if (olLayerOrId instanceof ol.layer.Layer) {
            olLayerOrId = olLayerOrId.id;
          }
          if (angular.isString(olLayerOrId)) {
            return /^WFS\|\|/.test(olLayerOrId);
          }
          return false;
        },

        isEbaLocatorLayer: function(olLayerOrId) {
          if (!olLayerOrId) {
            return false;
          }
          if (angular.isString(olLayerOrId)) {
            return /^ebaLocator\|\|/.test(olLayerOrId);
          }
          return false;
        },
        // INGRID: Add hasXYZParams
        hasXYZParams: function() {
          var paramsE = gaPermalink.getParams().E;
          var paramsN = gaPermalink.getParams().N;
          var paramsZoom = gaPermalink.getParams().zoom;
          if (paramsE && paramsN && paramsZoom) {
            return true;
          }
          return false;
        },

        // INGRID: Add isInitPos
        isInitPos: function(map) {
          var view = map.getView();
          var center = view.getCenter();
          var zoom = view.getZoom();
          var e = center[0].toFixed(2);
          var n = center[1].toFixed(2);
          var initPosE = view.get('initPosE');
          var initPosN = view.get('initPosN');
          var initPosZ = view.get('initPosZ');
          if ((!this.hasXYZParams()) ||
              (initPosE === e &&
              initPosN === n &&
              initPosZ === zoom)) {
            return true;
          }
          return false;
        },

        // INGRID: Add get resolution from scale
        inRange: function(layer, map) {
          var minResolution;
          var maxResolution;
          var minScale;
          var maxScale;
          var resolution = map.getView().getResolution();
          if (layer instanceof ol.layer.Image) {
            minResolution = layer.get('minResolution');
            maxResolution = layer.get('maxResolution');
            minScale = layer.get('minScale');
            maxScale = layer.get('maxScale');
          } else {
            minResolution = layer['minResolution'] || 0;
            maxResolution = layer['maxResolution'] || Infinity;
            minScale = layer['minScale'];
            maxScale = layer['maxScale'];
          }

          if (layer.type === 'wms' && layer.version === '1.1.1') {
            minScale = this.getScaleForScaleHint(minScale, map);
          }

          if (layer.type === 'wms' && layer.version === '1.1.1') {
            maxScale = this.getScaleForScaleHint(maxScale, map);
          }

          if (minScale) {
            minResolution = this.getResolutionForScale(minScale, map);
          }

          if (maxScale) {
            maxResolution = this.getResolutionForScale(maxScale, map);
          }
          return ((resolution >= minResolution) &&
            (resolution <= maxResolution));
        },

        // INGRID: Add get resolution from scale
        getResolutionForScale: function(scale, map) {
          var dpi = 25.4 / 0.28;
          var mpu = map.getView().getProjection().getMetersPerUnit();
          var res = scale / (mpu * 39.37 * dpi);
          return res;
        },

        // INGRID: WMS version 1.1.1 scale to resolution
        getScaleForScaleHint: function(scale, map) {
          var rad2 = Math.pow(2, 0.5);
          var ipm = 39.37;
          if (scale !== 0 && scale !== Infinity) {
            return parseFloat(
                ((scale / rad2) * ipm *
              72).toPrecision(13)
            );
          }
          return scale;
        },

        // Test if a feature is a measure
        isMeasureFeature: function(olFeature) {
          var regex = /^measure/;
          return (olFeature && (regex.test(olFeature.get('type')) ||
            regex.test(olFeature.getId())));
        },

        moveLayerOnTop: function(map, olLayer) {
          var olLayers = map.getLayers().getArray();
          var idx = olLayers.indexOf(olLayer);
          if (idx !== -1 && idx !== olLayers.length - 1) {
            map.removeLayer(olLayer);
            map.addLayer(olLayer);
          }
        },

        /**
         * Reset map rotation to North
         */
        resetMapToNorth: function(map, ol3d) {
          var defer = $q.defer();
          if (ol3d && ol3d.getEnabled()) {
            var scene = ol3d.getCesiumScene();
            var currentRotation = -scene.camera.heading;

            while (currentRotation < -Math.PI) {
              currentRotation += 2 * Math.PI;
            }

            while (currentRotation > Math.PI) {
              currentRotation -= 2 * Math.PI;
            }
            var bottom = olcs.core.pickBottomPoint(scene);
            if (bottom) {
              olcs.core.setHeadingUsingBottomCenter(scene, currentRotation,
                  bottom);
            }
            defer.resolve();
          } else {
            map.getView().animate({
              rotation: 0,
              easing: ol.easing.easeOut
            }, function() {
              defer.resolve();
              $rootScope.$applyAsync();
            });
          }
          return defer.promise;
        },

        intersectWithDefaultExtent: function(extent) {
          if (!extent || extent.length !== 4) {
            return gaGlobalOptions.defaultExtent;
          }
          /* INGRID: Remove check extent
          extent = [
            Math.max(extent[0], gaGlobalOptions.defaultExtent[0]),
            Math.max(extent[1], gaGlobalOptions.defaultExtent[1]),
            Math.min(extent[2], gaGlobalOptions.defaultExtent[2]),
            Math.min(extent[3], gaGlobalOptions.defaultExtent[3])
          ];
          */
          if (!isExtentEmpty(extent)) {
            return extent;
          } else {
            return undefined;
          }
        },

        getFeatureOverlay: function(features, style) {
          var layer = new ol.layer.Vector({
            source: new ol.source.Vector({
              useSpatialIndex: false,
              features: features
            }),
            style: style,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: this.Z_FEATURE_OVERLAY
          });
          gaDefinePropertiesForLayer(layer);
          layer.displayInLayerManager = false;
          return layer;
        },

        // INGRID: BwaStr feature
        getBwaStrFeatureOverlay: function(feature, style,
            map, label, visible) {
          var layer = new ol.layer.Vector({
            source: new ol.source.Vector({
              useSpatialIndex: false,
              features: [feature]
            }),
            style: style,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: this.Z_FEATURE_OVERLAY
          });
          gaDefinePropertiesForLayer(layer);
          layer.displayInLayerManager = true;
          layer.label = label;
          layer.visible = visible;
          layer.disableCtrlLayerExtent = true;
          layer.disableCtrlLayerUp = true;
          layer.disableCtrlLayerDown = true;

          // INGRID: Update param 'bwaStrVisible'
          layer.on('change:visible', function(evt) {
            gaPermalink.updateParams({
              bwaStrVisible: '' + layer.visible
            });
          });

          // INGRID: Remove param 'bwaStr'
          map.getLayers().on('remove', function(evt) {
            if (evt.element === layer) {
              gaPermalink.deleteParam('bwaStrId');
              gaPermalink.deleteParam('bwaStrKm');
              gaPermalink.deleteParam('bwaStrOffset');
              gaPermalink.deleteParam('bwaStrVisible');
            }
          });
          return layer;
        },

        getLodFromRes: function(res) {
          if (!res) {
            return;
          }
          var idx = resolutions.indexOf(res);
          if (idx !== -1) {
            return lodsForRes[idx];
          }
          // TODO: Implement the calculation of the closest level of detail
          // available if res is not in the resolutions array
        },

        // The ol.source.Vector.getExtent function doesn't exist when the
        // useSpatialIndex property is set to false
        getVectorSourceExtent: function(source) {
          try {
            return source.getExtent();
          } catch (e) {
            var sourceExtent;
            source.getFeatures().forEach(function(item) {
              var extent = item.getGeometry().getExtent();
              if (!sourceExtent) {
                sourceExtent = extent;
              } else {
                ol.extent.extend(sourceExtent, extent);
              }
            });
            return sourceExtent;
          }
        },

        /**
         * Tests if a layer is a vector layer or a vector tile layer.
         * @param {ol.layer.Base} an ol layer.
         *
         * Returns true if the layer is a Vector
         * Returns false if the layer is not a Vector
         */
        isVectorLayer: function(olLayer) {
          return !!(olLayer && !(olLayer instanceof ol.layer.Group) &&
              olLayer.getSource() && olLayer instanceof ol.layer.Vector);
        },

        /**
         * Tests if a layer is a WMS layer.
         * @param {ol.layer.Base} an ol layer.
         *
         * Returns true if the layer is a WMS
         * Returns false if the layer is not a WMS
         */
        isWMSLayer: function(olLayer) {
          return !!(olLayer && !(olLayer instanceof ol.layer.Group) &&
              olLayer.getSource &&
              (olLayer.getSource() instanceof ol.source.ImageWMS ||
              olLayer.getSource() instanceof ol.source.TileWMS));
        },

        // INGRID: Add 'isWMTSLayer'
        /**
         * Tests if a layer is a WMTS layer.
         * @param {ol.layer.Base} an ol layer.
         *
         * Returns true if the layer is a WMTS
         * Returns false if the layer is not a WMTS
         */
        isWMTSLayer: function(olLayer) {
          return !!(olLayer && !(olLayer instanceof ol.layer.Group) &&
              olLayer.getSource &&
              (olLayer.getSource() instanceof ol.source.WMTS));
        },

        // INGRID: Set load getCapabilities error
        setUrlLoadError: function(errorCode, translate) {
          switch (errorCode) {
            case 401:
              return translate.instant('service_load_error_401');
            case 404:
              return translate.instant('service_load_error_404');
            default:
              return translate.instant('service_load_error_default');
          }
        },

        // INGRID: Get MousePosition projection
        getMousePositionProjection: function(map) {
          if (map) {
            var mapControls = map.getControls().getArray();
            for (var i = 0; i < mapControls.length; ++i) {
              var mapControl = mapControls[i];
              if (mapControl instanceof ol.control.MousePosition) {
                return mapControl.getProjection();
              }
            }
          }
          return ol.proj.get(gaGlobalOptions.defaultEpsg);
        },

        getWMTSFeatureInfoUrl: function(source, coordinate, resolution,
            projection, params) {
          var tpl = source.get('featureInfoTpl');
          if (tpl) {
            var pixelRatio = source.get('tilePixelRatio') || 1;
            if (isNaN(pixelRatio)) {
              return undefined;
            }
            var tileGrid = source.getTileGrid();
            var tileCoord = tileGrid.getTileCoordForCoordAndResolution(
                coordinate, resolution);
            var tileExtent = tileGrid.getTileCoordExtent(tileCoord)
            if (tileGrid.getResolutions().length <= tileCoord.z) {
              return undefined;
            }
            // var tileResolution = tileGrid.getResolution(tileCoord.z);
            // var tileExtent = tileGrid.getTileCoordExtent(
            //    tileCoord, this.tmpExtent_);
            var x = Math.floor((coordinate[0] - tileExtent[0]) /
              (resolution / pixelRatio));
            var y = Math.floor((tileExtent[3] - coordinate[1]) /
              (resolution / pixelRatio));
            var tileRow = -tileCoord[2] - 1;
            var tileCol = tileCoord[1];
            var tileMatrix = tileCoord[0];

            if (source.getRequestEncoding() === 'KVP') {
              var baseParams = {
                'SERVICE': 'WMTS',
                'REQUEST': 'GetFeatureInfo',
                'VERSION': '1.0.0',
                'LAYER': source.getLayer(),
                'STYLE': source.getStyle(),
                'TILEMATRIXSET': source.getMatrixSet(),
                'TILEROW': tileRow,
                'TILECOL': tileCol,
                'TILEMATRIX': tileMatrix,
                'FORMAT': 'image/png',
                'INFOFORMAT': params.INFO_FORMAT,
                'I': x,
                'J': y
              };
              angular.extend(baseParams, params);
              var keyParams = [];
              Object.keys(baseParams).forEach(function(k) {
                if (baseParams[k] !== null && baseParams[k] !== undefined) {
                  keyParams.push(k + '=' + encodeURIComponent(baseParams[k]));
                }
              });
              var qs = keyParams.join('&');
              tpl = tpl.replace(/[?&]$/, '');
              tpl = tpl.indexOf('?') === -1 ? tpl + '?' : tpl + '&';
              return tpl + qs;
            } else if (source.getRequestEncoding() === 'REST') {
              return tpl.
                  replace('{Layer}', source.getLayer()).
                  replace('{TileMatrixSet}', source.getMatrixSet()).
                  replace('{TileRow}', tileRow).
                  replace('{TileCol}', tileCol).
                  replace('{TileMatrix}', tileMatrix).
                  replace('{I}', x).
                  replace('{J}', y);
            }
          }
          return undefined;
        }
      };
    };
  });
})();
