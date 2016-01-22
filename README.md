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
