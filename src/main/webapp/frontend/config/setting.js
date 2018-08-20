// Default active topic by id (see '../data/catalogs.json')
var settingDefaultTopicId = 'themen';

// Override default map extend (default: "'[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]'")
var settingExtent = undefined;

// Override default map EPSG extend (default: "'[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]'")
var settingEpsgExtent = undefined;

//Override default EPSG (default: 'EPSG:3857')
var settingEpsg = undefined;

//Override supported languages (default: 'EPSG:3857')
var settingLanguages = '["de", "en"]';

// Override short URL service (default: 'https://is.gd/create.php?format=json')
var settingShortURLService = undefined;

// Define opensearch URL to search for WMS services. (integrate on map client search field) 
var settingSearchServiceUrl = 'http://dev.informationgrid.eu/opensearch/query?q={query}+t011_obj_serv_op_connpoint.connect_point:http*+t011_obj_serv.type:view+cache:off+datatype:metadata+ranking:score%26ingrid=1%26h=100';

// Define gazetter/nominatim zoom level 
var settingGazetterZoom = 10;

// Define nominatim URL to search for cities, places, countries (integrate on map client search field)
var settingSearchNominatimUrl = 'https://nominatim.openstreetmap.org/search?format=json%26countrycodes=de';

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

// Override default mouse position projections
var settingDefaultMouseProjections = ['EPSG:3857', 'EPSG:4326', 'EPSG:31466', 'EPSG:31467', 'EPSG:31468', 'EPSG:31469', 'EPSG:25832', 'EPSG:25833'];

// Default list on import function
var settingDefaultImportList = [
     'http://atlas.wsv.bund.de/bwastr/wms?VERSION=1.1.1',
     'http://atlas.wsv.bund.de/ienc/wms?',
     'http://atlas.wsv.bund.de/wadaba/wms?',
     'http://atlas.wsv.bund.de/bwastr/wmts/1.0.0/WMTSCapabilities.xml',
     'http://atlas.wsv.bund.de/ienc/wmts/1.0.0/WMTSCapabilities.xml'
   ];

// Activate social networks services 
var settingShareFacebook = true;
var settingShareMail = true;
var settingShareGoogle = true;
var settingShareTwitter = true;
var settingShareIFrame = true;
var settingShareLink = true;
var settingShareQR = true;

// Define URL of print logo on PDF  
var settingPrintLogo = location.protocol + '//' + location.host + '/ingrid-webmap-client/frontend/prd/img/print_logo.png';

// Define URL of north arrow icon on PDF
var settingPrintNorthArrow = location.protocol + '//' + location.host + '/ingrid-webmap-client/frontend/prd/img/north_arrow.png';

// Print graticule layer
var settingPrintGraticuleLayer = '{"url":"http://atlas.wsv.bund.de/netze/wms?", "layers":["GN","GNB"]}';

// Print filename
var settingPrintFilename = 'Print.InGrid';

// Print depend on mouse position control
var settingPrintDependOnMouseProj = false;

// Default prefix for download KML
var settingKMLName = 'INGRID';

// Hide of catalog menu
var settingHideCatalog = false;

// Enable what3words
var settingEnableW3W = true;
var w3wUrl = 'https://api.what3words.com';
var w3wApiKey = 'OM48J50Y';

// Show service name to layer
var settingShowLayerServiceName = true;

// Show service tree of layer
var settingShowLayerServiceTree = true;

// Enable check layer in range
var settingCheckLayerInRange = true;

// Enable iso xml link on service search info
var settingShowISOXML = true;

// Change coord XY for search
var settingSearchCoordsXY = false;

// Change coord zoom for search
var settingSearchCoordsZoom = 16;

// Enable 3D
var settingEnable3D = false;

var settingDefaultTerrain = '//assets.agi.com/stk-terrain/world';