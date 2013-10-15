package de.ingrid.mapclient.scheduler.tasks;

import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.PersistentConfiguration;
import de.ingrid.mapclient.model.Setting;
import de.ingrid.mapclient.model.WmsService;
import de.ingrid.mapclient.utils.CapabilitiesUtils;
import de.ingrid.mapclient.utils.Utils;
import de.ingrid.utils.xml.XPathUtils;

public class CapabilitiesUpdateTask implements Runnable{
	
	private static final Logger log = Logger.getLogger(CapabilitiesUpdateTask.class);

	public void run() {
		log.info("Update WebMapClient capabilitities ...");
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		PersistentConfiguration pc = p.getPersistentConfiguration();
		
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
									ArrayList<Setting> settings = (ArrayList<Setting>) pc.getSettings();
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
									log.info("Update capabilities '" + service.getName() + "' with url: " + originalCapUrl);
									// Update "capabilitiesHashUpdate" value
									service.setCapabilitiesHashUpdate(capabilitiesHashCode);
									// Update "capabilitiesHash" value
									service.setCapabilitiesHash(capabilitiesHashCode);
									// Update capabilities copy and orgCopy
									updateCapabilities(response, service);
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
	
	
	private void updateCapabilities(String response, WmsService service){
		String url;
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		String path = p.getWMSDir();
		
		try {
			// Get original copy xml file
			url = service.getCapabilitiesUrlOrg();
			String fileName = url.substring(url.lastIndexOf("/"), url.length());
			String [] splitFileName = fileName.split("\\?");
			File f = new File(path+splitFileName[0]);
			
			Document doc = stringToDoc(response);
			
			// Update new capabilities
			Document newDoc = updateCapabilititesDocument(doc, service);
			
			TransformerFactory tFactory = TransformerFactory.newInstance();
			Transformer transformer = tFactory.newTransformer();
			
			// Change the xml stucture for original copy
			DOMSource source = new DOMSource(newDoc);
			StreamResult result = new StreamResult(f);
			transformer.transform(source, result);
			
			// Get copy xml file
			url = service.getCapabilitiesUrl();
			fileName = url.substring(url.lastIndexOf("/"), url.length());
			splitFileName = fileName.split("\\?");
			f = new File(path+splitFileName[0]);
			
			//change the xml structure for copy
			source = new DOMSource(newDoc);
			result = new StreamResult(f);
			transformer.transform(source, result);
		}  catch (TransformerException e) {
			log.error("TransformerExceptionException on updating wms file: ",e);
		}
	}
	
	private Document updateCapabilititesDocument(Document doc, WmsService service){
			// Set actual service name to capabilities 
			if(service.getName() != null){
				Node titleNode = (Node) XPathUtils.getNode(doc, "//Service/Title");
				if(titleNode != null){
					titleNode.setTextContent(service.getName());
				}
			}
		return doc;
	}
	
	private Document stringToDoc(String value) {

		try {
	        DocumentBuilder db = DocumentBuilderFactory.newInstance().newDocumentBuilder();
	        InputSource is = new InputSource();
	        is.setCharacterStream(new StringReader(value));
	        Document doc = db.parse(is);
	        return doc;
		} catch (ParserConfigurationException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			e.printStackTrace();
		} catch (SAXException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			e.printStackTrace();
		} catch (IOException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			e.printStackTrace();
		}
        return null;
    }
}
