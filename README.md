Webmap Client
=============

This software is part of the InGrid software package. The webmap client is integrated in the InGrid Portal and allows to display Web Map Services (WMS) and other geospatial data.


Features
--------

- GeoExt 2.0 based map client
- user friendly administration GUI, edit properties of the included Web Map Services
- pre configured, categorized Web Map Services
- integrated search of InGrid data space and Nominatim
- load save configurations
- supports different, configurable coordinate systems
- displays WMS feature information
- red lining
- watch included Web Map Services for changes



Requirements
-------------

- a running InGrid Software System
- For standalone (without portal): an apache tomcat version >= 6.0.35

Installation
------------

Integrated in the InGrid portal. 

The Webmap Client can also run independent, but no installer support is added at the moment.

Following the next steps to install the Webmap Client without the portal:

- Checkout the project and build project with maven command:
	```
	mvn clean install
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
- Create a directory "WebMapClient" with subdirectory "data" on your disk.
- Create the directories "downloads", "tmp", "users" and "wms" as subdirectories of the "data" directory.
- Go to the project and copy the file "ingrid-webmap-client\_config.xml" from "/src/main/resources" to the "data" directory.
- On the same directory "src/main/resources" edit the file "application.properties" with the changes above.

	 ```
	 administration.file = <WebMapClient>/data/ingrid-webmap-client_config.xml
	 frontend.sessionDir = <WebMapClient>/data/tmp
	 mapdownload.dir = <WebMapClient>/data/downloads
	 frontend.userDataDir = <WebMapClient>/data/users
	 wms.dir = <WebMapClient>/data/wms
	 ```
- Start the tomcat. 
- Open a browser and enter following URL:

	```
	Admin:
	http://localhost:8080/ingrid-webmap-client/admin/
	
	Frontend:
	http://localhost:8080/ingrid-webmap-client/frontend/
	```

Obtain further information at http://www.ingrid-oss.eu/


Contribute
----------

- Issue Tracker: https://github.com/informationgrid/ingrid-webmap-client/issues
- Source Code: https://github.com/informationgrid/ingrid-webmap-client
 
### Set up eclipse project

```
mvn eclipse:eclipse clean install
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
