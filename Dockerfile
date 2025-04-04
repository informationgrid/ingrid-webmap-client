FROM tomcat:9-jdk21-temurin

EXPOSE 8080

ADD ./docker/files/tomcat-9/tomcat-users.xml /usr/local/tomcat/conf/
ADD ./docker/files/tomcat-9/server.xml /usr/local/tomcat/conf/
ADD ./docker/files/tomcat-9/ingrid-webmap-client.xml /usr/local/tomcat/conf/Catalina/localhost/
ADD ./target/ingrid-webmap-client.war /usr/local/tomcat/webapps/

COPY ./docker/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

CMD ["catalina.sh", "run"]