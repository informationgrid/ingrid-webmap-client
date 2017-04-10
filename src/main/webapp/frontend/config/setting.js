// Default active topic by id (see '../data/catalogs.json')
var settingDefaultTopicId = 'themen';

// Override default map extend (default: "'[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]'")
var settingExtent = undefined;

// Override default map EPSG extend (default: "'[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]'")
var settingEpsgExtent = undefined;

//Override default EPSG (default: 'EPSG:3857')
var settingEpsg = undefined;

// Override short URL service (default: 'https://is.gd/create.php?format=json')
var settingShortURLService = undefined;

// Define opensearch URL to search for WMS services. (integrate on map client search field) 
var settingSearchServiceUrl = 'http://dev.informationgrid.eu/opensearch/query?q={query}+t011_obj_serv_op_connpoint.connect_point:http*+t011_obj_serv.type:view+cache:off+datatype:metadata+ranking:score%26ingrid=1%26h=100';

// Define nominatim URL to search for cities, places, countries (integrate on map client search field)
var settingSearchNominatimUrl = 'http://nominatim.openstreetmap.org/search?format=json%26countrycodes=de';

// Define DLZ-IT BWaStrLocator URL to search rivers and details (integrate on map client search field)
var settingSearchBwaLocatorUrl = 'https://atlas.wsv.bund.de/bwastr-locator/rest/bwastrinfo/query?limit=200%26searchfield=all';

// Define BWaStrLocator services URL for river details
var settingSearchBwaLocatorGeoUrl = 'https://atlas.wsv.bund.de/bwastr-locator/rest/geokodierung/query';

// Define BWaStrLocator services URL for river details
var settingSearchBwaLocatorStationUrl = 'https://atlas.wsv.bund.de/bwastr-locator/rest/stationierung/query';

// Override copyright URL (Default: '/impressum')
var settingCopyrightURL = undefined;

// Override sitemap URL (Default: '/inhaltsverzeichnis'()
var settingSitemapURL = undefined;

// Activate to use geodesic
var settingUseGeodesic = true;

// Override default mouse position projection (Default: 0)
var settingDefaultMousePositionIndex = 0;

// Default list on WMS import function
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

// Activate social networks services 
var settingShareFacebook = true;
var settingShareMail = true;
var settingShareGoogle = true;
var settingShareTwitter = true;
var settingShareIFrame = true;
var settingShareLink = true;

// Define URL of print logo on PDF  
var settingPrintLogo = location.protocol + '//' + location.host + '/ingrid-webmap-client/frontend/prd/img/print_logo.png';

//Define URL of north arrow icon on PDF
var settingPrintNorthArrow = location.protocol + '//' + location.host + '/ingrid-webmap-client/frontend/prd/img/north_arrow.png';

//Print graticule layer
var settingPrintGraticuleLayer = '{"url":"http://atlas.wsv.bund.de/netze/wms?", "layers":["GN","GNB"]}';

// Default prefix for download KML
var settingKMLName = 'INGRID';

// Hide of catalog menu
var settingHideCatalog = false;