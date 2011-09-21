Configuration:
--------------

- Move WEB-INF\classes\ingrid_webmap_client_config.xml to a place where your configuration is save.
This is the file where dynamic configuration that is managed in the administration interface is stored.

- Edit WEB-INF\classes\application.properties so that it points to your configuration file
e.g.
administration.file = c:/temp/ingrid_webmap_client_config.xml
also specify other directories
e.g.
frontend.sessionDir = c:/temp/data/
