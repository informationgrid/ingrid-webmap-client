goog.provide('ga_layermetadatapopup_service');

goog.require('ga_map_service');
goog.require('ga_popup');
goog.require('ga_wms_service');

(function() {

  var module = angular.module('ga_layermetadatapopup_service', [
    'ga_map_service',
    'ga_popup',
    'ga_wms_service',
    'pascalprecht.translate'
  ]);

  module.provider('gaLayerMetadataPopup', function() {
    this.$get = function($translate, $rootScope, $sce, gaPopup, gaLayers,
        gaMapUtils, gaWms) {
      var popupContent = '<div ng-bind-html="options.result.html"></div>';

      var LayerMetadataPopup = function() {
        var popups = {};

        var create = function(layer) {
          var result = {html: ''},
              popup;

          // Called to update the content
          var updateContent = function() {
            var promise;
            /* INGRID: Disable intern legend service
            if (layer.bodId) {
              promise = gaLayers.getMetaDataOfLayer(layer.bodId);
            } else if (gaMapUtils.isExternalWmsLayer(layer)) {
              promise = gaWms.getLegend(layer);
            }
            */
            var id = layer.bodId;
            if(id == undefined){
              id = layer.id;
            }
            promise = gaLayers.getMetaDataOfLayerWithLegend(id, encodeURIComponent(gaWms.getLegendURL(layer)));
            return promise.then(function(resp) {
              // INGRID: Add replaces to localisation html.
              var data = resp.data;
              data = data
                .replace('metadata_legend',$translate.instant('metadata_legend'))
                .replace('metadata_information',$translate.instant('metadata_information'))
                .replace('metadata_service_title',$translate.instant('metadata_service_title'))
                .replace('metadata_service_id',$translate.instant('metadata_service_id'))
                .replace('metadata_service_abstract',$translate.instant('metadata_service_abstract'))
                .replace('metadata_service_fees',$translate.instant('metadata_service_fees'))
                .replace('metadata_service_accessconstraints',$translate.instant('metadata_service_accessconstraints'))
                .replace('metadata_service_contactperson',$translate.instant('metadata_service_contactperson'))
                .replace('metadata_service_organisation',$translate.instant('metadata_service_organisation'))
                .replace('metadata_service_addresse',$translate.instant('metadata_service_addresse'))
                .replace('metadata_service_city',$translate.instant('metadata_service_city'))
                .replace('metadata_service_country',$translate.instant('metadata_service_country'))
                .replace('metadata_service_phone',$translate.instant('metadata_service_phone'))
                .replace('metadata_service_fax',$translate.instant('metadata_service_fax'))
                .replace('metadata_service_mail',$translate.instant('metadata_service_mail'))
                .replace('metadata_service_resource',$translate.instant('metadata_service_resource'))
                .replace('metadata_service_url',$translate.instant('metadata_service_url'))
                .replace('metadata_service_url_link',$translate.instant('metadata_service_url_link'));
              result.html = $sce.trustAsHtml(data);
            }, function() {
              //FIXME: better error handling
              alert('Could not retrieve information for ' + layer.id);
            });
          };

          //We assume popup does not exist yet
          popup = gaPopup.create({
            title: $translate.instant('metadata_window_title'),
            destroyOnClose: false,
            content: popupContent,
            result: result,
            className: 'ga-tooltip-metadata',
            x: 400,
            y: 200,
            showPrint: true
          });
          popups[layer.id] = popup;

          // Open popup only on success
          updateContent().then(function() {
            popup.open();
          });

          $rootScope.$on('$translateChangeEnd', updateContent);
        };

        this.toggle = function(olLayerOrBodId) {
          var layer = olLayerOrBodId;
          if (angular.isString(layer)) {
            layer = gaLayers.getOlLayerById(layer);
          }
          var popup = popups[layer.id];
          if (popup) { // if the popup already exist we toggle it
            if (popup.scope.toggle) {
              popup.close();
            } else {
              popup.open();
            }
          } else {
            create(layer);
          }
        };
      };

      return new LayerMetadataPopup();
    };
  });
})();
