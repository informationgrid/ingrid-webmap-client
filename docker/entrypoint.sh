#!/bin/sh

THEME=${THEME:-false}

TOMCAT_HOME=/usr/local/tomcat
MAPCLIENT_HOME="$TOMCAT_HOME/webapps/ingrid-webmap-client"
MAPCLIENT_THEME_HOME="$MAPCLIENT_HOME/WEB-INF/themes/$THEME"

if [ "$SERVER_CONNECTOR_ATTR" ]; then
    echo "Update connector attributes"
    sed -i -e "s@<Connector port=\"8080\" protocol=\"HTTP/1.1\"@<Connector port=\"8080\" ${SERVER_CONNECTOR_ATTR} protocol=\"HTTP/1.1\"@" conf/server.xml
fi

# Change admin password for mapclient admin GUI if MAPCLIENT_ADMIN_PW is define
if [ "$MAPCLIENT_ADMIN_PW" ]; then
    echo "Update mapclient admin password"
    sed -i 's|password="8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" roles="admin-gui|password="'${MAPCLIENT_ADMIN_PW}'" roles="admin-gui|' conf/tomcat-users.xml
fi

if [ "$THEME" = "false" ]; then
    echo "No theme process."
else
    echo "Theme process: $THEME"
    echo "Path: $MAPCLIENT_THEME_HOME"
    if [ -d "$MAPCLIENT_THEME_HOME" ]; then
        echo "Theme exists."
        cd "$MAPCLIENT_THEME_HOME"
        cp -rf "$MAPCLIENT_THEME_HOME"/* "$MAPCLIENT_HOME"
        if [ -d "$MAPCLIENT_THEME_HOME/frontend/src" ]; then
            cp -rf "$MAPCLIENT_THEME_HOME/frontend/src" "$MAPCLIENT_HOME/frontend/prd"
        fi
    else
        echo "Theme not exists."
    fi
fi

exec "$@"
