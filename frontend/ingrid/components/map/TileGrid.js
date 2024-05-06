goog.provide('ga_tilegrid_service');

(function() {

  var module = angular.module('ga_tilegrid_service', []);

  module.provider('gaTileGrid', function() {

    function createTileGrid(origin, resolutions, type, tileSize,
        gaGlobalOptions) {
      // INGRID: Use proj resolution
      var extent = ol.proj.get(gaGlobalOptions.defaultEpsg).getExtent();
      var startResolution = ol.extent.getWidth(extent) / (tileSize || 256);
      var tmpResolutions = new Array(22);
      if (resolutions.length === 0) {
          for (let i = 0, ii = tmpResolutions.length; i < ii; ++i) {
            tmpResolutions[i] = startResolution / Math.pow(2, i);
          }
      } else {
        tmpResolutions = resolutions;
      }
      if (type === 'wms') {
        return new ol.tilegrid.TileGrid({
          extent: ol.proj.get(gaGlobalOptions.defaultEpsg).getExtent(),
          tileSize: tileSize || 256,
          resolutions: tmpResolutions
        });
      }
      return new ol.tilegrid.WMTS({
        matrixIds: $.map(resolutions, function(r, i) { return i + ''; }),
        origin: origin,
        resolutions: resolutions
      });
    }

    this.$get = function(gaGlobalOptions) {
      return {
        // INGRID: Add 'tileSize'
        get: function(minResolution, type, tileSize) {
          var resolutions = [].concat(gaGlobalOptions.tileGridResolutions);
          if (minResolution) { // we remove useless resolutions
            for (var i = 0, ii = resolutions.length; i < ii; i++) {
              if (resolutions[i] === minResolution) {
                resolutions = resolutions.splice(0, i + 1);
                break;
              } else if (resolutions[i] < minResolution) {
                resolutions = resolutions.splice(0, i);
                break;
              }
            }
          }
          // INGRID: Add 'tileSize' and 'gaGlobalOptions'
          return createTileGrid(gaGlobalOptions.tileGridOrigin, resolutions,
              type, tileSize, gaGlobalOptions);
        }
      };
    };
  });
})();
