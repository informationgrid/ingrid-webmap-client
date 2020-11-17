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