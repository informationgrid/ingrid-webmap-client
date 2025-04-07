FROM tomcat:9-jdk21-temurin

RUN chown -R ubuntu:ubuntu /usr/local/tomcat

USER ubuntu

EXPOSE 8080

COPY --chown=ubuntu:ubuntu ./docker/files/tomcat-9/tomcat-users.xml /usr/local/tomcat/conf/
COPY --chown=ubuntu:ubuntu ./docker/files/tomcat-9/server.xml /usr/local/tomcat/conf/
COPY --chown=ubuntu:ubuntu ./docker/files/tomcat-9/ingrid-webmap-client.xml /usr/local/tomcat/conf/Catalina/localhost/
COPY --chown=ubuntu:ubuntu ./target/ingrid-webmap-client.war /usr/local/tomcat/webapps/

CMD ["catalina.sh", "run"]