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

import it.sauronsoftware.cron4j.Scheduler;

import java.util.ArrayList;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.PersistentConfiguration;
import de.ingrid.mapclient.model.Setting;
import de.ingrid.mapclient.scheduler.tasks.CapabilitiesUpdateTask;

public class MapClientScheduler implements ServletContextListener {
	private Scheduler scheduler = null;

	public void contextInitialized(ServletContextEvent event) {
		String pattern = "* * * * *";
		
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		PersistentConfiguration pc = p.getPersistentConfiguration();
 		ArrayList<Setting> settings = (ArrayList<Setting>) pc.getSettings();
 		for(int i=0; i < settings.size(); i++){
 			Setting setting = settings.get(i);
 			if(setting.getKey().equals("urlCheckCronPatternUpdateCapabilities")){
 				pattern = setting.getValue();
 				break;
 			}
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
