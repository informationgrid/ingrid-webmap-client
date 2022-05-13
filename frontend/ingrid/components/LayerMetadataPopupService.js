goog.provide('ga_layermetadatapopup_service');

goog.require('ga_layers_service');
goog.require('ga_maputils_service');
goog.require('ga_popup');
goog.require('ga_wms_service');

(function() {

  var module = angular.module('ga_layermetadatapopup_service', [
    'ga_maputils_service',
    'ga_layers_service',
    'ga_popup',
    'ga_wms_service',
    // INGRID: Add html compile module
    'angular-bind-html-compile',
    'pascalprecht.translate'
  ]);

  module.provider('gaLayerMetadataPopup', function() {
    // INGRID: Add 'gaGlobalOptions'
    this.$get = function($translate, $rootScope, $sce, $q, gaPopup, gaLayers,
        gaMapUtils, gaWms, gaLang, $window, gaGlobalOptions) {
      // INGRID: Change html attribute to 'bind-html-compile'
      var popupContent = '<div bind-html-compile="options.result.html"></div>';

      // Called to update the content
      var updateContent = function(popup, layer) {
        var promise;
        /* INGRID: Disable intern legend service
        if (layer.bodId) {
          promise = gaLayers.getMetaDataOfLayer(layer.bodId);
        } else if (gaMapUtils.isExternalWmsLayer(layer)) {
          promise = gaWms.getLegend(layer);
        }
        */
        var id = layer.bodId;
        if (id === undefined) {
          id = layer.id;
        }
        // INGRID: Encode id
        // INGRID: Add wfs download
        if (popup.scope.options.isWfs && layer.wmsWfsUrl) {
          promise = gaLayers.
              getWfsDownloadsOfLayer(layer, popup.scope.options.wfsFilterParam);
        } else if (layer.hasLegend && layer.legendUrl) {
          promise = gaLayers.
              getMetaDataOfLayerWithLegend(encodeURIComponent(id),
                  encodeURIComponent(layer.legendUrl));
        } else if (gaMapUtils.isExternalWmsLayer(layer) ||
          (layer.hasLegend && layer.type &&
            layer.type.toLowerCase() === 'wms')) {
          promise = gaLayers.
              getMetaDataOfLayerWithLegend(encodeURIComponent(id),
                  encodeURIComponent(gaWms.getLegendURL(layer)));
        } else if (id) {
          promise = gaLayers.
              getMetaDataOfLayerWithLegend(encodeURIComponent(id));
        }
        return promise.then(function(resp) {
          popup.scope.options.result.html = $sce.trustAsHtml(resp.data);
          popup.scope.options.lang = gaLang.get();

          // INGRID: Add tabs
          popup.scope.currentTab = 1;
          popup.scope.showWMSTree = gaGlobalOptions.showLayerServiceTree;
          popup.scope.showWMSName = gaGlobalOptions.showLayerServiceName;

          // INGRID: Tabs management stuff
          popup.scope.activeTab = function(numTab) {
            popup.scope.currentTab = numTab;
          };

          // INGRID: Tabs management stuff
          popup.scope.getTabClass = function(numTab) {
            return (numTab === popup.scope.currentTab) ? 'active' : '';
          };

        }, function() {
          popup.scope.options.lang = undefined;
          // FIXME: better error handling
          $window.alert('Could not retrieve information for ' + layer.id);
        });
      };

      var updateContentLang = function(popup, layer, newLang, open) {
        if ((open || popup.scope.toggle) &&
            popup.scope.options.lang !== newLang) {
          return updateContent(popup, layer);
        }
        return $q.when();
      };

      var LayerMetadataPopup = function() {
        var popups = {};

        // INGRID: Add wfs download
        var create = function(layer, isWfsDownload, map) {
          var result = {html: ''},
            popup;

          if (isWfsDownload) {
            var wfsFilterBbox = '<div class="legend-footer">' +
            '<span translate>popup_wfs_filter</span>';

            // BoundingBox filter
            wfsFilterBbox += '<div class="col-xs-12 ga-checkboxes">' +
              '<div class="checkbox">' +
              '<label class="ga-checkbox">' +
              '<input type="checkbox" ng-model="options.wfsFilterBbox" '
                'ng-change="onChangeFilter()">' +
              '<span translate>popup_wfs_filter_bbox</span>' +
              '</label>' +
              '</div>' +
            '</div>';
            wfsFilterBbox += '</div>';
            popupContent += wfsFilterBbox;

            $rootScope.onChangeFilter = function() {
              var wfsFilterParam = '';
              if (popup.scope.options.wfsFilterBbox) {
                if (map) {
                  var extent = map.getView()
                    .calculateExtent(map.getSize()).toString();
                  var epsg = map.getView().getProjection().getCode()
                    .replace('EPSG:', '');
                  wfsFilterParam = '&BBOX=' + extent +
                    ',urn:ogc:def:crs:EPSG::' + epsg;
                }
              }
              popup.scope.options.wfsFilterParam = wfsFilterParam;
              updateContent(popup, layer);
            };
            
            map.on('moveend', function(evt) {
              if(popup.scope.toggle) {
                if(popup.scope.options.wfsFilterBbox) {
                  updateContent(popup, layer);
                }
              }
            });
          }

          // We assume popup does not exist yet
          // INGRID: Add wfs download
          popup = gaPopup.create({
            title: $translate.instant('metadata_window_title'),
            destroyOnClose: false,
            content: popupContent,
            result: result,
            className: 'ga-tooltip-metadata ga-popup-tablet-full',
            x: 400,
            y: 200,
            isWfs: isWfsDownload,
            wfsFilterParam: '',
            wfsFilterBbox: false,
            showPrint: true
          });
          // INGRID: Add wfs download
          var popupId = layer.id;
          if (isWfsDownload) {
            popupId += '_wfs';
          }
          popups[popupId] = popup;

          // Open popup only on success
          updateContent(popup, layer).then(function() {
            popup.open();
          });

          $rootScope.$on('$translateChangeEnd', function(evt, newLang) {
            updateContentLang(popup, layer, newLang);
          });
        };

        // INGRID: Add wfs download
        this.toggle = function(olLayerOrBodId, isWfsDownload, map) {
          var layer = olLayerOrBodId;
          if (angular.isString(layer)) {
            layer = gaLayers.getOlLayerById(layer);
          }
          // INGRID: Add wfs download
          var popupId = layer.id;
          if (isWfsDownload) {
            popupId += '_wfs';
          }
          var popup = popups[popupId];
          if (popup) { // if the popup already exist we toggle it
            if (popup.scope.toggle) {
              popup.close();
            } else {
              updateContentLang(popup, layer, gaLang.get(), true).
                  then(function() {
                    popup.open();
                  });
            }
          } else {
            // INGRID: Add wfs download
            create(layer, isWfsDownload, map);
          }
        };
      };

      return new LayerMetadataPopup();
    };
  });
})();
