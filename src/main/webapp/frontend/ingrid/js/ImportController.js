goog.provide('ga_import_controller');

goog.require('ga_browsersniffer_service');
goog.require('ga_kml_service');
goog.require('ga_map_service');
goog.require('ga_previewlayers_service');
goog.require('ga_translation_service');
goog.require('ga_urlutils_service');
goog.require('ga_wmts_service');
goog.require('ngeo.fileService');

(function() {

  var module = angular.module('ga_import_controller', [
    'ga_kml_service',
    'ngeo.fileService',
    'ga_browsersniffer_service',
    'ga_map_service',
    'ga_urlutils_service',
    'ga_previewlayers_service',
    'ga_translation_service'
  ]);

  // INGRID: Add 'gaGlobalOptions'
  module.controller('GaImportController', function($scope, $q, $document,
      $window, $timeout, ngeoFile, gaKml, gaBrowserSniffer, gaWms, gaUrlUtils,
      gaLang, gaPreviewLayers, gaMapUtils, gaWmts, gaGlobalOptions) {

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
        return gaWmts.getOlLayerFromGetCapLayer(layer);
      }
    };
    $scope.options.addPreviewLayer = function(map, layer) {
      gaPreviewLayers.addGetCapLayer(map, layer);
    };
    $scope.options.removePreviewLayer = gaPreviewLayers.removeAll;
    $scope.options.transformExtent = gaMapUtils.intersectWithDefaultExtent;



    // Transform the url before loading it.
    $scope.options.transformUrl = function(url) {
      // If the url has no file extension, try to load a WMS GetCapabilities.
      if (!/\.(kml|kmz|xml|txt)/i.test(url) &&
          !/\w+\/\w+\.[a-zA-Z]+$/i.test(url)) {
        // Append WMS GetCapabilities default parameters
        url = gaUrlUtils.append(url, /wmts/i.test(url) ?
            'SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0' :
            'SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0');

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
      if (ngeoFile.isWmsGetCap(data) || data.WMT_MS_Capabilities || data.WMS_Capabilities) {
        $scope.wmsGetCap = data;
        defer.resolve({
          message: 'upload_succeeded'
        });

      } else if (ngeoFile.isKml(data)) {

        gaKml.addKmlToMap($scope.map, data, {
          url: file.url || URL.createObjectURL(file),
          useImageVector: gaKml.useImageVector(file.size),
          zoomToExtent: true

        }).then(function() {
          defer.resolve({
            message: 'parse_succeeded'
          });

        }, function(reason) {
          $window.console.error('KML parsing failed: ', reason);
          defer.reject({
            message: 'parse_failed',
            reason: reason
          });

        }, function(evt) {
          defer.notify(evt);
        });

      } else if (ngeoFile.isWmtsGetCap(data)) {
        $scope.wmtsGetCap = data;
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
