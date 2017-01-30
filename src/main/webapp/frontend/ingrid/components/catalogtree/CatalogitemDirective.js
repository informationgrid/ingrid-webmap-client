goog.provide('ga_catalogitem_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_catalogtree_directive');
goog.require('ga_catalogtree_service');
goog.require('ga_layermetadatapopup_service');
goog.require('ga_map_service');
goog.require('ga_previewlayers_service');
(function() {

  var module = angular.module('ga_catalogitem_directive', [
    'ga_browsersniffer_service',
    'ga_catalogtree_directive',
    'ga_catalogtree_service',
    'ga_layermetadatapopup_service',
    'ga_map_service',
    'ga_previewlayers_service'
  ]);

  /**
   * See examples on how it can be used
   */
  module.directive('gaCatalogitem',
      // INGRID: Add params 'gaLayers', 'gaGlobalOptions'
      function($compile, gaCatalogtreeMapUtils, gaMapUtils,
          gaLayerMetadataPopup, gaBrowserSniffer, gaPreviewLayers, gaLayers, gaGlobalOptions) {

        // Don't add preview layer if the layer is already on the map
        var addPreviewLayer = function(map, item) {
          // INGRID: Activate preview layer for parent layer
          if (item.layerBodId) {
            gaPreviewLayers.addBodLayer(map, item.layerBodId);
          }
        };

        // Remove all preview layers
        var removePreviewLayer = function(map) {
          gaPreviewLayers.removeAll(map);
        };

        var getOlLayer = function(map, item) {
          if (!item) {
            return undefined;
          }
          return gaMapUtils.getMapOverlayForBodId(map, item.layerBodId);
        };

        return {
          restrict: 'A',
          replace: true,
          require: '^gaCatalogtree',
          templateUrl: 'components/catalogtree/partials/catalogitem.html',
          scope: {
            item: '=gaCatalogitemItem',
            map: '=gaCatalogitemMap',
            options: '=gaCatalogitemOptions'
          },
          controller: function($scope) {

            $scope.item.active = function(activate) {
              var layer = getOlLayer($scope.map, $scope.item);
              //setter called
              if (arguments.length) {
                if (layer) {
                  layer.visible = activate;
                }
                if (activate) {
                  //INGRID: Remove open parent layer node
                  //$scope.item.selectedOpen = true;
                  // Add it if it's not already on the map
                  if (!layer) {
                    removePreviewLayer($scope.map);
                    gaCatalogtreeMapUtils.addLayer($scope.map, $scope.item);
                  }
                }
              } else { //getter called
                //INGRID: Remove '$scope.item.selectedOpen'
                return layer && layer.visible;
              }
            };

            $scope.toggle = function(evt) {
              $scope.item.selectedOpen = !$scope.item.selectedOpen;
              evt.preventDefault();
              evt.stopPropagation();
            };

            $scope.getLegend = function(evt, bodId) {
              gaLayerMetadataPopup.toggle(bodId);
              evt.stopPropagation();
            };

// INGRID: Add zoom to extent
            $scope.zoomToExtent = function(evt, bodId) {
              var layer = gaLayers.getLayer(bodId);
              if(layer){
                if(layer.extent){
                  var extent = ol.proj.transformExtent(layer.extent, 'EPSG:4326', gaGlobalOptions.defaultEpsg)
                  gaMapUtils.zoomToExtent($scope.map, undefined, extent);
                }
              }
              evt.stopPropagation();
            };
            
// INGRID: Add hasExtent
            $scope.hasExtent = function(bodId) {
              var layer = gaLayers.getLayer(bodId);
              if(layer){
                if(layer.extent){
                    return true;
                }
              }
              return false;
            };
            
// INGRID: Add isLayer
            $scope.isLayer = function(bodId) {
              if(bodId){
                return true;
              }
              return false;
            };
          
// INGRID: Add isParentLayer
            $scope.isParentLayer = function(item) {
              if(item){
                if(item.layerBodId){
                  if(item.children){
                    return true;
                  }
                }
              }
              return false;
            };
          },

          compile: function(tEl, tAttr) {
            var contents = tEl.contents().remove();
            var compiledContent;
            return function(scope, iEl, iAttr, controller) {
              if (!compiledContent) {
                compiledContent = $compile(contents);
              }

              // Node
              if (angular.isDefined(scope.item.children)) {
                scope.$watch('item.selectedOpen', function(value) {
                  controller.updatePermalink(scope.item.id, value);
                });

              }
              // INGRID: Split else if for preview of parent layer
              // Leaf
              if (!gaBrowserSniffer.mobile) {
                iEl.on('mouseenter', function(evt) {
                  addPreviewLayer(scope.map, scope.item);
                }).on('mouseleave', function(evt) {
                  removePreviewLayer(scope.map);
                });
              }
              compiledContent(scope, function(clone, scope) {
                iEl.append(clone);
              });
            };
          }
        };
      }
  );
})();