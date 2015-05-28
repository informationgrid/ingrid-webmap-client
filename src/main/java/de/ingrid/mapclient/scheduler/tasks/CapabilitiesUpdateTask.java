/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
			if(service.getCapabilitiesUpdateFlag() != null && !service.getCapabilitiesUpdateFlag().equals("aus")){
				try {
					String response = HttpProxy.doRequest(originalCapUrl);
					if(response.indexOf("<Service>") < 0){
						throw new Exception();
					}
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
							if(!service.getCapabilitiesHashUpdate().equals(service.getCapabilitiesHash()) || service.getCapabilitiesUpdateImage().equals(WmsService.WMSSERVICE_OFFLINE)){
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
										// Update image
										service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_UPDATE);
										
										// Send mail to admin
										String from = ""; 
										String to = ""; 
										String text = "";
										String host = "";
										String emailSubject = "";
										String port = "";
										String user = "";
										String password = "";
										String protocol = "";
										boolean ssl = false;
										
										// Get mail configuration
										for(int s=0; s < settings.size(); s++){
											Setting setting = settings.get(s);
											
											if(from != "" && to != "" & host != "" && emailSubject != "" && text != ""){
												break;
											}
											
											if(setting.getKey().equals("urlCheckMailAddressFrom")){
												from = setting.getValue();
											}else if(setting.getKey().equals("urlCheckMailAddressTo")){
												to = setting.getValue();
											}else if(setting.getKey().equals("urlCheckMailHost")){
												host = setting.getValue();
											}else if(setting.getKey().equals("urlCheckMailUpdateSubject")){
												emailSubject = setting.getValue();
											}else if(setting.getKey().equals("urlCheckMailUpdateText")){
												text = setting.getValue();
												text = text.concat("\r\n" + service.getName() + " (" + service.getOriginalCapUrl() + ")");
											}else if(setting.getKey().equals("urlCheckMailPort")){
												port = setting.getValue();
											}else if(setting.getKey().equals("urlCheckMailUser")){
												user = setting.getValue();
											}else if(setting.getKey().equals("urlCheckMailPassword")){
												password = setting.getValue();
											}else if(setting.getKey().equals("urlCheckMailSSL")){
												ssl = Boolean.getBoolean(setting.getValue());
											}else if(setting.getKey().equals("urlCheckMailProtocol")){
												protocol = setting.getValue();
											}
										}
										
										// Send mail
										boolean isMailSend = Utils.sendEmail(from, emailSubject, new String[] { to }, text, null, host, port, user, password, ssl, protocol);
										if(isMailSend){
											// Set mail status to send
											service.setCapabilitiesUpdateMailStatus(true);
										}
									}
								}else if(updateFlag.equals("an")){
									doServiceChange = true;
									// Update "capabilitiesHashUpdate" value
									service.setCapabilitiesHashUpdate(capabilitiesHashCode);
									// Update "capabilitiesHash" value
									service.setCapabilitiesHash(capabilitiesHashCode);
									// Update image
									service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_OK);	
									// Update capabilities copy and orgCopy
									if(!service.getCapabilitiesHashUpdate().equals(service.getCapabilitiesHash())){
										CapabilitiesUtils.updateCapabilities(response, service);
									}
									
									log.info("Update capabilities '" + service.getName() + "' with url: " + originalCapUrl);
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
					
					if(service.getCapabilitiesUpdateImage() == null || (!service.getCapabilitiesUpdateImage().equals(WmsService.WMSSERVICE_OFFLINE) && !service.getCapabilitiesUpdateImage().equals(WmsService.WMSSERVICE_OFF))){
						doServiceChange = true;
						service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_OFFLINE);
					}
				}
			}
			
			// Save service to settings
			try {
				// Add update boolean if not exist
				if(service.getCapabilitiesUpdateFlag() == null){
					doServiceChange = true;
					service.setCapabilitiesUpdateFlag("an");
				}else if(service.getCapabilitiesUpdateFlag().equals("none")){
					doServiceChange = true;
					service.setCapabilitiesUpdateFlag("aus");
					service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_OFF);
				}else if(service.getCapabilitiesUpdateFlag().equals("auto")){
					doServiceChange = true;
					service.setCapabilitiesUpdateFlag("an");
				}else if(service.getCapabilitiesUpdateFlag().equals("aus")){
					if(!service.getCapabilitiesUpdateImage().equals(WmsService.WMSSERVICE_OFF)){
						doServiceChange = true;
						service.setCapabilitiesUpdateFlag("aus");
						service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_OFF);
					}
				}
				
				if(service.getCapabilitiesUpdateMailStatus() == null){
					doServiceChange = true;
					service.setCapabilitiesUpdateMailStatus(false);
				}
				
				if(service.getCapabilitiesUpdateImage() == null){
					doServiceChange = true;
					service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_OK);
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
