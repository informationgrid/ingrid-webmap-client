/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
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
/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;

import com.thoughtworks.xstream.XStream;

import de.ingrid.mapclient.model.AreaCategory;
import de.ingrid.mapclient.model.Layer;
import de.ingrid.mapclient.model.MapArea;
import de.ingrid.mapclient.model.MapExtend;
import de.ingrid.mapclient.model.MapServiceCategory;
import de.ingrid.mapclient.model.Projection;
import de.ingrid.mapclient.model.Scale;
import de.ingrid.mapclient.model.ServiceCategory;
import de.ingrid.mapclient.model.Setting;
import de.ingrid.mapclient.model.WmsActiveService;
import de.ingrid.mapclient.model.WmsServer;
import de.ingrid.mapclient.model.WmsService;
import de.ingrid.mapclient.model.WmsServiceLayer;

/**
 * ConfigurationProvider gives access to the configuration of the map client.
 * The application configuration consists of two parts:
 *
 * - static: Static configuration is stored in the application.properties file and
 *           is read-only. It is retrieved via the ConfigurationProvider.getProperties()
 *           method and consists of key value pairs.
 * - dynamic: Dynamic configuration is stored in an xml file, that is defined in the
 *           static property named "administration.file". It is retrieved via the
 *           ConfigurationProvider.getConfiguration() method and stored via the
 *           ConfigurationProvider.write() method. The map client provides an administration
 *           frontend for managing the dynamic configuration.
 * 
 * @author ingo@wemove.com
 */
public enum ConfigurationProvider {

	// singleton instance
	INSTANCE;

	private static final String APPLICATION_PROPERTIES = "application.properties";
	private static final String CONFIGURATION_FILE_KEY = "administration.file";
	private static final String OPENSEARCH_URL = "opensearch.searchurl";
	private static final String DOWNLOAD_DIR = "mapdownload.dir";
	private static final String WMS_DIR = "wms.dir";
	

	private Properties properties = null;
	private Configuration configuration = null;
	private PersistentConfiguration persistentConfiguration = null;
	
	/**
	 * Constructor. Reads the configuration from disk.
	 */
	private ConfigurationProvider() {

		BufferedReader input = null;
		String xml = null;

		try {
			// get the configuration file name
			Properties props = this.getProperties();
			String configFile = props.getProperty(CONFIGURATION_FILE_KEY);
			File file = new File(configFile);

			// read the file content
			StringBuilder content = new StringBuilder();
			input = new BufferedReader(new InputStreamReader(new FileInputStream(file), "UTF-8"));
			String line = null;
			while((line = input.readLine()) != null) {
				content.append(line);
				content.append(System.getProperty("line.separator"));
			}
			input.close();
			input = null;

			// deserialize a temporary Configuration instance from xml
			xml = content.toString();
			XStream xstream = new XStream();
			this.setXStreamAliases(xstream);
			this.persistentConfiguration = (PersistentConfiguration)xstream.fromXML(xml); 
//			getConfigurationFromPersistentConfiguration();
			//we still need this for reading old styled configurations...
//			this.configuration = (Configuration)xstream.fromXML(xml);
//			getPersistentConfigurationFromConfiguration();			
		}
		catch (Exception e) {
			e.printStackTrace();
			throw new RuntimeException(e);
		}
		finally {
			if (input != null) {
				try {
					input.close();
				}
				catch (IOException e) {}
			}
		}
	}


