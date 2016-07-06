// Default
var settingExtent = undefined;
var settingEpsgExtent = undefined;
var settingEpsg = undefined;
var settingShortURLService = undefined;
var settingSearchServiceUrl = 'https://dev.informationgrid.eu/opensearch/query?q={query}+t011_obj_serv_op_connpoint.connect_point:http*+t011_obj_serv.type:view+cache:off+datatype:metadata+ranking:score%26ingrid=1%26h=100';
var settingSearchNominatimUrl = 'http://nominatim.openstreetmap.org/search?format=json%26countrycodes=de';
var settingCopyrightURL = undefined;
// KML
var settingKMLName = 'INGRID';
// WMS Import
var settingDefaultWMSList = [
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
   ];
// Share
var settingShareFacebook = true;
var settingShareMail = true;
var settingShareGoogle = true;
var settingShareTwitter = true;
var settingShareIFrame = true;
var settingShareLink = true;
var settingPrintLogo = location.protocol + '//' + location.host + '/ingrid-webmap-client/frontend/prd/img/ingrid_logo_icn_big.png';
var settingPrintNorthArrow = location.protocol + '//' + location.host + '/ingrid-webmap-client/frontend/prd/img/north_arrow.png';
