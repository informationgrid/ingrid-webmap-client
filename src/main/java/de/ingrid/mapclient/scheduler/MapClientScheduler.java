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
 			if(setting.getKey().equals("defaultCronPatternUpdateCapabilities")){
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
