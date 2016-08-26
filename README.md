Webmap Client
============= 

This software is part of the InGrid software package. The webmap client is integrated in the InGrid Portal and allows to display Web Map Services (WMS) and other geospatial data. The client is based on geo.admin.ch (see https://github.com/geoadmin/mf-geoadmin3) with for InGrid needed adjustments.

Features
--------

- map client based on Openlayers 3 and AngularJS
- pre configured, categorized Web Map Services
- integrated search of InGrid data space and Nominatim
- supports different, configurable coordinate systems
- displays WMS feature information
- draw feature
- print maps

Requirements
-------------

- a running InGrid Software System
- For standalone (without portal): an apache tomcat version >= 6.0.35

Installation
------------

Integrated in the InGrid portal. 

The Webmap Client can also run independent, but no installer support is added at the moment.

Following the next steps to install the Webmap Client without the portal:

### System pre installation on WINDOWS

   - Install Python 2.7 (https://www.python.org/downloads/)
   
   - Install cygwin (https://www.cygwin.com/) with the tools wget, make, gcc-core, gcc-g+, unzip, git

   - Add cygwin home path to system environment variable, for example:

    ```
    CYGWIN_HOME C:\cygwin
    ```

   - Add git home path to system environment variable, for example:

    ```
    GIT_HOME C:\Program Files (x86)\Git
    ```

### System pre installation on UNIX

  - Make sure to install the following dependencies (see https://github.com/geoadmin/mf-geoadmin3#dependencies)
  
    ```
    sudo apt-get install python-software-properties 
    sudo add-apt-repository ppa:chris-lea/node.js 
    sudo apt-get update
    sudo apt-get install make gcc+ git unzip openjdk-6-jre openjdk-6-jdk g++ npm python-virtualenv
    ```

### Project installation

- Checkout the project and build project with maven command:

    ```
    mvn clean install -Pwindows (For WINDOWS)
    mvn clean install -Punix (For UNIX)
    ```
- On your installed tomcat add for the project the configuration file "ingrid-webmap-client.xml" under "conf/Catalina/localhost".
- Add the following content to the configuration file:

    ```
    <Context path="/ingrid-webmap-client"
        docBase="<PROJECT_PATH>\target\ingrid-webmap-client"
        workDir="<PROJECT_PATH>\work"
        crossContext="true">
    </Context>
    ```
- Start the tomcat. 
- Open a browser and enter following URL:

    ```
    Debug version:
    http://localhost:8080/ingrid-webmap-client/frontend/src/
    
    Production version:
    http://localhost:8080/ingrid-webmap-client/frontend/prd/
    ```

Obtain further information at http://www.ingrid-oss.eu/

Contribute
----------

- Issue Tracker: https://github.com/informationgrid/ingrid-webmap-client/issues
- Source Code: https://github.com/informationgrid/ingrid-webmap-client

### Set up eclipse project

    ```
    mvn eclipse:eclipse clean install -Pwindows (For WINDOWS)
    mvn eclipse:eclipse clean install -Punix (For UNIX)
    ```

and import project into eclipse. 

### Debug under eclipse

To debug the project, the project must integrate to a local tomcat.

Following the next steps:

- Install a local apache tomcat (if not exist)
- Add to your eclipse the tomcat plugin "com.sysdeo.eclipse.tomcat_3.3.1" to start/stop the installed local tomcat from eclipse. (see http://www.eclipsetotale.com/tomcatPlugin.html#A3)
- After restart your eclipse go to "Window -> Preferences -> Tomcat" and select the path of your installed tomcat.
- On your installed tomcat add the the configuration "ingrid-webmap-client.xml" for the project under "conf/Catalina/localhost".
- Then follow the steps of **Following the next steps to install the Webmap Client without the portal** without checkout and build project.
- Start the tomcat with the installed eclipse plugin.

Support
-------

If you are having issues, please let us know: info@informationgrid.eu

License
-------

The project is licensed under the EUPL license.

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