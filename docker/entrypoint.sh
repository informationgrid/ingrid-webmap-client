#!/bin/sh

if [ "$SERVER_CONNECTOR_ATTR" ]; then
    echo "Update connector attributes"
    sed -i -e "s@<Connector port=\"8080\" protocol=\"HTTP/1.1\"@<Connector port=\"8080\" protocol=\"HTTP/1.1\" ${SERVER_CONNECTOR_ATTR}@" conf/server.xml
fi

exec "$@"
