/*-
 * **************************************************-
 * InGrid Map Client
 * ==================================================
 * Copyright (C) 2014 - 2021 wemove digital solutions GmbH
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
package de.ingrid.mapclient.login;

import java.io.File;
import java.util.Properties;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

import org.apache.log4j.Logger;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.utils.Utils;

public class LoginSessionListener implements HttpSessionListener {

    private static final Logger log = Logger.getLogger( LoginSessionListener.class );

    public void sessionCreated(HttpSessionEvent se) {
        if(log.isDebugEnabled()) {
            log.debug("Create session: " + se.getSession().getId());
        }
    }

    public void sessionDestroyed(HttpSessionEvent se) {
        String content = se.getSession().getId();
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        boolean isAdminLock = Boolean.parseBoolean(p.getProperty(ConfigurationProvider.ADMIN_LOCK));
        if(isAdminLock) {
            String filePath = p.getProperty(ConfigurationProvider.CONFIG_DIR);
            File file = new File( filePath, p.getProperty(ConfigurationProvider.ADMIN_LOCK_FILE) );
            if(file.exists()) {
                String fileContent = Utils.getFileContent(filePath, p.getProperty(ConfigurationProvider.ADMIN_LOCK_FILE), "", "");
                if(fileContent.equals(content)) {
                    Utils.removeFile(p.getProperty(ConfigurationProvider.ADMIN_LOCK_FILE));
                    if(log.isDebugEnabled()) {
                        log.debug("Delete lock file for session: " + se.getSession().getId());
                    }
                }
            }
        }
    }
}
