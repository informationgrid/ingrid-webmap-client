/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.json.JsonHierarchicalStreamDriver;
import com.thoughtworks.xstream.io.json.JsonWriter;

import de.ingrid.mapclient.Configuration;
import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.PersistentConfiguration;
import de.ingrid.mapclient.model.AreaCategory;
import de.ingrid.mapclient.model.Layer;
import de.ingrid.mapclient.model.MapArea;
import de.ingrid.mapclient.model.MapExtend;
import de.ingrid.mapclient.model.MapServiceCategory;
import de.ingrid.mapclient.model.Projection;
import de.ingrid.mapclient.model.Scale;
import de.ingrid.mapclient.model.Setting;
import de.ingrid.mapclient.model.WmsActiveService;
import de.ingrid.mapclient.model.WmsService;
import de.ingrid.mapclient.model.WmsServiceLayer;
import de.ingrid.mapclient.url.impl.DbUrlMapper;
import de.ingrid.mapclient.utils.CapabilitiesUtils;
import de.ingrid.utils.xml.XPathUtils;

/**
 * ConfigurationResource gives access to the application configuration
 * (@see ConfigurationProvider class).
 *
 * The static configuration is retrieved via the GET "/config/static" url and consists
 * of key value pairs. The dynamic configuration is retrieved via the GET "/config/dynamic" url
 * and is an object. Each attribute of the dynamic configuration may be modified
 * via the POST "/config/dynamic/XXX" url.
 * 
 * @author ingo@wemove.com
 */
@Path("/config")
public class ConfigurationResource {

	private static final Logger log = Logger.getLogger(ConfigurationResource.class);

	/**
	 * Path to static configuration properties
	 */
	private static final String STATIC_PATH = "static";

	/**
	 * Path to dynamic configuration properties
	 */
	private static final String DYNAMIC_PATH = "dynamic";
	
	/**
	 * Path to dynamic persistentconfiguration properties
	 */
	private static final String PERS_DYNAMIC_PATH = "persdynamic";

	/**
	 * Key in application properties whose value contains public properties
	 */
	private static final String PUBLIC_PROPERTIES_KEY = "public.properties";
	
	/**
	 * Path for copying a service
	 */
	private static final String COPY_SERVICE = "copyservice";

	/**
	 * Path for adding a service
	 */
	private static final String ADD_SERVICE = "addservice";

	/**
	 * Path for adding a service
	 */
	private static final String ADD_COPY_SERVICE = "addServiceOrgCopy";
	
	/**
	 * Path for reload a service
	 */
	private static final String RELOAD_SERVICE = "reloadservice";
	
	/**
	 * Path for refresh a service
	 */
	private static final String REFRESH_SERVICE = "refreshservice";

	/**
	 * Path for editing a service
	 */
	private static final String UPDATE_SERVICE = "updateservice";
	
	/**
	 * Path for removing a service
	 */
	private static final String REMOVE_SERVICE = "removeservice";	
	
	/**
	 * Path for getting a service
	 */
	private static final String GET_SERVICE = "getservice";
	
