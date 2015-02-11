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

Installation
------------

Integrated in the InGrid portal. 

The Webmap Client can also run independent, but no installer support is added at the moment.

Following the next steps to install the Webmap Client without the portal:

* Create a folder to "WebMapClient" with subfolder "data" on your disk.
* Create the folder "downloads", "tmp", "users" and "wms" as subfolders of the "data" folder.
* Goto the project and copy the file "ingrid-webmap-client\_config.xml" under "<PROJECT\_PATH>/src/main/resources" to the "data" folder.

- On the same folder "src/main/resources" edit the file "application.properties" 

	 ```
	 administration.file = 
	 
	 frontend.sessionDir = 
	 
	 mapdownload.dir = 
	 
	 frontend.userDataDir =
	 
	 wms.dir =
	 ```
	 	

Obtain further information at https://dev.informationgrid.eu/


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

- Install a local apache tomcat (version >= 6.0.35)
- Add to your eclipse the tomcat plugin "com.sysdeo.eclipse.tomcat_3.3.1" to start/stop the installed local tomcat from eclipse. (see http://www.eclipsetotale.com/tomcatPlugin.html#A3)
- After restart your eclipse goto "Window -> Preferences -> Tomcat" and select the path of your installed tomcat.
- On your installed tomcat add the the configuration "ingrid-webmap-client.xml" for the project under "conf/Catalina/localhost".
- Add the following content to the configuration file:

```
<Context path="/ingrid-webmap-client"
         docBase="<PROJECT\_PATH>\target\ingrid-webmap-client"
         workDir="<PROJECT\_PATH>\work"
         crossContext="true">
</Context>
```

- Start the tomcat with the added eclipse plugin. 
- Open a browser and enter following URL:

```
Admin:

http://localhost:8080/ingrid-webmap-client/admin/

Frontend:

http://localhost:8080/ingrid-webmap-client/frontend/
```

Support
-------

If you are having issues, please let us know: info@informationgrid.eu

License
-------

The project is licensed under the EUPL license.
