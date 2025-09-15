#!/bin/sh

if [ "$SERVER_CONNECTOR_ATTR" ]; then
    echo "Update connector attributes"
    sed -i -e "s@redirectPort=\"8443\" />@redirectPort=\"8443\" ${SERVER_CONNECTOR_ATTR} />@" conf/server.xml
fi

exec "$@"
