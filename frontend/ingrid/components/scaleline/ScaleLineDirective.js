goog.provide('ga_scaleline_directive');
(function() {

  var module = angular.module('ga_scaleline_directive', []);

  // INGRID: Add 'gaGlobalOptions'
  module.directive('gaScaleLine', function(gaGlobalOptions) {
    return {
      restrict: 'A',
      scope: {
        map: '=gaScaleLineMap'
      },
      link: function(scope, element, attrs) {

        // INGRID: Add mapScale function
        var self = this;
        var className = 'ol-scale-line';
        this.render = null;

        if (gaGlobalOptions.enableMapScale) {
          className = 'ol-scale-line ol-scale-maps';
          this.render = function(mapEvent) {
            var frameState = mapEvent.frameState;
            if (!frameState) {
              this.viewState_ = null;
            } else {
              this.viewState_ = frameState.viewState;
            }
            self.updateElementScale(this);
          };
        }
        var control = new ol.control.ScaleLine({
          // INGRID: Add 'render'
          render: this.render,
          className: className,
          target: element[0]
        });
        scope.map.addControl(control);

        // INGRID: Add 'updateElementScale'
        this.updateElementScale = function(control) {
          var viewState = control.viewState_;

          if (!viewState) {
            if (control.renderedVisible_) {
              control.element_.style.display = 'none';
              control.renderedVisible_ = false;
            }
            return;
          }

          var html = '';
          if (gaGlobalOptions.resolutions.length > 0) {
            var scaleLabel = gaGlobalOptions.resolutionsLabel[viewState.zoom];
            if (scaleLabel !== undefined) {
              html = '1:' + scaleLabel.toLocaleString();
              if (control.renderedHTML_ !== html) {
                control.innerElement_.innerHTML = html;
                control.renderedHTML_ = html;
              }
            }
          } else {
            var center = viewState.center;
            var projection = viewState.projection;
            var metersPerUnit = projection.getMetersPerUnit();
            var pointResolution =
                  ol.proj.getPointResolution(projection,
                      viewState.resolution, center) * metersPerUnit;

            const dpi = this.dpi_ || 25.4 / 0.28; ;
            const inchesPerMeter = 1000 / 25.4;
            const mapScale = pointResolution * inchesPerMeter * dpi;
            const mapScaleText = mapScale < 1 ?
              Math.round(1 / mapScale).toLocaleString() + ' : 1' :
              '1 : ' + Math.round(mapScale).toLocaleString();

            html = mapScaleText;
            if (control.renderedHTML_ !== html) {
              control.innerElement_.innerHTML = html;
              control.renderedHTML_ = html;
            }
          }
        };
      }
    };
  });
})();
