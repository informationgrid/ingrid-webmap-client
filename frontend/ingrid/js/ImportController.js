goog.provide('ga_import_controller');

goog.require('ga_browsersniffer_service');
goog.require('ga_file_service');
goog.require('ga_maputils_service');
goog.require('ga_previewlayers_service');
goog.require('ga_translation_service');
goog.require('ga_urlutils_service');
goog.require('ga_vector_service');
goog.require('ga_wmts_service');

(function() {

  var module = angular.module('ga_import_controller', [
    'ga_file_service',
    'ga_browsersniffer_service',
    'ga_maputils_service',
    'ga_urlutils_service',
    'ga_previewlayers_service',
    'ga_translation_service',
    'ga_vector_service'
  ]);

  // INGRID: Add 'gaGlobalOptions' and '$http'
  module.controller('GaImportController', function($scope, $q, $document, $http,
      $window, $timeout, gaFile, gaBrowserSniffer, gaWms, gaUrlUtils,
      gaLang, gaPreviewLayers, gaMapUtils, gaWmts, gaVector, gaGlobalOptions) {

    $scope.supportDnd = !gaBrowserSniffer.msie || gaBrowserSniffer.msie > 9;
    $scope.options = {
      // INGRID: Get list from settings
      urls: gaGlobalOptions.settingDefaultImportList
    };

    $scope.options.isValidUrl = gaUrlUtils.isValid;
    $scope.options.getOlLayerFromGetCapLayer = function(layer) {
      if (layer.wmsUrl) {
        return gaWms.getOlLayerFromGetCapLayer(layer);
      } else if (layer.capabilitiesUrl) {
        return gaWmts.getOlLayerFromGetCap($scope.map, $scope.wmtsGetCap,
            layer.Identifier, {
              capabilitiesUrl: layer.capabilitiesUrl
            });
      }
    };
    $scope.options.addPreviewLayer = function(map, getCapLayer) {
      gaPreviewLayers.addGetCapLayer(map, $scope.wmtsGetCap ||
          $scope.wmsGetCap, getCapLayer);
    };
    $scope.options.removePreviewLayer = gaPreviewLayers.removeAll;
    $scope.options.transformExtent = gaMapUtils.intersectWithDefaultExtent;

    // Transform the url before loading it.
    $scope.options.transformUrl = function(url) {
      // If the url has no file extension, try to load a WMS GetCapabilities.
      if (!/\.(kml|kmz|xml|txt)/i.test(url) &&
          !/\w+\/\w+\.[a-zA-Z]+$/i.test(url)) {
        // Append WMS GetCapabilities default parameters
        /* INGRID: Remove
        url = gaUrlUtils.append(url, /wmts/i.test(url) ?
          'SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0' :
          'SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0');
        */
        if(!/service=/i.test(url)) {
          url = gaUrlUtils.append(url, /wmts/i.test(url) ?
            'SERVICE=WMTS' :
            'SERVICE=WMS');
        }
        if(!/request=/i.test(url)) {
          url = gaUrlUtils.append(url, 'REQUEST=GetCapabilities');
        }
        if(!/version=/i.test(url)) {
          url = gaUrlUtils.append(url, /wmts/i.test(url) ?
            'VERSION=1.0.0' :
            'VERSION=1.3.0');
        }

        // Use lang param only for admin.ch servers
        if (/admin\.ch/.test(url)) {
          url = gaUrlUtils.append(url, 'lang=' + gaLang.get());
        }
      }
      // Save the good url for the import component.
      $scope.getCapUrl = url;
      return gaUrlUtils.proxifyUrl(url);
    };

    // Manage data depending on the content
    // @param data<String> Content of the file.
    // @param file<Object> Informations of the file (if available).
    $scope.options.handleFileContent = function(data, file) {
      var defer = $q.defer();
      $scope.wmsGetCap = null;
      $scope.wmtsGetCap = null;
      file = file || {};

      // INGRID: Add check wms objects
      if (gaFile.isWmsGetCap(data) || data.WMT_MS_Capabilities ||
        data.WMS_Capabilities) {
        if (gaFile.isWmsGetCap(data)) {
          var url = gaGlobalOptions.proxyUrl;
          $http.post(url, data, {
            // INGRID: Add user param
            params: {
              toJson: true
            }
          }).then(function(response) {
            $scope.wmsGetCap = response.data;
          });
        } else {
          $scope.wmsGetCap = data;
        }
        defer.resolve({
          message: 'upload_succeeded'
        });

      // INGRID: Change check GPX oder KML
      } else if (gaFile.isGpx(data) || gaFile.isKml(data) || 
        gaFile.isGpx(data.xmlResponse) || gaFile.isKml(data.xmlResponse)) {

        // INGRID: Change data
        gaVector.addToMap($scope.map, data.xmlResponse || data, {
          url: file.url || URL.createObjectURL(file),
          useImageVector: gaVector.useImageVector(file.size),
          zoomToExtent: true

        }).then(function() {
          defer.resolve({
            message: 'parse_succeeded'
          });

        }, function(reason) {
          $window.console.error('Vector data parsing failed: ', reason);
          defer.reject({
            message: 'parse_failed',
            reason: reason
          });

        }, function(evt) {
          defer.notify(evt);
        });

      // INGRID: Add check wmts objects
      } else if (gaFile.isWmtsGetCap(data) ||
        (data.Capabilities && data.xmlResponse)) {
        if (gaFile.isWmtsGetCap(data)) {
          $scope.wmtsGetCap = data;
        } else {
          $scope.wmtsGetCap = data.xmlResponse;
        }
        defer.resolve({
          message: 'upload_succeeded'
        });
      } else {
        $window.console.error('Unparseable content: ', data);
        defer.reject({
          message: 'parse_failed',
          reason: 'format_not_supported'
        });
      }

      return defer.promise;
    };
  });
})();