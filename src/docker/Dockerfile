FROM tomcat:9-jdk21-temurin

EXPOSE 8080

ADD ./files/tomcat-9/tomcat-users.xml /usr/local/tomcat/conf/
ADD ./files/tomcat-9/server.xml /usr/local/tomcat/conf/
ADD ./files/tomcat-9/ingrid-webmap-client.xml /usr/local/tomcat/conf/Catalina/localhost/

COPY ingrid-webmap-client.war /usr/local/tomcat/webapps/

COPY ./entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

CMD ["catalina.sh", "run"]