	/**
	 * Write the given Configuration to the disc. To keep the time for modifying the actual configuration
	 * file as short as possible, the method writes the configuration into a temporary file first and then renames
	 * this file to the original configuration file name.
	 * Note: Since renaming a file is not atomic in Windows, if the target file exists already (we need to delete
	 * and then rename), this method is synchronized.
	 * @param configuration Configuration instance
	 * @throws IOException
	 */
	public synchronized void write(PersistentConfiguration configuration) throws IOException {

		// we dont want to store the old config style, since we compute it when we need it, but we have to save it 
		// because need it later on
		List<ServiceCategory> catList = null;
		if(configuration.getServiceCategories() != null){
			catList = configuration.getServiceCategories();
			configuration.setServiceCategories(null);
			
		}
		// serialize the Configuration instance to xml
		XStream xstream = new XStream();
		this.setXStreamAliases(xstream);
		String xml = xstream.toXML(configuration);

		// write the configuration to a temporary file first
		File tmpFile = File.createTempFile("config", null);
		BufferedWriter output = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(tmpFile.getAbsolutePath()),"UTF8"));
		try {
			output.write(xml);
			output.close();
			output = null;
		}
		finally {
			if (output != null) {
				output.close();
			}
		}
		// we put the serviceCats back into the persistentconfiguration
		configuration.setServiceCategories(catList);
		
		// move the temporary file to the configuration file
		Properties props = this.getProperties();
		String configFile = props.getProperty(CONFIGURATION_FILE_KEY);
		File file = new File(configFile);
		file.delete();
		boolean result = tmpFile.renameTo(file);
		if (!result) {
			throw new IOException("The configuration could not be stored. (Rename '" + tmpFile.getAbsolutePath() + "' to '" + file.getAbsolutePath() + "' failed.)");
		}
	}

	/**
	 * Get the application properties.
	 * @return Properties
	 * @throws IOException
	 */
	public Properties getProperties() throws IOException {
		if (this.properties == null) {
			this.properties = new Properties();
			InputStream inputStream = ConfigurationProvider.class.getClassLoader().getResourceAsStream(APPLICATION_PROPERTIES);
			this.properties.load(inputStream);
		}
		return this.properties;
	}
	/**
	 * Get the opensearch url only
	 * @return String
	 */
	public String getOpensearchUrl(){
		return this.properties.getProperty(OPENSEARCH_URL);
	}
	/**
	 * Get the mapdir only
	 * @return String
	 */
	public String getDownloadmapDir(){
		return this.properties.getProperty(DOWNLOAD_DIR);
	}	

	public String getWMSDir(){
    	return this.properties.getProperty(WMS_DIR);
    }
	
	/**
	 * Get the map client configuration
	 * @return Configuration
	 */
	public Configuration getConfiguration() {
		return this.configuration;
	}
	/**
	 * Get the map client persistentConfiguration
	 * @return Configuration
	 */
	public PersistentConfiguration getPersistentConfiguration() {
		return this.persistentConfiguration;
	}

	/**
	 * Set the xml aliases for model classes
	 * @param xstream XStream instance
	 */
	private void setXStreamAliases(XStream xstream) {
		// some of these tags are obsolete, since they represent the old way of storing
		// a config, but we might come across one, so we keep them erstmal
		xstream.alias("persistentConfiguration", PersistentConfiguration.class);
		xstream.alias("layer", Layer.class);
		xstream.alias("mapExtend", MapExtend.class);
		xstream.alias("projection", Projection.class);
		xstream.alias("scale", Scale.class);
		xstream.alias("setting", Setting.class);
		xstream.alias("mapServiceCategory", MapServiceCategory.class);
		xstream.alias("wmsService", WmsService.class);
		xstream.alias("areaCategory", AreaCategory.class);
		xstream.alias("area", MapArea.class);
		xstream.alias("name", String.class);
		xstream.alias("originalCapUrl", String.class);
		xstream.alias("idx", Integer.class);
		xstream.alias("checkedLayers", String.class);
		xstream.alias("configuration", Configuration.class);
		xstream.alias("serviceCategory", ServiceCategory.class);
		xstream.alias("service", WmsServer.class);
		xstream.alias("wmsActiveService", WmsActiveService.class);
		xstream.alias("wmsActiveServiceLayer", WmsServiceLayer.class);
		


	}
	/**
	 * since we still use the old way of having a configuration(the map basically relies on it)
	 * we do need a method to transfer all the configuration params of the new way of persisting them 
	 */
	private void getConfigurationFromPersistentConfiguration() {

		this.configuration = new Configuration();
		this.configuration.setWmsCapUrl(this.persistentConfiguration.getWmsCapUrl());
		this.configuration.setFeatureUrl(this.persistentConfiguration.getFeatureUrl());
		this.configuration.setLayers(this.persistentConfiguration.getLayers());
		this.configuration.setMapExtend(this.persistentConfiguration.getMapExtend());
		this.configuration.setProjections(this.persistentConfiguration.getProjections());
		this.configuration.setScales(this.persistentConfiguration.getScales());
		this.configuration.setSettings(this.persistentConfiguration.getSettings());
		this.configuration.setProxyUrl(this.persistentConfiguration.getProxyUrl());
		this.configuration.setAreaCategeories(this.persistentConfiguration.getAreaCategories());
		
		ListIterator<MapServiceCategory> it = this.persistentConfiguration.getMapServiceCategories().listIterator();
		List<ServiceCategory> serviceCategories = new ArrayList<ServiceCategory>();

		Map<MapServiceCategory,ServiceCategory> serviceMap = new HashMap<MapServiceCategory,ServiceCategory>();
		//we iterate over the service cats in the persistentconf, we set the categories of the (old) conf
		//we already build a hashmap where we store the categories as key, we later insert the corresponding services
		//this is done so we already have a list of the services, which we pass to the corresponding category in the old config
		while(it.hasNext()){
			MapServiceCategory mapSerCat = it.next();
			serviceCategories.add(new ServiceCategory(mapSerCat.getName(),new ArrayList<ServiceCategory>(), null));
			ListIterator<MapServiceCategory> ItMapServ = mapSerCat.getMapServiceCategories().listIterator();
			// we have to check the subcategories
			while(ItMapServ.hasNext()){
				MapServiceCategory mapSubServiceCat = ItMapServ.next();
				int i = it.previousIndex();
				ServiceCategory sC = new ServiceCategory(mapSubServiceCat.getName(),null, new ArrayList<WmsServer>());
				serviceCategories.get(i).getServiceCategories().add(sC);
				serviceMap.put(mapSubServiceCat,sC);
			}
			
		}

		//we iterate over the services, we check each category of a service and make a new WmsServer(service) object
		//which we add to the hashmap
		ListIterator<WmsService> wmsIt = this.persistentConfiguration.getWmsServices().listIterator();
		while(wmsIt.hasNext()){
			WmsService service = wmsIt.next();
			Iterator<MapServiceCategory> itMap = service.getMapServiceCategories().iterator();
			while(itMap.hasNext()){
			serviceMap.get(itMap.next()).getServices().add(new WmsServer(service.getName(), service.getCapabilitiesUrl()));
			}
		}
		//TODO at this point we set the old serviceCategories in the persistentConfiguration,
		//since we still need them in the admin interface
		this.persistentConfiguration.setServiceCategories(serviceCategories);		
		
		//we set the categories, containing the services, in the configuration
		this.configuration.setServiceCategories(serviceCategories);

	}
	/**
	 * this method is hopefully only a temporary measure, right now we need, it to 
	 * be able to transform an old config into a new one, which for storing is important since
	 * we as of now dont have a method to administer the data with the new model	
	 */
	public void getPersistentConfigurationFromConfiguration() {

		this.persistentConfiguration = new PersistentConfiguration();
		this.persistentConfiguration.setWmsCapUrl(this.configuration.getWmsCapUrl());
		this.persistentConfiguration.setFeatureUrl(this.configuration.getFeatureUrl());
		this.persistentConfiguration.setLayers(this.configuration.getLayers());
		this.persistentConfiguration.setMapExtend(this.configuration.getMapExtend());
		this.persistentConfiguration.setProjections(this.configuration.getProjections());
		this.persistentConfiguration.setScales(this.configuration.getScales());
		this.persistentConfiguration.setSettings(this.configuration.getSettings());
		this.persistentConfiguration.setProxyUrl(this.configuration.getProxyUrl());
		this.persistentConfiguration.setAreaCategeories(this.configuration.getAreaCategories());
		//TODO at this point we set the old serviceCategories in the persistentConfiguration,
		//since we still need them in the admin interface
		this.persistentConfiguration.setServiceCategories(this.configuration.getServiceCategories());			
	
		
		
		
		ListIterator<ServiceCategory> it = this.configuration.getServiceCategories().listIterator();
		List<MapServiceCategory> mapServiceCategories = new ArrayList<MapServiceCategory>();

		Map<ServiceCategory,MapServiceCategory> serviceMap = new HashMap<ServiceCategory,MapServiceCategory>();
		//we iterate over the service cats in the persistentconf, we set the categories of the (old) conf
		//we already build a hashmap where we store the categories as key, we later insert the corresponding services
		//this is done so we already have a list of the services, which we pass to the corresponding category in the old config
		int id = 0;
		while(it.hasNext()){
		    ServiceCategory serCat = it.next();
		    mapServiceCategories.add(new MapServiceCategory(serCat.getName(),new ArrayList<MapServiceCategory>(), id++));
			ListIterator<ServiceCategory> ItServ = serCat.getServiceCategories().listIterator();
			// we have to check the subcategories
			while(ItServ.hasNext()){
				ServiceCategory subServiceCat = ItServ.next();
				int i = it.previousIndex();
				MapServiceCategory msC = new MapServiceCategory(subServiceCat.getName(),null, id++);
				mapServiceCategories.get(i).getMapServiceCategories().add(msC);
				serviceMap.put(subServiceCat,msC);
			}
			
		}
		
		Iterator<Entry<ServiceCategory,MapServiceCategory>> Its = serviceMap.entrySet().iterator();
		List<WmsService> wmsServices = new ArrayList<WmsService>();
		while(Its.hasNext()){
			 Map.Entry<ServiceCategory,MapServiceCategory> pairs = Its.next();
			 ServiceCategory sC = pairs.getKey();
			 MapServiceCategory msC = pairs.getValue();
			 Iterator<WmsServer> itServices = sC.getServices().iterator();
			 while(itServices.hasNext()){
				 WmsServer service = itServices.next();
				 //check if the service is already in the list
				 Iterator<WmsService> itList = wmsServices.iterator();
				 boolean isIn = false;
				 WmsService wmsServ = null;
				 while(itList.hasNext()){
					 wmsServ = itList.next();
					 if(wmsServ.getCapabilitiesUrl().equals(service.getCapabilitiesUrl())){
						 isIn = true;
						 break;
					 }		
				 }
				 
				 if(isIn){
					wmsServ.getMapServiceCategories().add(msC);
				 }
				 else{
					 WmsService wmsService = new WmsService(service.getName(), service.getCapabilitiesUrl(), null, new ArrayList<MapServiceCategory>(), null, new ArrayList<String>(), null, null, WmsService.WMSSERVICE_OFF, "aus", false);
					 wmsService.getMapServiceCategories().add(msC);
					 wmsServices.add(wmsService);
				 }
			 }
				 
		}

//		//we set the categories, containing the services, in the configuration
		this.persistentConfiguration.setMapServiceCategories(mapServiceCategories);
		this.persistentConfiguration.setWmsServices(wmsServices);
		List<WmsActiveService> wmsActiveServices = new ArrayList<WmsActiveService>();
		this.persistentConfiguration.setWmsActiveServices(wmsActiveServices);
	}	

}
