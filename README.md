Webmap Client (ingrid-mf-geoadmin3)
============= 

This software is part of the InGrid software package. The webmap client is integrated in the InGrid Portal and allows to display Web Map Services (WMS) and other geospatial data.

Contribute
----------

- Issue Tracker: https://github.com/informationgrid/ingrid-webmap-client/issues
- Source Code: https://github.com/informationgrid/ingrid-webmap-client

### Integration to Eclipse

- cd "PROJECT_PATH"
- mvn eclipse:eclipse

### Set up dev version

- cd "PROJECT_PATH"/mf-geoadmin3
- make dev
- mvn clean install

### Set up prod version

- cd "PROJECT_PATH"/mf-geoadmin3
- make prod
- mvn clean install


Changes for InGrid
------------------

### index.ingrid.dev.html, mobile.ingrid.dev.html and embed.ingrid.dev.html
- Change title.
- Change icons.
- Add seperate InGrid style.
- Add ZoomToExtent button (if needed).
- Change deps js file path to a seperate InGrid file.
- Change file names for embed, desktop(index) and mobile html version. 
- Disabled dev3d. (not needed for InGrid)
- Define default epsg, epsg extent, extent and topic for InGrid.
- Change locales path for InGrid specific localisation. 
- Change services for layer, topic, and legend.

### deps.ingrid.js
- For all changed components and controllers the deps.ingrid.js must be changed with the right file path.

### js/GaCesium.js
- Used 'gaGlobalOptions.defaultEpsg' to calculate extent for EPSG:4326.

### js/GaModule.js
- Add requires and modules for add components and controllers.

### js/ImportWMSController.js
- Change default WMS services for import Services by drop down list. 

### js/MousePositionController.js
- Change projection system for your own usage.

### js/PrintController.js
- Change print path.
- Change print configuration URL.
- Disable legend service and use getLegend request.
- Disable shorten URL service.

### js/SearchController.js
- Change search services URL.

### js/MainController.js
- Add ZoomToExtend button (if needed).
- Disabled default projection extent to show worldwide map (e.g. OSM layer).
- Edit configuration of map. (e.g. map center by default extent, default projection)

### components/backgroundselector/BackgroundService.js
- Change default background services.
- Add and create OSM layer (if needed)

### components/catalogtree/CatalogtreeDirectiv.js
- Change get topic service URL.

### components/importwms/ImportWMSDirective.js
- Add layer WMS version to create getMap request.
- OL3 only support parsing of WMS version 1.1.1 yet.

### components/map/MapDirective.js
- Add function to zoom to define default extent on first load. 

### components/map/MapService.js
- Add WMS service version to layer id if need to display WMS service version 1.1.1.
- Change function to get layer legend only by getLegend request.
- Set layer extent by default layer projection.

### components/print/PrintDirective.js
- Disable unused function (e.g. shorten URL, QRCode, graticule) 
- Add additional print options like title and comment for print view.
- Change print service URL.

### components/search/SearchDirective.js
- Change search query key (if needed).

### components/search/SearchTypesDirective.js
- Integrate nominatim and layer (currently show all define layers on layers.json) search services.

### components/share/ShareDirective.js
- Remove unused function (e.g. QRCode).

### components/LayerMetadataPopupService.js
- Disable intern legend service.