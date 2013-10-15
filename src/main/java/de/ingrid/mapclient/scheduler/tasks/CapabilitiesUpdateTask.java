package de.ingrid.mapclient.scheduler.tasks;

import java.io.IOException;
import java.util.ArrayList;

import org.apache.log4j.Logger;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.PersistentConfiguration;
import de.ingrid.mapclient.model.Setting;
import de.ingrid.mapclient.model.WmsService;
import de.ingrid.mapclient.utils.CapabilitiesUtils;
import de.ingrid.mapclient.utils.Utils;

public class CapabilitiesUpdateTask implements Runnable{
	
	private static final Logger log = Logger.getLogger(CapabilitiesUpdateTask.class);

	public void run() {
		log.info("Update WebMapClient capabilitities ...");
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		PersistentConfiguration pc = p.getPersistentConfiguration();
		ArrayList<Setting> settings = (ArrayList<Setting>) pc.getSettings();
		ArrayList<WmsService> services = (ArrayList<WmsService>) pc.getWmsServices();
		for(int i=0; i < services.size(); i++){
			boolean doServiceChange = false;
			WmsService service = services.get(i);
			String originalCapUrl = service.getOriginalCapUrl();
			
			// Get request of capabilitities
			try {
				String response = HttpProxy.doRequest(originalCapUrl);
				if(response != null){
					String capabilitiesHashCode = CapabilitiesUtils.generateMD5String(response);
					// Add hash code if not exist
					if(service.getCapabilitiesHashUpdate() == null){
						doServiceChange = true;
						service.setCapabilitiesHash("");
						service.setCapabilitiesHashUpdate(capabilitiesHashCode);
					}else if(service.getCapabilitiesHashUpdate() != null){
						service.setCapabilitiesHashUpdate(capabilitiesHashCode);
					}
					
					// Update capabilities automatically
					if(service.getCapabilitiesUpdateFlag() != null){
						if(!service.getCapabilitiesHashUpdate().equals(service.getCapabilitiesHash())){
							String updateFlag =  service.getCapabilitiesUpdateFlag();
							if(updateFlag.equals("mail")){
								if(service.getCapabilitiesUpdateMailStatus() == null){
									service.setCapabilitiesUpdateMailStatus(false);
								}
								// Check mail status
								if(!service.getCapabilitiesUpdateMailStatus()){
									log.info("Send mail for capabilities update: " + service.getOriginalCapUrl());
									// Update "capabilitiesHashUpdate" value
									service.setCapabilitiesHashUpdate(capabilitiesHashCode);
									// Send mail to admin
									String from = ""; 
									String to = ""; 
									String text = "";
									String host = "";
									String emailSubject = "";
									
									// Get mail configuration
									for(int s=0; s < settings.size(); s++){
										Setting setting = settings.get(s);
										
										if(from != "" && to != "" & host != "" && emailSubject != "" && text != ""){
											break;
										}
										
										if(setting.getKey().equals("defaultMailAddressFrom")){
											from = setting.getValue();
										}else if(setting.getKey().equals("defaultMailAddressTo")){
											to = setting.getValue();
										}else if(setting.getKey().equals("defaultMailHost")){
											host = setting.getValue();
										}else if(setting.getKey().equals("defaultMailUpdateSubject")){
											emailSubject = setting.getValue();
										}else if(setting.getKey().equals("defaultMailUpdateText")){
											text = setting.getValue();
											text = text.concat("\r\n" + service.getName() + " (" + service.getOriginalCapUrl() + ")");
										}
									}
									
									// Send mail
									boolean isMailSend = Utils.sendEmail(from, emailSubject, new String[] { to }, text, null, host);
									if(isMailSend){
										// Set mail status to send
										service.setCapabilitiesUpdateMailStatus(true);
									}
								}
							}else if(updateFlag.equals("auto")){
								if(!service.getCapabilitiesHashUpdate().equals(service.getCapabilitiesHash())){
									doServiceChange = true;
									// Update "capabilitiesHashUpdate" value
									service.setCapabilitiesHashUpdate(capabilitiesHashCode);
									// Update "capabilitiesHash" value
									service.setCapabilitiesHash(capabilitiesHashCode);
									// Update capabilities copy and orgCopy
									CapabilitiesUtils.updateCapabilities(response, service);
									
									log.info("Update capabilities '" + service.getName() + "' with url: " + originalCapUrl);
								}
							}
						}
					}
				}
			} catch (Exception e) {
				log.info("Update failed for (offline) capabilities '" + service.getName() + "' with url: " + originalCapUrl);
				// Set hash code update value to empty (flag for offline)
				if(service.getCapabilitiesHashUpdate() == null){
					doServiceChange = true;
					service.setCapabilitiesHashUpdate("");
				}
			}
			
			// Save service to settings
			try {
				// Add update boolean if not exist
				if(service.getCapabilitiesUpdateFlag() == null){
					doServiceChange = true;
					service.setCapabilitiesUpdateFlag("auto");
				}
				
				if(service.getCapabilitiesUpdateMailStatus() == null){
					doServiceChange = true;
					service.setCapabilitiesUpdateMailStatus(false);
				}
				
				if(doServiceChange){
					ConfigurationProvider.INSTANCE.write(ConfigurationProvider.INSTANCE.getPersistentConfiguration());
				}

			} catch (IOException e) {
				log.error("Error update service settings for capabilities: " + originalCapUrl);
			}
		}
		log.info("Update WebMapClient capabilitities finished.");
	}
}
