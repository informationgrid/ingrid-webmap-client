goog.provide('ga_definepropertiesforlayer_service');

(function() {

  var module = angular.module('ga_definepropertiesforlayer_service', []);

  /**
   * This service is a function that define properties (data and accessor
   * descriptors) for the OpenLayers layer passed as an argument.
   *
   * Adding descriptors to layers makes it possible to control the states
   * of layers (visibility, opacity, etc.) through ngModel. (ngModel indeed
   * requires the expression to be "assignable", and there's currently no
   * way pass to pass getter and setter functions to ngModel.)
   */
  module.provider('gaDefinePropertiesForLayer', function() {

    this.$get = function() {
      return function defineProperties(olLayer) {
        olLayer.set('altitudeMode', 'clampToGround');
        Object.defineProperties(olLayer, {
          visible: {
            get: function() {
              return this.userVisible;
            },
            set: function(val) {
              this.userVisible = val;
              var vis = this.userVisible && !this.hiddenByOther;
              // apply the value only if it has changed
              // otherwise the change:visible event is triggered when it's
              // useless
              if (vis !== this.getVisible()) {
                this.setVisible(vis);
              }
            }
          },
          hiddenByOther: {
            get: function() {
              return this.get('hiddenByOther');
            },
            set: function(val) {
              this.set('hiddenByOther', val);
              if (val && this.userVisible) {
                this.setVisible(false);
              } else {
                this.visible = this.userVisible;
              }
            }
          },
          invertedOpacity: {
            get: function() {
              return Math.round((1 - this.getOpacity()) * 100) / 100;
            },
            set: function(val) {
              this.setOpacity(1 - val);
            }
          },
          id: {
            get: function() {
              return this.get('id') || this.bodId;
            },
            set: function(val) {
              this.set('id', val);
            }
          },
          bodId: {
            get: function() {
              return this.get('bodId');
            },
            set: function(val) {
              this.set('bodId', val);
            }
          },
          adminId: {
            get: function() {
              return this.get('adminId') || this.bodId;
            },
            set: function(val) {
              this.set('adminId', val);
            }
          },
          label: {
            get: function() {
              return this.get('label');
            },
            set: function(val) {
              this.set('label', val);
            }
          },
          url: {
            get: function() {
              return this.get('url');
            },
            set: function(val) {
              this.set('url', val);
            }
          },
          // INGRID: Add queryable functions
          queryable: {
            get: function() {
              return this.get('queryable');
            },
            set: function(val) {
              this.set('queryable', val);
            }
          },
          // INGRID: Add crossOrigin functions
          crossOrigin: {
            get: function() {
              return this.get('crossOrigin');
            },
            set: function(val) {
              this.set('crossOrigin', val);
            }
          },
          // INGRID: Add extent functions
          extent: {
            get: function() {
              return this.get('extent');
            },
            set: function(val) {
              this.set('extent', val);
            }
          },
          // INGRID: Add minScale functions
          minScale: {
            get: function() {
              return this.get('minScale');
            },
            set: function(val) {
              this.set('minScale', val);
            }
          },
          // INGRID: Add maxScale functions
          maxScale: {
            get: function() {
              return this.get('maxScale');
            },
            set: function(val) {
              this.set('maxScale', val);
            }
          },
          // INGRID: Add queryLayers functions
          queryLayers: {
            get: function() {
              return this.get('queryLayers');
            },
            set: function(val) {
              this.set('queryLayers', val);
            }
          },
          // INGRID: Add auth functions
          auth: {
            get: function() {
              return this.get('auth');
            },
            set: function(val) {
              this.set('auth', val);
            }
          },
          // INGRID: Add isSecure functions
          isSecure: {
            get: function() {
              return this.get('isSecure');
            },
            set: function(val) {
              this.set('isSecure', val);
            }
          },
          // INGRID: Add hasLoggedIn functions
          hasLoggedIn: {
            get: function() {
              return this.get('hasLoggedIn');
            },
            set: function(val) {
              this.set('hasLoggedIn', val);
            }
          },
          // INGRID: Add featureCount functions
          featureCount: {
            get: function() {
              return this.get('featureCount');
            },
            set: function(val) {
              this.set('featureCount', val);
            }
          },
          timeEnabled: {
            get: function() {
              return this.get('timeEnabled');
            },
            set: function(val) {
              this.set('timeEnabled', val);
            }
          },
          timeBehaviour: {
            get: function() {
              return this.get('timeBehaviour');
            },
            set: function(val) {
              this.set('timeBehaviour', val);
            }
          },
          timestamps: {
            get: function() {
              return this.get('timestamps');
            },
            set: function(val) {
              this.set('timestamps', val);
            }
          },
          time: {
            get: function() {
              if (this instanceof ol.layer.Layer) {
                var src = this.getSource();
                if (src instanceof ol.source.WMTS) {
                  return src.getDimensions().Time;
                } else if (src instanceof ol.source.ImageWMS ||
                    src instanceof ol.source.TileWMS) {
                  return src.getParams().TIME;
                }
                return this.get('time');
              }
            },
            set: function(val) {
              if (this.time === val) {
                // This 'if' avoid triggering a useless layer's 'propertychange'
                // event.
                return;
              }
              if (this instanceof ol.layer.Layer) {
                var src = this.getSource();
                if (src instanceof ol.source.WMTS) {
                  // INGRID: Update time val
                  src.updateDimensions({'Time': val || ''});
                } else if (src instanceof ol.source.ImageWMS ||
                    src instanceof ol.source.TileWMS) {
                  if (angular.isDefined(val)) {
                    // INGRID: Update time val
                    src.updateParams({'TIME': val || ''});
                  } else {
                    delete src.getParams().TIME;
                    src.updateParams();
                  }
                }
                this.set('time', val);
              }
            }
          },
          getCesiumImageryProvider: {
            get: function() {
              return this.get('getCesiumImageryProvider') || angular.noop;
            },
            set: function(val) {
              this.set('getCesiumImageryProvider', val);
            }
          },
          getCesiumTileset3d: {
            get: function() {
              return this.get('getCesiumTileset3d') || angular.noop;
            },
            set: function(val) {
              this.set('getCesiumTileset3d', val);
            }
          },
          getCesiumDataSource: {
            get: function() {
              return this.get('getCesiumDataSource') || angular.noop;
            },
            set: function(val) {
              this.set('getCesiumDataSource', val);
            }
          },
          altitudeMode: {
            get: function() {
              return this.get('altitudeMode');
            },
            set: function(val) {
              this.set('altitudeMode', val);
            }
          },
          background: {
            writable: true,
            value: false
          },
          displayInLayerManager: {
            writable: true,
            value: true
          },
          useThirdPartyData: {
            writable: true,
            value: false
          },
          preview: {
            writable: true,
            value: false
          },
          geojsonUrl: {
            writable: true,
            value: null
          },
          updateDelay: {
            writable: true,
            value: null
          },
          externalStyleUrl: {
            writable: true,
            value: null
          },
          userVisible: {
            writable: true,
            value: olLayer.getVisible()
          },
          displayIn3d: {
            writable: true,
            value: true
          }
        });
      };
    };
  });
})();
