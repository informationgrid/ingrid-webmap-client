goog.provide('ga_print_controller');
(function() {

  var module = angular.module('ga_print_controller', []);

  module.controller('GaPrintController', function($scope, gaGlobalOptions) {
    // INGRID: Change print path
    var printPath = '/ingrid-webmap-client/pdf';
    /* INGRID: Not in used
    var printCachedPath = gaGlobalOptions.cachedPrintUrl + '/print';
    */

    $scope.options = {
      printPath: printPath,
      // INGRID: Change print config URL
      printConfigUrl: gaGlobalOptions.printServiceUrl,
      // INGRID: Disable legend URL service
      legendUrl: '',
      qrcodeUrl: gaGlobalOptions.apiUrl + '/qrcodegenerator?url=',
      // INGRID: Change shorten URL service
      shortenUrl: gaGlobalOptions.shortURLService,
      markerUrl: gaGlobalOptions.resourceUrl + 'img/marker.png',
      bubbleUrl: gaGlobalOptions.resourceUrl + 'img/bubble.png',
      heightMargin: $('#header').height(),
      widthMargin: $('#pulldown').width(),
      // Hardcode listd of legends that should be downloaded in
      // separate PDF instead of putting the image in the same
      // PDF as the print (as in RE2). Note: We should avoid doing
      // this as it feels hacky. We should create nice png what are
      // usable in the pdf
      pdfLegendList: [
        'ch.astra.ivs-gelaendekarte',
        'ch.astra.ausnahmetransportrouten',
        'ch.bazl.luftfahrtkarten-icao',
        'ch.bazl.segelflugkarte',
        'ch.swisstopo.geologie-eiszeit-lgm-raster',
        'ch.swisstopo.geologie-geologische_karte',
        'ch.swisstopo.geologie-hydrogeologische_karte-grundwasservorkommen',
        'ch.swisstopo.geologie-hydrogeologische_karte-grundwasservulnerabilitaet', // eslint-disable-line max-len
        'ch.swisstopo.geologie-tektonische_karte',
        'ch.kantone.cadastralwebmap-farbe',
        'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'ch.swisstopo.pixelkarte-farbe-pk500.noscale',
        'ch.swisstopo.pixelkarte-farbe-pk200.noscale',
        'ch.swisstopo.pixelkarte-farbe-pk100.noscale',
        'ch.swisstopo.pixelkarte-farbe-pk50.noscale',
        'ch.swisstopo.pixelkarte-farbe-pk25.noscale'
      ]
    };
  });
})();
