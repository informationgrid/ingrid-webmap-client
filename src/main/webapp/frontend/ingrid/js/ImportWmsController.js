goog.provide('ga_importwms_controller');
(function() {

  var module = angular.module('ga_importwms_controller', []);

  module.controller('GaImportWmsController', function($scope, gaGlobalOptions) {
    $scope.options = {
      proxyUrl: gaGlobalOptions.ogcproxyUrl,
      defaultGetCapParams: 'SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0',
      defaultWMSList: [
        // INGRID: Add default WMS services for import
        'http://atlas.wsv.bund.de/bwastr/wms?',
        'http://gdi.uba.de/arcgis/services/BoFlLa/WMS_UBA_BoFlLa_NitratGrundWa_MST/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/Wa/WMS_UBA_Wa_FlNetz/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/BoFlLa/WMS_UBA_BoFlLa_CLL_UeberS/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/PrKo/WMS_UBA_PrKo_GFA/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/Wa/WMS_UBA_Wa_GWL/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/GeobD/WMS_UBA_GeobD_DE_DGM/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/Wa/WMS_UBA_Wa_NitratOberflWa/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/BoFlLa/WMS_UBA_BoFlLa_CLL_UeberS/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/Wa/WMS_UBA_Wa_GSK/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/Wa/WMS_UBA_Wa_MST/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/Wa/WMS_UBA_Wa_Seetyp/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/BoFlLa/WMS_UBA_BoFlLa_WaldBrRisiko/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/FDaten/WMS_UBA_FDaten_OekologRaumGl/MapServer/WMSServer?',
        'http://gdi.uba.de/arcgis/services/KlEn/WMS_UBA_KlEn_Kraftw/MapServer/WMSServer?',
        'http://wms.geo.admin.ch/'
      ]
    };
  });
})();
