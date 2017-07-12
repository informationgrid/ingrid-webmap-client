goog.provide('ga_background_service');

goog.require('ga_map_service');
goog.require('ga_permalink');

(function() {

  var module = angular.module('ga_background_service', [
    'ga_permalink',
    'ga_map_service'
  ]);

  /**
   * Backgrounds manager
   */
  module.provider('gaBackground', function() {
    this.$get = function($rootScope, $q, gaTopic, gaLayers, gaPermalink,
        gaUrlUtils) {
      var bg; // The current background
      var bgs = []; // The list of backgrounds available
      var bgsP; // Promise resolved when the background service is initialized.
      var voidLayer = {id: 'voidLayer', label: 'void_layer'};
      // INGRID: Add OSM layer
      var osmLayer = {id: 'osmLayer', label: 'bg_osm'};
      // INGRID: Change default background layer
      var predefinedBgs = {
        'voidLayer': voidLayer,
        'osmLayer': osmLayer,
        'webatlasde_light': {
          id: 'webatlasde_light',
          label: 'bg_bkg',
          disable3d: true
        },
        'webatlasde_grau': {
          id: 'webatlasde_grau',
          label: 'bg_bkg_grau',
          disable3d: true
        }
      };
      var getBgById = function(id) {
        for (var i = 0, ii = bgs.length; i < ii; i++) {
          if (bgs[i].id == id) {
            return bgs[i];
          }
        }
      };

      var getBgByTopic = function(topic) {
        var topicBg = null;
        if (topic.plConfig) {
          var p = gaUrlUtils.parseKeyValue(topic.plConfig);
          topicBg = getBgById(p.bgLayer);
        }
        return topicBg || getBgById(topic.defaultBackground) || bgs[0];
      };

      var broadcast = function() {
        if (gaPermalink.getParams().bgLayer != bg.id) {
          gaPermalink.updateParams({bgLayer: bg.id});
        }
        $rootScope.$broadcast('gaBgChange', bg);
      };

      var updateDefaultBgOrder = function(bgLayers) {
        bgLayers = bgLayers || [];
        bgs.length = 0;
        bgLayers.forEach(function(bgLayerId) {
          var bgLayer = predefinedBgs[bgLayerId];
          if (!bgLayer) {
            bgLayer = {
              id: bgLayerId,
              label: gaLayers.getLayerProperty(bgLayerId, 'label')
            };
          }
          bgs.push(bgLayer);
        });
        if (bgs.indexOf(voidLayer) === -1) {
          bgs.push(voidLayer);
        }
      };

      var Background = function() {

        this.init = function(map) {
          var that = this;
          // Initialize the service when topics and layers config are
          // loaded
          bgsP = $q.all([gaTopic.loadConfig(), gaLayers.loadConfig()]).
              then(function() {
            updateDefaultBgOrder(gaTopic.get().backgroundLayers);
            var initBg = getBgById(gaPermalink.getParams().bgLayer);
            if (!initBg) {
              initBg = getBgByTopic(gaTopic.get());
            }
            that.set(map, initBg);
            $rootScope.$on('gaTopicChange', function(evt, newTopic) {
              updateDefaultBgOrder(newTopic.backgroundLayers);
              that.set(map, getBgByTopic(newTopic));
            });
          });

          return bgsP;
        };

        this.getBackgrounds = function() {
          return bgs;
        };

        this.set = function(map, newBg) {
          if (map && newBg) {
            this.setById(map, newBg.id);
          }
        };

        this.setById = function(map, newBgId) {
          if (map && (!bg || newBgId != bg.id)) {
            var newBg = getBgById(newBgId);
            if (newBg) {
              bg = newBg;
              var layers = map.getLayers();
              if (bg.id == 'voidLayer') {
                if (layers.getLength() > 0 &&
                    layers.item(0).background === true) {
                  layers.removeAt(0);
                }
              // INGRID: Create OSM layer
              } else if (bg.id == 'osmLayer') {
                  var layer = new ol.layer.Tile({
                      source: new ol.source.OSM()
                  });
                  layer.background = true;
                  // INGRID: Add visible
                  layer.visible = true;
                  layer.displayInLayerManager = false;
                  if (layers.item(0) && layers.item(0).background) {
                    layers.setAt(0, layer);
                  } else {
                    layers.insertAt(0, layer);
                  }
              } else {
                var layer = gaLayers.getOlLayerById(bg.id);
                layer.background = true;
                layer.displayInLayerManager = false;
                if (layers.item(0) && layers.item(0).background) {
                  layers.setAt(0, layer);
                } else {
                  layers.insertAt(0, layer);
                }
              }
              broadcast();
             }
          }
        };

        this.loadConfig = function() {
          return bgsP;
        };

        this.get = function() {
          return bg;
        };
      };
      return new Background();
    };
  });
})();
