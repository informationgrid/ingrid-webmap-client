(function() {
  goog.provide('ga_searchtool_directive');

  var module = angular.module('ga_searchtool_directive', [
    'pascalprecht.translate'
  ]);

  module.directive('gaSearchtool',
    function($timeout, $translate, $window, $rootScope, gaBrowserSniffer,
        gaDefinePropertiesForLayer, gaDebounce, gaFileStorage, gaLayerFilters,
        gaExportKml, gaMapUtils, gaPermalink, $http, $q, gaUrlUtils) {

      return {
        restrict: 'A',
        templateUrl: 'ingrid/components/searchtool/partials/searchtool.html',
        scope: {
          map: '=gaSearchtoolMap',
          options: '=gaSearchtoolOptions',
          isActive: '=gaSearchtoolActive'
        },
        link: function(scope, element, attrs, controller) {
          var lastActiveTool;
          var map = scope.map;

          var source = new ol.source.Vector({wrapX: false});

          var vector = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
              fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
              }),
              stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
              }),
              image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                  color: '#ffcc33'
                })
              })
            })
          });
          map.addLayer(vector);
          
          var geometryFunction = function(coordinates, geometry) {
              if (!geometry) {
                  geometry = new ol.geom.Polygon(null);
                }
              
                var start = coordinates[0];
                var end = coordinates[1];
                geometry.setCoordinates([
                  [start, [start[0], end[1]], end, [end[0], start[1]], start]
                ]);
                
                return geometry;
          };
          var drawArea = new ol.interaction.Draw({
              source: source,
              type: 'LineString',
              geometryFunction: geometryFunction,
              maxPoints: 2
            });
          
          drawArea.on('drawstart',
                  function(evt) {
                  evt.target.source_.clear(true);
                  }, this);

          drawArea.on('drawend',
                  function(evt) {
              var geo = evt.feature.getGeometry();
              if(geo){
                  var infoBox = document.getElementById('searchtool_area_value');
                  var extent = geo.getExtent();
                  if(extent){
                      infoBox.innerHTML =  ol.coordinate.format([extent[2], extent[3]], '{y} / {x}', 2) + ' | ' + ol.coordinate.format([extent[0], extent[1]], '{y} / {x}', 2);
                  }
              }
          }, this);
          
          // Activate the component: active a tool if one was active when draw
          // has been deactivated.
          var activate = function() {
            if (lastActiveTool) {
                activateTool(lastActiveTool);
            }

          };

          // Deactivate the component: remove layer and interactions.
          var deactivate = function() {

            // Deactivate the tool
            if (lastActiveTool) {
              scope.options[lastActiveTool.activeKey] = false;
            }
            drawArea.source_.clear(true);
            map.removeInteraction(drawArea);
          };

          // Deactivate other tools
          var activateTool = function(tool) {

            var tools = scope.options.tools;
            for (var i = 0, ii = tools.length; i < ii; i++) {
              scope.options[tools[i].activeKey] = (tools[i].id == tool.id);
            }

            if (tool.id == 'delete') {
             return;
            }

            scope.options.instructions = tool.instructions;
            lastActiveTool = tool;
          };

          // Set the select interaction
          var activateSelectInteraction = function() {
            deactivateSelectInteraction();
            deactivateModifyInteraction();
          };

          var deactivateSelectInteraction = function() {
            // Clearing the features updates scope.useXXX properties
          };

          // Set the modifiy interaction
          var activateModifyInteraction = function() {
            activateSelectInteraction();

          };

          var deactivateModifyInteraction = function() {
          };


          // Activate/deactivate a tool
          scope.toggleTool = function(evt, tool) {
              drawArea.source_.clear(true);
              if (scope.options[tool.activeKey]) {
              // Deactivate all tools
              deactivate();
              lastActiveTool = undefined;
            } else {
              activateTool(tool);
            }
            evt.preventDefault();
          };

          scope.aToolIsActive = function() {
            return !!lastActiveTool;
          };

          // Watchers
          scope.$watch('isActive', function(active) {
            if (active) {
              activate();
            } else {
              deactivate();
            }
          });

          scope.$watch('options.isPointActive', function(active) {
            if (active) {
                drawArea.source_.clear(true);
                map.removeInteraction(drawArea);
            }
          });
          scope.$watch('options.isAreaActive', function(active) {
            if (active) {
                drawArea.source_.clear(true);
                map.addInteraction(drawArea);
            }
          });
        }
      };
    }
  );
})();
