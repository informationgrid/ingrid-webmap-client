#!/bin/sh

if [ "$SERVER_CONNECTOR_ATTR" ]; then
    echo "Update connector attributes"
    sed -i -e "s@<Connector port=\"8080\" protocol=\"HTTP/1.1\"@<Connector port=\"8080\" ${SERVER_CONNECTOR_ATTR} protocol=\"HTTP/1.1\"@" conf/server.xml
fi

# Change admin password for mapclient admin GUI if MAPCLIENT_ADMIN_PW is define
if [ "$MAPCLIENT_ADMIN_PW" ]; then
    echo "Update mapclient admin password"
    sed -i 's|password="8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" roles="admin-gui|password="'${MAPCLIENT_ADMIN_PW}'" roles="admin-gui|' conf/tomcat-users.xml
fi

exec "$@"