	/**
	 * Get the static application configuration
	 * @return String
	 */
	@GET
	@Path(STATIC_PATH)
	@Produces(MediaType.APPLICATION_JSON)
	public Response getProperties(@Context HttpServletRequest req) {
		try {
			String json = "";
			Properties properties = ConfigurationProvider.INSTANCE.getProperties();
			if (properties.containsKey(PUBLIC_PROPERTIES_KEY)) {
				List<String> publicPropertyNames = Arrays.asList(properties.getProperty(PUBLIC_PROPERTIES_KEY).
						replaceAll("\\s", "").split(","));

				// filter public properties
				Properties publicProperties = new Properties();
				for (Entry<Object, Object> property : properties.entrySet()) {
					if (publicPropertyNames.contains(property.getKey())) {
						publicProperties.put(property.getKey(), property.getValue());
					}
				}

				XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
					@Override
					public HierarchicalStreamWriter createWriter(Writer writer) {
						return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
					}
				});
				json = xstream.toXML(publicProperties);
			}
			return Response.ok(json).build();
		}
		catch (Exception ex) {
			log.error("Error retrieving static application configuration", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Get the dynamic application configuration
	 * @return String
	 */
	@GET
	@Path(DYNAMIC_PATH)
	@Produces(MediaType.APPLICATION_JSON)
	public Response getConfiguration() {
		try {
			Configuration configuration = ConfigurationProvider.INSTANCE.getConfiguration();
			XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
				@Override
				public HierarchicalStreamWriter createWriter(Writer writer) {
					return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
				}
			});
			String json = xstream.toXML(configuration);
			return Response.ok(json).build();
		}
		catch (Exception ex) {
			log.error("Error retrieving dynamic application configuration", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
	/**
	 * Get the dynamic application persistentconfiguration
	 * @return String
	 */
	@GET
	@Path(PERS_DYNAMIC_PATH)
	@Produces(MediaType.APPLICATION_JSON)
	public Response getPersistentConfiguration() {
		try {
			PersistentConfiguration persistentconfiguration = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
				@Override
				public HierarchicalStreamWriter createWriter(Writer writer) {
					return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
				}
			});
			xstream.setMode(XStream.NO_REFERENCES);
			String json = xstream.toXML(persistentconfiguration);
			return Response.ok(json).build();
		}
		catch (Exception ex) {
			log.error("Error retrieving dynamic application configuration", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
	
	/**
	 * Set the default map layer names
	 * @param String containing a JSON encoded array of layer objects
	 */
	@POST
	@Path(DYNAMIC_PATH+"/saveDefaultSettings")
	@Consumes(MediaType.TEXT_PLAIN)
	public void saveDefaultSettings(String settings, @Context HttpServletRequest req) {
		
		try {
			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			JSONObject jsonSettings = new JSONObject(settings);
			
			// Save baselayer
			if(jsonSettings.get("selectedLayers") != JSONObject.NULL){
				// convert json string to List<String>
				JSONArray layersTmp = new JSONArray(jsonSettings.get("selectedLayers").toString());
				
				List<Layer> layers = new ArrayList<Layer>();
				for (int i=0, count=layersTmp.length(); i<count; i++) {
					JSONObject layerObj = layersTmp.getJSONObject(i);
					Layer layer = new Layer(layerObj.getString("name"), layerObj.getBoolean("isBaseLayer"));
					layers.add(layer);
				}
				
				config.setLayers(layers);
			}
			
			// Save feature URL
			if(jsonSettings.get("featureUrl") != JSONObject.NULL){
				config.setFeatureUrl(jsonSettings.get("featureUrl").toString());	
			}
			
			// Save copyright
			if(jsonSettings.get("copyrightValue") != JSONObject.NULL){
				config.setWmsCopyright(jsonSettings.get("copyrightValue").toString());	
			}
			
			if(jsonSettings.get("capUrl") != JSONObject.NULL){
				config.setWmsCapUrl(jsonSettings.get("capUrl").toString());
			}
			
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting default map layers", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Set the default map extend
	 * @param String containing a JSON encoded object with keys north, south, west, east
	 */
	@POST
	@Path(DYNAMIC_PATH+"/mapExtend")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setMapExtend(String mapExtendStr, @Context HttpServletRequest req) {
		try {
			// convert json string to MapExtend
			JSONObject mapExtendTmp = new JSONObject(mapExtendStr);
			MapExtend mapExtend = new MapExtend(mapExtendTmp.getDouble("north"), mapExtendTmp.getDouble("south"),
					mapExtendTmp.getDouble("west"), mapExtendTmp.getDouble("east"));

			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			config.setMapExtend(mapExtend);
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting default map extend", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Set the possible projections
	 * @param String containing a JSON encoded array of projection objects
	 */
	@POST
	@Path(DYNAMIC_PATH+"/projections")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setProjections(String projectionsStr, @Context HttpServletRequest req) {
		try {
			// convert json string to List<Projection>
			JSONArray projectionsTmp = new JSONArray(projectionsStr);
			List<Projection> projections = new ArrayList<Projection>();
			for (int i=0, count=projectionsTmp.length(); i<count; i++) {
				JSONObject projectionObj = projectionsTmp.getJSONObject(i);
				Projection projection = new Projection(projectionObj.getString("name"), projectionObj.getString("epsgCode"));
				projections.add(projection);
			}

			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			config.setProjections(projections);
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting projections", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Set the possible scales
	 * @param String containing a JSON encoded array of scale objects
	 */
	@POST
	@Path(DYNAMIC_PATH+"/scales")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setScales(String scalesStr, @Context HttpServletRequest req) {
		try {
			// convert json string to List<Scale>
			JSONArray scalesTmp = new JSONArray(scalesStr);
			List<Scale> scales = new ArrayList<Scale>();
			for (int i=0, count=scalesTmp.length(); i<count; i++) {
				JSONObject scaleObj = scalesTmp.getJSONObject(i);
				Scale scale = new Scale(scaleObj.getString("name"), scaleObj.getDouble("zoomLevel"));
				scales.add(scale);
			}

			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			config.setScales(scales);
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting scales", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
	
	/**
	 * Set the possible settings
	 * @param String containing a JSON encoded array of setting objects
	 */
	@POST
	@Path(DYNAMIC_PATH+"/settings")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setSettings(String settingStr, @Context HttpServletRequest req) {
		try {
			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			List<Setting> settings = config.getSettings();
			
			// convert json string to List<Setting>
			JSONArray settingTmp = new JSONArray(settingStr);
			HashMap<String, String> maps = new HashMap<String, String>();
			for (int j=0, count=settingTmp.length(); j<count; j++) {
				JSONObject settingsObj = settingTmp.getJSONObject(j);
				Iterator<?> keys = settingsObj.keys();

		        while( keys.hasNext() ){
		            String key = (String)keys.next();
		            maps.put(key, settingsObj.get(key).toString());
		        }
			}
			List<Setting> editSettings = new ArrayList<Setting>();
			for (int i=0, countI=settings.size(); i<countI; i++) {
				
				Setting setting = settings.get(i);
				String key = setting.getKey();
				String name = setting.getName();
				String group = setting.getGroup();
				
				String value = (String) maps.get(key);
				if(value == null){
					value = setting.getValue();
				}
				Setting editSetting = new Setting(key, name, value, group);
				editSettings.add(editSetting);
			}
			config.setSettings(editSettings);
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting Settings", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Set the proxy url
	 * @param String containing the url
	 */
	@POST
	@Path(DYNAMIC_PATH+"/proxyUrl")
	@Consumes(MediaType.TEXT_PLAIN)
	public void seProxyUrl(String proxyUrl, @Context HttpServletRequest req) throws IOException {
		try {
			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			config.setProxyUrl(proxyUrl);
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting proxy url", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Set the service categories
	 * @param String containing a JSON encoded category/service hierarchy.
	 * 
	 * @note The following structure is expected:
	 * 
	 * {name:root, serviceCategories:[
	 * 	{name:categorie1, [serviceCategories:[...] OR services:[...]},
	 * 	{name:categorie2, serviceCategories:[...] OR services:[...]},
	 * 	...
	 * 	]
	 * }
	 * 
	 * Where serviceCategory has the properties 'name' and 'serviceCategories' (list of serviceCategories instances)
	 * or 'services' (list of service instances) and service has the properties 'name' and 'capabilitiesUrl'.
	 * The first serviceCategories are supposed to be contained in a serviceCategories named 'root'.
	 */
	@POST
	@Path(DYNAMIC_PATH+"/mapServiceCategories")
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.APPLICATION_JSON)
	public Response updateMapServiceCategories(String mapServiceCategoriesStr, @Context HttpServletRequest req) {
		try {
			// convert json string to ServiceCategory
			JSONObject rootObj = new JSONObject(mapServiceCategoriesStr);
			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			config.setMapServiceCategories(this.createMapServiceCategories(rootObj));
			ConfigurationProvider.INSTANCE.write(config);
			PersistentConfiguration configuration = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
				@Override
				public HierarchicalStreamWriter createWriter(Writer writer) {
					return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
				}
			});
			String json = xstream.toXML(configuration);
			return Response.ok(json).build();
			
		}
		catch (Exception ex) {
			log.error("Error setting service categories", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Set the active services
	 * @param String containing a JSON encoded array of active service
	 */
	@POST
	@Path(DYNAMIC_PATH+"/activeServices")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setActiveSettings(String layerConfig, @Context HttpServletRequest req) {
		try {
			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			// convert json string to List<Setting>
			JSONObject layerConfigObj = new JSONObject(layerConfig);
			JSONArray settingTmp = new JSONArray(layerConfigObj.getString("activeServices"));
			List<WmsActiveService> wmsActiveServices = new ArrayList<WmsActiveService>();
			for (int j=0, count=settingTmp.length(); j<count; j++) {
				JSONObject settingsObj = settingTmp.getJSONObject(j);
				Iterator<?> keys = settingsObj.keys();
				WmsActiveService wmsActiveService = new WmsActiveService();
		        while( keys.hasNext() ){
		            String key = (String)keys.next();
		            if(key.equals("serviceLayers")){
		            	JSONArray serviceLayers = new JSONArray(settingsObj.get(key).toString());
		    			List<WmsServiceLayer> serviceLayersList = new ArrayList<WmsServiceLayer>();
		    			for (int i = 0, count1 = serviceLayers.length(); i < count1; i++){
		    				serviceLayersList.add(
		    						new WmsServiceLayer(
		    								serviceLayers.getJSONObject(i).getString("layer"),
		    								serviceLayers.getJSONObject(i).has("opacity") ? serviceLayers.getJSONObject(i).getString("opacity") : "",
		    								serviceLayers.getJSONObject(i).getBoolean("checked")
		    						)
		    				);
		    			}
		    			wmsActiveService.setCheckedLayers(serviceLayersList);
		            }else if(key.equals("serviceUrl")){
		            	wmsActiveService.setCapabilitiesUrl(settingsObj.get(key).toString());
		            }
		        }
		        wmsActiveServices.add(wmsActiveService);
			}
			config.setWmsActiveServices(wmsActiveServices);
			
			String activeServicesDefaultOpacity = layerConfigObj.getString("activeServicesDefaultOpacity");
			config.setActiveServicesDefaultOpacity(activeServicesDefaultOpacity);
			
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting Settings", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
	
	/**
	 * Create a MapServiceCategory instance from the given JSON object
	 * @param object JSONObject instance containing the category data
	 * @return ServiceCategory instance
	 * @throws JSONException
	 */
	private List<MapServiceCategory> createMapServiceCategories(JSONObject object) throws JSONException {
		

		List<MapServiceCategory> categories = new ArrayList<MapServiceCategory>();
		// process categories
		
		if (object.has("mapServiceCategories")) {
			JSONArray categoriesTmp = object.getJSONArray("mapServiceCategories");
			for (int i=0, count=categoriesTmp.length(); i<count; i++) {
				MapServiceCategory category = null;

				List<MapServiceCategory> subCategories = new ArrayList<MapServiceCategory>();
				if(categoriesTmp.getJSONObject(i).has("idx"))
					category = new MapServiceCategory(categoriesTmp.getJSONObject(i).getString("name"), subCategories, categoriesTmp.getJSONObject(i).getInt("idx"));
				else
					category = new MapServiceCategory(categoriesTmp.getJSONObject(i).getString("name"), subCategories, findHighestId() + 1);
				if(categoriesTmp.getJSONObject(i).has("mapServiceCategories")){
					JSONArray categoryObj = categoriesTmp.getJSONObject(i).getJSONArray("mapServiceCategories");
					for (int j=0, count2=categoryObj.length(); j < count2; j++){
						MapServiceCategory cat = null;
						if(categoryObj.getJSONObject(j).has("idx")){
							 cat = new MapServiceCategory(categoryObj.getJSONObject(j).getString("name"), null, categoryObj.getJSONObject(j).getInt("idx"));
						}else{
							//TODO check the highest id and enter a higher one
							 cat = new MapServiceCategory(categoryObj.getJSONObject(j).getString("name"), null, findHighestId() + 1);
						}
						category.getMapServiceCategories().add(cat);
					}
				}
				
				categories.add(category);
			}
		}
		return categories;
	}
	
	/**
	 * private function to find highest id
	 * 
	 */
	
	private int findHighestId(){
		int highest = 0;
		Iterator<MapServiceCategory> itCat = ConfigurationProvider.INSTANCE.getPersistentConfiguration().getMapServiceCategories().iterator();
		while(itCat.hasNext()){
			MapServiceCategory cat = itCat.next();
			if(cat.getId() > highest)
				highest = cat.getId(); 
			if(cat.getMapServiceCategories() != null){
				Iterator<MapServiceCategory> catIt = cat.getMapServiceCategories().iterator();
				while(catIt.hasNext()){
					MapServiceCategory ct = catIt.next();							
					if(ct.getId() > highest){
						highest = ct.getId();
					}
				}
			}
		}
		return highest;
	}
	
	/**
	 * Set the area categories
	 * @param String containing a JSON encoded category/area hierarchy.
	 * 
	 * @note The following structure is expected:
	 * 
	 * {name:root, areaCategories:[
	 * 	{name:categorie1, [areaCategories:[...] OR areas:{...}},
	 * 	{name:categorie2, areaCategories:[...] OR ares:{...}},
	 * 	...
	 * 	]
	 * }
	 * 
	 * Where areaCategory has the properties 'name' and 'areaCategories' (list of areaCategories instances)
	 * or 'area' (list of area instances) and area has the properties 'name', 'north', 'west', 'east', 'south'.
	 * The first areaCategories are supposed to be contained in a areaCategories named 'root'.
	 */
	@POST
	@Path(DYNAMIC_PATH+"/areaCategories")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setAreaCategories(String areaCategoriesStr, @Context HttpServletRequest req) {
		try {
			// convert json string to AreaCategory
			JSONObject rootObj = new JSONObject(areaCategoriesStr);
			AreaCategory rootCategory = this.createAreaCategory(rootObj);

			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			config.setAreaCategeories(rootCategory.getAreaCategories());
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting area categories", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
	
	/**
	 * This method gets a servicecopy object from which it creates another service
	 * and stores it in the persistent configuration
	 * the following structure is expected:
	 * {title:"title",
	 * 	originalCapUrl: "http://xyz",
	 *  categories: [6,9,...],
	 *  layers: [Layer, Layer, Layer],
	 *  checkedLayers: [3,5,7]}
	 *  the originalCapUrl HAS to be the original cap url, if the service we receive is already a copy!!!
	 * @param String containing the object
	 */
	@POST
	@Path(DYNAMIC_PATH + "/" + COPY_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void copyService(String serviceCopy, @Context HttpServletRequest req) throws IOException {
		try {
				JSONObject json = new JSONObject(serviceCopy);
				HashMap<String, String> map = makeCopyOfService(json, true, req);
				if(map != null){
					insertCopyIntoConfig(map, json);
				}else{
					Exception ex = new Exception();
					throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
				}
		}
		catch (Exception ex) {
			log.error("Error setting default capabilities url", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}	
	
	/**
	 * This method gets a ServiceContainer object from which adds to the WmsService list
	 * and stores it in the persistent configuration
	 * the following structure is expected:
	 * {title:"title",
	 * 	originalCapUrl: "http://xyz",
	 *  categories: [6,9,...],
	 *  layers: [Layer, Layer, Layer],
	 *  checkedLayers: [3,5,7]}
	 *  the originalCapUrl HAS to be the original cap url, if the service we receive is already a copy!!!
	 * @param String containing the object
	 * @throws SAXException 
	 */
	@POST
	@Path(DYNAMIC_PATH + "/" + ADD_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void addService(String service, @Context HttpServletRequest req) throws SAXException {
		try {
				JSONObject jsonService = new JSONObject(service);
				HashMap<String, String> map = makeCopyOfService(jsonService, false, req);
				if(map != null){
					insertCopyIntoConfig(map, jsonService);
				}else{
					Exception ex = new Exception();
					throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
				}
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			throw new WebApplicationException(e, Response.Status.CONFLICT);
		} catch (Exception ex) {
			log.error("some error", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}	
	
	/**
	 * This method gets a ServiceContainer object from which adds to the WmsService list
	 * and stores it in the persistent configuration
	 * the following structure is expected:
	 * {title:"title",
	 * 	originalCapUrl: "http://xyz",
	 *  categories: [6,9,...],
	 *  layers: [Layer, Layer, Layer],
	 *  checkedLayers: [3,5,7]}
	 *  the originalCapUrl HAS to be the original cap url, if the service we receive is already a copy!!!
	 * @param String containing the object
	 * @throws SAXException 
	 */
	@POST
	@Path(DYNAMIC_PATH + "/" + ADD_COPY_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void addServiceOrgCopy(String service, @Context HttpServletRequest req) throws IOException, SAXException {
		try {
			JSONObject json = new JSONObject(service);
			HashMap<String, String> url = makeOrgCopyOfService(json, req);
			if(url != null){
				WmsService wmsService = findService(json);
				wmsService.setCapabilitiesUrlOrg(url.get("urlOrg"));
				ConfigurationProvider.INSTANCE.write(ConfigurationProvider.INSTANCE.getPersistentConfiguration());
			}else{
				Exception ex = new Exception();
				throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
			}
		}
		catch (SAXException e) {
			// TODO Auto-generated catch block
			throw new SAXException(e);
		} 
		catch (Exception ex) {
			log.error("some error", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
	
	private HashMap<String, String> makeOrgCopyOfService(JSONObject json, HttpServletRequest req) throws SAXException{
		HashMap<String, String> urls = null;
		String urlOrg = null;
		String urlPrefix = null;
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		String path = p.getWMSDir();
		try {
			String capUrl = json.getString("originalCapUrl");			
			String capabilitiesUrl = json.getString("capabilitiesUrl");
			
			// Create WMS original Copy
			File wmsDir = new File(path);
			if(!wmsDir.exists()){
				wmsDir.mkdir();
			}
			urlPrefix = req.getRequestURL().toString();
			urlPrefix = urlPrefix.substring(0, urlPrefix.indexOf("rest/"));
			urlPrefix += "wms/";
			
			// get the wms document 
			String response = HttpProxy.doRequest(capUrl);
			Document doc = stringToDom(response);
			doc = CapabilitiesUtils.addIndexToLayers(doc);
			
			String title = getNameFromXML(doc);
			TransformerFactory tFactory = TransformerFactory.newInstance();
			Transformer transformer = tFactory.newTransformer();
			DOMSource source = new DOMSource(doc);
			
			File fOrg = null;
			do {
				urlOrg = new DbUrlMapper().createShortUrl(title) + "_org.xml";
				fOrg = new File(path + "/" + urlOrg);
				
			} while (fOrg.exists());
			// Create original copy file
			StreamResult resultOrg = new StreamResult(fOrg);
			transformer.transform(source, resultOrg);
			
			if(urls == null){
				urls = new HashMap<String, String>();
			}
			urls.put("urlOrg", urlPrefix+urlOrg+"?REQUEST=GetCapabilities");
			
		} catch (JSONException e) {
			log.error("Unable to decode json object: "+e);
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			throw new SAXException(e);
		} catch (Exception e) {
			log.error("Error on doing request: "+e);
			throw new WebApplicationException(e, Response.Status.SERVICE_UNAVAILABLE);
		}
		
		return urls;
		
	}

	/**
	 * This method gets a ServiceContainer object it will look in the list for the original
	 * service object and update the changes
	 * the following structure is expected:
	 * {title:"title",
	 * 	originalCapUrl: "http://xyz",
	 *  categories: [6,9,...],
	 *  layers: [Layer, Layer, Layer],
	 *  checkedLayers: [3,5,7]}
	 *  the originalCapUrl HAS to be the original cap url, if the service we receive is already a copy!!!
	 * @param String containing the object
	 */
	@POST
	@Path(DYNAMIC_PATH + "/" + UPDATE_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void updateService(String serviceString, @Context HttpServletRequest req) throws IOException {
		try {
				// find according file, update xml
				// find wmsservice in conf and update
				// write conf 
				JSONObject jsonService = new JSONObject(serviceString);
				WmsService service = findService(jsonService);
				boolean doServiceUpdate = false;
				if(service != null){
					if(jsonService.get("title") != JSONObject.NULL){
						doServiceUpdate = true;
						service.setName(jsonService.getString("title"));
					}
					if(jsonService.get("updateFlag") != JSONObject.NULL){
						service.setCapabilitiesUpdateFlag(jsonService.getString("updateFlag"));
						if(jsonService.getString("updateFlag").equals("aus")){
							service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_OFF);
						}
					}
					if(jsonService.get("categories") != JSONObject.NULL){
						//rewrite the categories of the service
						updateCategories(service, jsonService);
					}
					if(jsonService.get("layers") != JSONObject.NULL){
						doServiceUpdate = true;
						updateLayers(service, jsonService);
					}
					
					if(doServiceUpdate){
						updateServiceFile(jsonService, req);
					}
					ConfigurationProvider.INSTANCE.write(ConfigurationProvider.INSTANCE.getPersistentConfiguration());
				}
		}
		catch (Exception ex) {
			log.error("some error", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
	


	/**
	 * This method gets a ServiceContainer object, it will look in the list for the original
	 * service object and delete it
	 * the following structure is expected:
	 * {title:"title",
	 * 	originalCapUrl: "http://xyz",
	 *  categories: [6,9,...],
	 *  layers: [Layer, Layer, Layer],
	 *  checkedLayers: [3,5,7]}
	 *  the originalCapUrl HAS to be the original cap url, if the service we receive is already a copy!!!
	 * @param String containing the object
	 */
	@POST
	@Path(DYNAMIC_PATH + "/" + REMOVE_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void removeService(String service, @Context HttpServletRequest req) throws IOException {
		try {
			JSONObject jsonService = new JSONObject(service);
			removeFromConfig(jsonService);
			deleteWmsFile(jsonService, req);				
		}catch (Exception ex) {
			log.error("some error", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}	



	/**
	 * This method gets a ServiceContainer object with just the capUrl, find the corresponding
	 * WmsService and send it to the caller
	 * the following structure is expected:
	 * {title:"title",
	 * 	originalCapUrl: "http://xyz",
	 *  categories: [6,9,...],
	 *  layers: [Layer, Layer, Layer],
	 *  checkedLayers: [3,5,7]}
	 *  the originalCapUrl HAS to be the original cap url, if the service we receive is already a copy!!!
	 * @param String containing the object
	 */
	@POST
	@Path(GET_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public Response getService(String service, @Context HttpServletRequest req) throws IOException {
		try {
				JSONObject jsonService = new JSONObject(service);

		}
		catch (Exception ex) {
			log.error("some error", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
		return null;
	}		
	
	/**
	 * This method gets a ServiceContainer object from which adds to the WmsService list
	 * and stores it in the persistent configuration
	 * the following structure is expected:
	 * {title:"title",
	 * 	originalCapUrl: "http://xyz",
	 *  categories: [6,9,...],
	 *  layers: [Layer, Layer, Layer],
	 *  checkedLayers: [3,5,7]}
	 *  the originalCapUrl HAS to be the original cap url, if the service we receive is already a copy!!!
	 * @param String containing the object
	 * @throws Exception 
	 */
	@POST
	@Path(DYNAMIC_PATH + "/" + RELOAD_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void reloadService(String serviceString, @Context HttpServletRequest req) throws Exception {
		JSONObject jsonService = new JSONObject(serviceString);
		String capabilitiesUrl = jsonService.getString("capabilitiesUrl"); 
		String capabilitiesUrlOrg = jsonService.getString("capabilitiesUrlOrg"); 
		String originalCapUrl = jsonService.getString("originalCapUrl"); 
		String title = jsonService.getString("title"); 
		String protocol = jsonService.getString("protocol"); 
		HashMap<String, String> fileNames = new HashMap<String, String>();
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		String path = p.getWMSDir();
		
		String fileName = capabilitiesUrl.substring(capabilitiesUrl.lastIndexOf("/"), capabilitiesUrl.length());			
		String [] splitFileName = fileName.split("\\?");
		fileNames.put("url", path + "" + splitFileName[0]);
		fileName = capabilitiesUrlOrg.substring(capabilitiesUrlOrg.lastIndexOf("/"), capabilitiesUrlOrg.length());			
		splitFileName = fileName.split("\\?");
		fileNames.put("urlOrg", path + "" + splitFileName[0]);
		
		String response = HttpProxy.doRequest(originalCapUrl);
		Document doc = stringToDom(response);
		writeWmsCopyToFile(doc, req, title, fileNames, protocol);
		
		WmsService service = findService(jsonService);
		// Update hashCode
		service.setCapabilitiesHash(CapabilitiesUtils.generateMD5String(response));
		service.setCapabilitiesHashUpdate(CapabilitiesUtils.generateMD5String(response));
		if(service.getCapabilitiesUpdateFlag().equals("aus")){
			service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_OFF);
		}else{
			service.setCapabilitiesUpdateImage(WmsService.WMSSERVICE_OK);
		}
		service.setCapabilitiesUpdateMailStatus(false);
		
		updateLayers(service, jsonService);
		ConfigurationProvider.INSTANCE.write(ConfigurationProvider.INSTANCE.getPersistentConfiguration());
	}	
	
	@POST
	@Path(DYNAMIC_PATH + "/" + REFRESH_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void refreshService(String serviceString, @Context HttpServletRequest req) throws Exception {
		JSONObject jsonService = new JSONObject(serviceString);
		String capabilitiesUrl = jsonService.getString("capabilitiesUrl"); 
		String originalCapUrl = capabilitiesUrl; 
		String title = jsonService.getString("title"); 
		String protocol = jsonService.getString("protocol"); 
		
		String response = HttpProxy.doRequest(originalCapUrl);
		Document doc = stringToDom(response);
		HashMap<String, String> url = writeWmsCopy(doc, req, title, protocol);
		
		WmsService service = findService(jsonService);
		service.setCapabilitiesUrl(url.get("url"));
		service.setOriginalCapUrl(originalCapUrl);
		ConfigurationProvider.INSTANCE.write(ConfigurationProvider.INSTANCE.getPersistentConfiguration());
	}	
	
	
	private void insertCopyIntoConfig(HashMap<String, String> map, JSONObject json) {
			
			try {
				ConfigurationProvider p = ConfigurationProvider.INSTANCE;
				JSONArray layers = json.getJSONArray("layers");
				List<JSONObject> sortedLayerList = new ArrayList<JSONObject>();
				for (int i = 0, count = layers.length(); i < count; i++){
					sortedLayerList.add(layers.getJSONObject(i));
				}
				
				List<String> checkLayers = new ArrayList<String>();
				if (layers != null) {
					for (int i = 0, count = sortedLayerList.size(); i < count; i++) {
						if(sortedLayerList.get(i).getBoolean("checked")){
							String checked = sortedLayerList.get(i).getString("index");
							checkLayers.add(checked);
						}
					}
				}
			
				String title = json.getString("title");
				String originalCapUrl = json.getString("originalCapUrl");
				String updateImage = WmsService.WMSSERVICE_OK;
				if(json.getString("updateFlag").equals("aus")){
					updateImage = WmsService.WMSSERVICE_OFF;
				}
				WmsService wmsService = new WmsService(title, map.get("url"), map.get("urlOrg"), new ArrayList<MapServiceCategory>(), originalCapUrl, checkLayers, map.get("capabilitiesHash"), map.get("capabilitiesHash"), updateImage, json.getString("updateFlag"), false);
				updateCategories(wmsService, json);
				p.getPersistentConfiguration().getWmsServices().add(wmsService);
				p.write(p.getPersistentConfiguration());
				
				
			} catch (JSONException e) {
				log.error("error on decoding json: "+e.getMessage());
			} catch (IOException e) {
				log.error("error on writing configuration to file: "+e.getMessage());
			}
			
		
	}

	/**
	 * Create a AreaCategory instance from the given JSON object
	 * @param object JSONObject instance containing the category data
	 * @return AreaCategory instance
	 * @throws JSONException
	 */
	private AreaCategory createAreaCategory(JSONObject object) throws JSONException {
		// get category name
		String categoryName = object.getString("name");
		// process areas
		List<MapArea> areas = new ArrayList<MapArea>();
		if (object.has("areas")) {
			JSONArray areasTmp = object.getJSONArray("areas");
			for (int i=0, count=areasTmp.length(); i<count; i++) {
				JSONObject areaObj = areasTmp.getJSONObject(i);
				MapArea area = new MapArea(areaObj.getString("name"),
						Double.parseDouble(areaObj.getString("north").replace(",", ".")),
						Double.parseDouble(areaObj.getString("south").replace(",", ".")),
						Double.parseDouble(areaObj.getString("west").replace(",", ".")),
						Double.parseDouble(areaObj.getString("east").replace(",", "."))
						);
				areas.add(area);
			}
		}
		// process categories
		List<AreaCategory> categories = new ArrayList<AreaCategory>();
		if (object.has("areaCategories")) {
			JSONArray categoriesTmp = object.getJSONArray("areaCategories");
			for (int i=0, count=categoriesTmp.length(); i<count; i++) {
				JSONObject categoryObj = categoriesTmp.getJSONObject(i);
				AreaCategory category = this.createAreaCategory(categoryObj);
				categories.add(category);
			}
		}
		AreaCategory result = new AreaCategory(categoryName, categories, areas);
		return result;
	}
	/**
	 * this method actually does the whole copying of the received service data
	 * @param json
	 * @param req 
	 * @throws SAXException 
	 */
	private HashMap<String, String> makeCopyOfService(JSONObject json, boolean isCopy, HttpServletRequest req) throws SAXException{
		HashMap<String, String> urls = null;
		try {
			String title = null;
			if(json.get("title") != JSONObject.NULL){
				title = json.getString("title");
			} 
			String capUrl = json.getString("originalCapUrl");			
			if(isCopy){
				capUrl = json.getString("capabilitiesUrl");
			}
			String protocol = null;			
			if(json.get("protocol") != JSONObject.NULL){
				protocol = json.getString("protocol");
			}
			// get the wms document 
			String response = HttpProxy.doRequest(capUrl);
			log.debug(response);
			Document doc = stringToDom(response);
			if(title == null){
				title = getNameFromXML(doc);
				json.put("title", title);
			}
			if(!isCopy){
				doc = changeXml(doc, json);
			}
			urls = writeWmsCopy(doc, req, title, protocol);
			
			// add hashCode for capabilities response
			urls.put("capabilitiesHash", CapabilitiesUtils.generateMD5String(response));
			urls.put("capabilitiesHashUpdate", CapabilitiesUtils.generateMD5String(response));
		} catch (JSONException e) {
			
			log.error("Unable to decode json object: "+e);
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			throw new SAXException(e);
		}  catch (Exception e) {

			log.error("Error on doing request: "+e);
		}
		return urls;
		
	}

	private HashMap<String, String> writeWmsCopy(Document doc, HttpServletRequest req, String title, String protocol) {

		return writeWmsCopyToFile(doc, req, title, null, protocol);
	}
	
	private HashMap<String, String> writeWmsCopyToFile(Document doc, HttpServletRequest req, String title, HashMap<String, String> fileNames, String protocol) {

		HashMap<String, String> urls = null;
		String url = null;
		String urlOrg = null;
		String urlPrefix = null;
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		String path = p.getWMSDir();
		try {
			File wmsDir = new File(path);
			if(!wmsDir.exists()){
				wmsDir.mkdir();
			}
			
			urlPrefix = req.getRequestURL().toString();
			if(protocol != null){
				urlPrefix = urlPrefix.replace("http:", protocol); 
			}
			urlPrefix = urlPrefix.substring(0, urlPrefix.indexOf("rest/"));
			urlPrefix += "wms/";
			TransformerFactory tFactory = TransformerFactory.newInstance();
			Transformer transformer = tFactory.newTransformer();
			// Add name to layers
			doc = CapabilitiesUtils.addIndexToLayers(doc);
			DOMSource source = new DOMSource(doc);
			
			File f = null;
			File fOrg = null;
			if (fileNames == null){
				do {
					url = new DbUrlMapper().createShortUrl(title);
					urlOrg = url + "_org.xml";
					url = url + ".xml";
					f = new File(path + "/" + url);
					fOrg = new File(path + "/" + urlOrg);
				} while (f.exists());
			}else{
				f = new File(fileNames.get("url"));
				fOrg = new File(fileNames.get("urlOrg"));
			}
			// Create original copy file
			StreamResult resultOrg = new StreamResult(fOrg);
			transformer.transform(source, resultOrg);

			// Create copy file
			if(title != null){
				// change title
				Node titleNode = (Node) XPathUtils.getNode(doc, "//Service/Title");
				if(titleNode != null){
					titleNode.setTextContent(title);
				}
			}
			source = new DOMSource(doc);
			StreamResult result = new StreamResult(f);
			transformer.transform(source, result);
		
		} catch (TransformerException e) {
			log.error("problems on creating xml file: " + e.getMessage());
		} catch (Exception e) {
			log.error("problems on generating url: " + e.getMessage());
		}
		
		if(urls == null){
			urls = new HashMap<String, String>();
		}
		urls.put("url", urlPrefix+url+"?REQUEST=GetCapabilities");
		urls.put("urlOrg", urlPrefix+urlOrg+"?REQUEST=GetCapabilities");
		
		return urls;

	}

	/**
	 * this method does all the xml manipulation of the document, deleting layers
	 * changing title etc.
	 * @param doc
	 * @param deactLayers 
	 * @param title 
	 * @throws TransformerException 
	 */
	private Document changeXml(Document doc, JSONObject json)
			throws TransformerException {
		try {
			if(json.get("layers") != JSONObject.NULL){
				JSONArray layers = json.getJSONArray("layers");
				if (layers != null) {
					for (int i = 0, count = layers.length(); i < count; i++) {
						JSONObject layer = layers.getJSONObject(i);
						if (layer.getBoolean("deactivated")) {
							
							Node n = XPathUtils.getNode(doc, "//Name[text()=\"" + layer.getString("index") + "\"]");
							if(n != null){
								n.getParentNode().getParentNode().removeChild(n.getParentNode());
							}
							log.debug("delete layer: " + layers.get(i));

						} else {
							// TODO insert all other attibutes in wms
			
							// Title
							Node nameNode = XPathUtils.getNode(doc, "//Name[text()=\"" + layer.getString("index") + "\"]");
							if(nameNode != null){
								Node titleNode = XPathUtils.getNode(nameNode.getParentNode(), "./Title");
								titleNode.setTextContent(layer.getString("title"));
							
								if(layers.getJSONObject(i).getBoolean("featureInfo")){
									nameNode.getParentNode().getAttributes().getNamedItem("queryable").setNodeValue("1");	
								}else{
									if(nameNode.getParentNode().getAttributes().getNamedItem("queryable") != null){
										nameNode.getParentNode().getAttributes().getNamedItem("queryable").setNodeValue("0");
									}
								}								
							}
						}
					}
				}
			}
			if(json.get("title") != JSONObject.NULL){
				Node titleNode = (Node) XPathUtils.getNode(doc, "//Service/Title");
				if(titleNode != null){
					titleNode.setTextContent(json.getString("title"));
				}
			}
		} catch (JSONException e) {
			log.error("error on retrieving data from json document: "
					+ e.getMessage());
			e.printStackTrace();
		}
		return doc;
	}

	
	private Document changeXmlCopy(Document doc, JSONObject json)
			throws TransformerException {
		try {
			if(json.get("layers") != JSONObject.NULL){
				JSONArray layers = json.getJSONArray("layers");
				if (layers != null) {
					for (int i = 0, count = layers.length(); i < count; i++) {
						JSONObject layer = layers.getJSONObject(i);
						// Title
						Node nameNode = XPathUtils.getNode(doc, "//Name[text()=\"" + layer.getString("index") + "\"]");
						if(nameNode != null){
							Node titleNode = XPathUtils.getNode(nameNode.getParentNode(), "./Title");
							titleNode.setTextContent(layer.getString("title"));
						}
					}
				}
			}
			if(json.get("title") != JSONObject.NULL){
				Node titleNode = (Node) XPathUtils.getNode(doc, "//Service/Title");
				if(titleNode != null){
					titleNode.setTextContent(json.getString("title"));
				}
			}			
		} catch (JSONException e) {
			log.error("error on retrieving data from json document: "
					+ e.getMessage());
			e.printStackTrace();
		}
		return doc;
	}

	/**
	 * utility method for parsing xml strings 
	 * @param xmlSource
	 * @return
	 * @throws SAXException
	 * @throws ParserConfigurationException
	 * @throws IOException
	 */
    public Document stringToDom(String xmlSource) throws SAXException {

		try {
	        DocumentBuilder db = DocumentBuilderFactory.newInstance().newDocumentBuilder();
	        InputSource is = new InputSource();
	        is.setCharacterStream(new StringReader(xmlSource));
	        Document doc = db.parse(is);
	        return doc;
		} catch (ParserConfigurationException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			throw new WebApplicationException(e, Response.Status.CONFLICT);
		} catch (SAXException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			throw new SAXException(e);
		} catch (IOException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			throw new WebApplicationException(e, Response.Status.CONFLICT);
		}
    }
	private void deleteWmsFile(JSONObject json, HttpServletRequest req) {

			try {
				ConfigurationProvider p = ConfigurationProvider.INSTANCE;
				String path = p.getWMSDir();
				String url = json.getString("capabilitiesUrl");
				if(url != null && url.length() > 0){
					String fileName = url.substring(url.lastIndexOf("/"), url.length());			
					String [] splitFileName = fileName.split("\\?");
					File f = new File(path+splitFileName[0]);
					boolean deleted = false;
					if(f.exists())
						deleted = f.delete();
					if(deleted)
						log.debug("File: "+splitFileName[0]+" deleted");
					else
						log.debug("could not delete file: "+splitFileName[0]);
				}
				String urlCopy = json.getString("capabilitiesUrlOrg");
				if(urlCopy != null && urlCopy.length() > 0){
					String fileName = urlCopy.substring(urlCopy.lastIndexOf("/"), urlCopy.length());			
					String [] splitFileName = fileName.split("\\?");
					File f = new File(path+splitFileName[0]);
					boolean deleted = false;
					if(f.exists())
						deleted = f.delete();
					if(deleted)
						log.debug("File: "+splitFileName[0]+" deleted");
					else
						log.debug("could not delete file: "+splitFileName[0]);
				}
			
			} catch (JSONException e) {
				log.error("on file deletion json exception occured: ",e);
			}

	}
	private void removeFromConfig(JSONObject jsonService) {
		try {
			ConfigurationProvider p = ConfigurationProvider.INSTANCE;
			PersistentConfiguration pConf = p.getPersistentConfiguration();
			List<WmsService> services = pConf.getWmsServices();
			WmsService service = findService(jsonService);
			if(service != null){
				services.remove(service);
				p.write(pConf);
			}else{
				log.error("could not find requested service");
			}
		} catch (IOException e) {
			log.error("IO Exception on removing file from config: ", e);
		}
	}
	private WmsService findService(JSONObject jsonService){
		WmsService service = null;
		boolean cont = true;
		try{
		String capUrl = jsonService.getString("capabilitiesUrl");
		Iterator<WmsService> it = ConfigurationProvider.INSTANCE.getPersistentConfiguration().getWmsServices().iterator();
		
		while (it.hasNext() && cont) {
			service = it.next();
			if (service.getCapabilitiesUrl().equals(capUrl)) {
				cont = false;
			}

		}
		}catch (JSONException e) {
			log.error("JSON Exception on removing file from config: ", e);
		}
		if(cont)
			service = null;
		return service;
	}
	private void updateCategories(WmsService service, JSONObject jsonService) {
		JSONArray categories;
		try {
			categories = jsonService.getJSONArray("categories");
			List<MapServiceCategory> mapCategories = new ArrayList<MapServiceCategory>();
			for(int i = 0, count = categories.length(); i < count; i++ ){
				Iterator<MapServiceCategory> mapConfigCategoriesIterator = ConfigurationProvider.INSTANCE.getPersistentConfiguration().getMapServiceCategories().iterator();
				int index = categories.getInt(i);
				boolean notFound = true;
				while(mapConfigCategoriesIterator.hasNext() && notFound){
					MapServiceCategory cat = mapConfigCategoriesIterator.next();
					if(cat.getId() == index){
						mapCategories.add(cat);
						notFound = false;
					}
					if(cat.getMapServiceCategories() != null){
						Iterator<MapServiceCategory> it = cat.getMapServiceCategories().iterator();
						while(it.hasNext() && notFound){
							MapServiceCategory ct = it.next();
							if(ct.getId() == index){
								mapCategories.add(ct);
								notFound = false;
							}		
						}
					}
				}
			}
			service.setMapServiceCategories(mapCategories);
		} catch (JSONException e) {
			log.error("error on upddating categories of service: ",e);
		}
		
	}	

	private void updateLayers(WmsService service, JSONObject jsonService) {
		JSONArray layers;
		try {
			layers = jsonService.getJSONArray("layers");
			List<JSONObject> sortedLayerList = new ArrayList<JSONObject>();
			for (int i = 0, count = layers.length(); i < count; i++){
				sortedLayerList.add(layers.getJSONObject(i));
			}
			
			// first of all we sort the list according to their indices
			// we do this to not have any problems later when deleting layers
			// index is now the unique layer name

			List<String> checkLayers = new ArrayList<String>();
			if (layers != null) {
				for (int i = 0, count = sortedLayerList.size(); i < count; i++) {
					if(sortedLayerList.get(i).getBoolean("checked")){
						String checked = sortedLayerList.get(i).getString("index");
						checkLayers.add(checked);
					}
				}
			}
			service.setCheckedLayers(checkLayers);
		} catch (JSONException e) {
			log.error("error on upddating categories of service: ",e);
		}
		
	}	

	private void updateServiceFile(JSONObject jsonService, HttpServletRequest req) {
		String url;
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		String path = p.getWMSDir();
		
		try {
			// Get original copy xml file
			url = jsonService.getString("capabilitiesUrlOrg");
			String fileName = url.substring(url.lastIndexOf("/"), url.length());
			String [] splitFileName = fileName.split("\\?");
			File f = new File(path+splitFileName[0]);
			
			DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
			DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
			Document doc = dBuilder.parse(f);
			
			// Change the xml stucture for original copy
			Document docCopy = changeXmlCopy(doc, jsonService);
			TransformerFactory tFactory = TransformerFactory.newInstance();
			Transformer transformer = tFactory.newTransformer();
			DOMSource source = new DOMSource(docCopy);
			StreamResult result = new StreamResult(f);
			transformer.transform(source, result);
			
			// Get copy xml file
			url = jsonService.getString("capabilitiesUrl");
			fileName = url.substring(url.lastIndexOf("/"), url.length());
			splitFileName = fileName.split("\\?");
			f = new File(path+splitFileName[0]);
			
			//change the xml structure for copy
			doc = changeXml(doc, jsonService);
			tFactory = TransformerFactory.newInstance();
			transformer = tFactory.newTransformer();
			source = new DOMSource(doc);
			result = new StreamResult(f);
			transformer.transform(source, result);
		} catch (JSONException e) {
			log.error("JSONException on updating wms file: ",e);
		} catch (ParserConfigurationException e) {
			log.error("ParserException on updating wms file: ",e);
		} catch (SAXException e) {
			log.error("SAXException on updating wms file: ",e);
		} catch (IOException e) {
			log.error("IOException on updating wms file: ",e);
		} catch (TransformerException e) {
			log.error("TransformerExceptionException on updating wms file: ",e);
		}


	}
	
	private String getNameFromXML(Document doc) {
		XPath xpath = XPathFactory.newInstance().newXPath();
		String name = "";
		try {
			Node n = (Node) xpath.evaluate("//Service/Title", doc, XPathConstants.NODE);
			if(n != null){
				name = n.getTextContent();
			}
		} catch (XPathExpressionException e) {
			log.error("XPathExpressionException on get xm name: ",e);
		}
		return name;
	}
	
	
}
