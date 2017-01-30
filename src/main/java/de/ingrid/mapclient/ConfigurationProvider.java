/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2017 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
package de.ingrid.mapclient;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * ConfigurationProvider gives access to the configuration of the map client.
 * The application configuration consists of two parts:
 *
 * - static: Static configuration is stored in the application.properties file
 *           and is read-only. It is retrieved via the
 *           ConfigurationProvider.getProperties() method and consists of key value pairs.
 * - dynamic: Dynamic configuration is stored in an xml file, that is defined in
 *           the static property named "administration.file". It is retrieved via the
 *           ConfigurationProvider.getConfiguration() method and stored via the
 *           ConfigurationProvider.write() method. The map client provides an
 *           administration frontend for managing the dynamic configuration.
 * 
 * @author ingo@wemove.com
 */
public enum ConfigurationProvider {

    // singleton instance
    INSTANCE;

    private static final String APPLICATION_PROPERTIES = "application.properties";
    public static final String OPENSEARCH_URL = "opensearch.searchurl";
    public static final String FEEDBACK_FROM = "feedback.from";
    public static final String FEEDBACK_TO = "feedback.to";
    public static final String FEEDBACK_HOST = "feedback.host";
    public static final String FEEDBACK_PORT = "feedback.port";
    public static final String FEEDBACK_USER = "feedback.user";
    public static final String FEEDBACK_PASSWORD = "feedback.password";
    public static final String FEEDBACK_SSL = "feedback.ssl";
    public static final String FEEDBACK_PROTOCOL = "feedback.protocol";
    public static final String KML_DIRECTORY = "kml.directory";
    public static final String KML_MAX_DAYS_FILE_EXIST = "kml.days_of_exist";
    public static final String KML_MAX_DIRECTORY_FILES = "kml.max_directory_files";
    
    private Properties properties = null;

    /**
     * Get the application properties.
     * 
     * @return Properties
     * @throws IOException
     */
    public Properties getProperties() throws IOException {
        if (this.properties == null) {
            this.properties = new Properties();
            InputStream inputStream = ConfigurationProvider.class.getClassLoader().getResourceAsStream( APPLICATION_PROPERTIES );
            this.properties.load( inputStream );
        }
        return this.properties;
    }
}
