/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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
package de.ingrid.mapclient.scheduler;

import java.util.Properties;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.scheduler.tasks.CapabilitiesUpdateTask;
import it.sauronsoftware.cron4j.Scheduler;

public class MapClientScheduler implements ServletContextListener {
    private Scheduler scheduler = null;

    public void contextInitialized(ServletContextEvent event) {
        String pattern = "*/5 * * * *";
        
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_pattern = p.getProperty( ConfigurationProvider.SCHEDULER_UPDATE_LAYER);
        if(config_pattern != null){
            pattern = config_pattern;
        }
        
        scheduler = new Scheduler();
        scheduler.schedule(pattern, new CapabilitiesUpdateTask());
        scheduler.start();
    }

    public void contextDestroyed(ServletContextEvent event) {
        scheduler.stop();
        scheduler = null;
    }
}
