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
import de.ingrid.mapclient.model.CustomComparator;
import de.ingrid.mapclient.model.Layer;
import de.ingrid.mapclient.model.MapArea;
import de.ingrid.mapclient.model.MapExtend;
import de.ingrid.mapclient.model.MapServiceCategory;
import de.ingrid.mapclient.model.Projection;
import de.ingrid.mapclient.model.Scale;
import de.ingrid.mapclient.model.ServiceCategory;
import de.ingrid.mapclient.model.WmsServer;
import de.ingrid.mapclient.model.WmsService;
import de.ingrid.mapclient.url.impl.DbUrlMapper;
import de.ingrid.utils.xml.XMLUtils;

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
	 * Set the default WMS GetCapabilities url
	 * @param String containing the url
	 */
	@POST
	@Path(DYNAMIC_PATH+"/wmsCapUrl")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setWmsCapUrl(String wmsCapUrl, @Context HttpServletRequest req) throws IOException {
		try {
			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			config.setWmsCapUrl(wmsCapUrl);
			ConfigurationProvider.INSTANCE.write(config);
		}
		catch (Exception ex) {
			log.error("Error setting default capabilities url", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Set the default map layer names
	 * @param String containing a JSON encoded array of layer objects
	 */
	@POST
	@Path(DYNAMIC_PATH+"/layers")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setLayers(String layersStr, @Context HttpServletRequest req) {
		try {
			// convert json string to List<String>
			JSONArray layersTmp = new JSONArray(layersStr);
			List<Layer> layers = new ArrayList<Layer>();
			for (int i=0, count=layersTmp.length(); i<count; i++) {
				JSONObject layerObj = layersTmp.getJSONObject(i);
				Layer layer = new Layer(layerObj.getString("name"), layerObj.getBoolean("isBaseLayer"));
				layers.add(layer);
			}

			PersistentConfiguration config = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			config.setLayers(layers);
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
	@Path(DYNAMIC_PATH+"/serviceCategories")
	@Consumes(MediaType.TEXT_PLAIN)
	public void setServiceCategories(String serviceCategoriesStr, @Context HttpServletRequest req) {
		try {
			// convert json string to ServiceCategory
			JSONObject rootObj = new JSONObject(serviceCategoriesStr);
			ServiceCategory rootCategory = this.createServiceCategory(rootObj);
			// TODO is this method obsolete?
			// we currently need it, because it is the way the admin interface delivers data
			// but this should change
			Configuration config = ConfigurationProvider.INSTANCE.getConfiguration();
			config.setServiceCategories(rootCategory.getServiceCategories());
			ConfigurationProvider.INSTANCE.getPersistentConfigurationFromConfiguration();
			PersistentConfiguration persConfig = ConfigurationProvider.INSTANCE.getPersistentConfiguration();
			ConfigurationProvider.INSTANCE.write(persConfig);
		}
		catch (Exception ex) {
			log.error("Error setting service categories", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Create a ServiceCategory instance from the given JSON object
	 * @param object JSONObject instance containing the category data
	 * @return ServiceCategory instance
	 * @throws JSONException
	 */
	private ServiceCategory createServiceCategory(JSONObject object) throws JSONException {
		// get category name
		String categoryName = object.getString("name");
		// process services
		List<WmsServer> services = new ArrayList<WmsServer>();
		if (object.has("services")) {
			JSONArray servicesTmp = object.getJSONArray("services");
			for (int i=0, count=servicesTmp.length(); i<count; i++) {
				JSONObject serviceObj = servicesTmp.getJSONObject(i);
				WmsServer service = new WmsServer(serviceObj.getString("name"), serviceObj.getString("capabilitiesUrl"));
				services.add(service);
			}
		}
		// process categories
		List<ServiceCategory> categories = new ArrayList<ServiceCategory>();
		if (object.has("serviceCategories")) {
			JSONArray categoriesTmp = object.getJSONArray("serviceCategories");
			for (int i=0, count=categoriesTmp.length(); i<count; i++) {
				JSONObject categoryObj = categoriesTmp.getJSONObject(i);
				ServiceCategory category = this.createServiceCategory(categoryObj);
				categories.add(category);
			}
		}
		ServiceCategory result = new ServiceCategory(categoryName, categories, services);
		return result;
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
				String url = makeCopyOfService(json, req);
				if(url != null){
					insertCopyIntoConfig(url, json);
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
	 */
	@POST
	@Path(DYNAMIC_PATH + "/" + ADD_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void addService(String service, @Context HttpServletRequest req) throws IOException {
		try {
				JSONObject jsonService = new JSONObject(service);
				String url = makeCopyOfService(jsonService, req);
				if(url != null){
					insertCopyIntoConfig(url, jsonService);
				}else{
					Exception ex = new Exception();
					throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
				}
		}
		catch (Exception ex) {
			log.error("some error", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
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
				if(!jsonService.getString("title").equals("null")){
					WmsService service = findService(jsonService);
					service.setName(jsonService.getString("title"));
				}
				if(!jsonService.getString("categories").equals("null")){
					//rewrite the categories of the service
					WmsService service = findService(jsonService);
					updateCategories(service, jsonService);
				}
				if(!jsonService.getString("layers").equals("null")){
					updateLayersInFile(jsonService, req);
					
				}
				ConfigurationProvider.INSTANCE.write(ConfigurationProvider.INSTANCE.getPersistentConfiguration());
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
		}
		catch (Exception ex) {
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
	private void insertCopyIntoConfig(String url, JSONObject json) {
			
			try {
				ConfigurationProvider p = ConfigurationProvider.INSTANCE;
				JSONArray layers = json.getJSONArray("layers");
				List<JSONObject> sortedLayerList = new ArrayList<JSONObject>();
				for (int i = 0, count = layers.length(); i < count; i++){
					sortedLayerList.add(layers.getJSONObject(i));
				}
				
				// first of all we sort the list according to their indices
				// we do this to not have any problems later when deleting layers
				java.util.Collections.sort(sortedLayerList, new CustomComparator());
				List<Integer> checkLayers = new ArrayList<Integer>();
				int deleted = 0;
				if (layers != null) {
					for (int i = 0, count = sortedLayerList.size(); i < count; i++) {
						if (sortedLayerList.get(i).getBoolean("deactivated")) {
							deleted++;
						}else if(sortedLayerList.get(i).getBoolean("checked")){
							int checked = sortedLayerList.get(i).getInt("index") - deleted;
							checkLayers.add(checked);
						}
					}
				}
			
				String title = json.getString("title");
				String originalCapUrl = json.getString("originalCapUrl");
				WmsService wmsService = new WmsService(title, url, new ArrayList<MapServiceCategory>(), originalCapUrl, checkLayers);
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
	 */
	private String makeCopyOfService(JSONObject json, HttpServletRequest req){
		String url = null;
		try {
			String title = json.getString("title");
			String capUrl = json.getString("originalCapUrl");			

			// get the wms document 
			String response = HttpProxy.doRequest(capUrl);
			log.debug(response);
			Document doc = stringToDom(response);
			doc = changeXml(doc,  json);
			url = writeWmsCopy(doc, req, title);
			
		} catch (JSONException e) {
			
			log.error("Unable to decode json object: "+e);
		} catch (Exception e) {

			log.error("Error on doing request: "+e);
		}
		return url;
		
	}

	private String writeWmsCopy(Document doc, HttpServletRequest req,
			String title) {

		String url = null;
		String urlPrefix = null;
		try {
			String path = req.getSession().getServletContext().getRealPath("wms");
			urlPrefix = req.getRequestURL().toString();
			urlPrefix = urlPrefix.substring(0, urlPrefix.indexOf("rest/"));
			urlPrefix += "wms/";
			TransformerFactory tFactory = TransformerFactory.newInstance();
			Transformer transformer = tFactory.newTransformer();
			DOMSource source = new DOMSource(doc);
			File f = null;
			do {
				url = new DbUrlMapper().createShortUrl(title);
				url = url + ".xml";
				f = new File(path + "/" + url);
			} while (f.exists());
			
			StreamResult result = new StreamResult(f);
			transformer.transform(source, result);
		} catch (TransformerException e) {
			log.error("problems on creating xml file: " + e.getMessage());
		} catch (Exception e) {
			log.error("problems on generating url: " + e.getMessage());
		}
		
		return (urlPrefix+url+"?REQUEST=GetCapabilities");

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
		XPath xpath = XPathFactory.newInstance().newXPath();

		Node titleNode = null;
		try {
			JSONArray layers = json.getJSONArray("layers");
			ArrayList<JSONObject> sortedLayerList = new ArrayList<JSONObject>();
			for (int i = 0, count = layers.length(); i < count; i++){
				sortedLayerList.add(layers.getJSONObject(i));
			}
			
			// first of all we sort the list according to their indices
			// we do this to not have any problems later when deleting layers
			java.util.Collections.sort(sortedLayerList, new CustomComparator());

			int deleted = 0;
			if (layers != null) {
				for (int i = 0, count = sortedLayerList.size(); i < count; i++) {
					if (sortedLayerList.get(i).getBoolean("deactivated")) {
						// we have to substract deleted from index, because
						// everytime we remove a node, the index of the nodelist
						// changes
						Node n = (Node) xpath.evaluate("//Layer/Layer["
								+ (sortedLayerList.get(i).getInt("index") - deleted) + "]",
								doc, XPathConstants.NODE);
						n.getParentNode().removeChild(n);
						log.debug("delete layer: " + sortedLayerList.get(i));
						deleted++;
					} else {
						// TODO insert all other attibutes in wms
		
						JSONObject layerObj = sortedLayerList.get(i);
						log.debug("layerobject: " + layerObj.toString());
						Node n = (Node) xpath.evaluate("//Layer/Layer["
								+ (sortedLayerList.get(i).getInt("index") - deleted) + "]",
								doc, XPathConstants.NODE);
						Node titleNameNode = n.getFirstChild().getNextSibling().getNextSibling().getNextSibling();
						titleNameNode.setTextContent(layerObj
								.getString("title"));
					}
				}
			}

			String title = json.getString("title");

			// change title
			titleNode = (Node) xpath.evaluate("//Service/Title", doc,
					XPathConstants.NODE);
			titleNode.setTextContent(title);
			log.debug(XMLUtils.toString(doc));
		} catch (XPathExpressionException e) {
			log.error("error on xpathing document: " + e.getMessage());
			e.printStackTrace();
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
    public Document stringToDom(String xmlSource) {

		try {
	        DocumentBuilder db = DocumentBuilderFactory.newInstance().newDocumentBuilder();
	        InputSource is = new InputSource();
	        is.setCharacterStream(new StringReader(xmlSource));
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
	private void deleteWmsFile(JSONObject json, HttpServletRequest req) {


			String url;
			try {
				url = json.getString("capabilitiesUrl");
				String fileName = url.substring(url.lastIndexOf("/"), url.length());			
				String path = req.getSession().getServletContext().getRealPath("wms");
				File f = new File(path+fileName);
				boolean deleted = false;
				if(f.exists())
					deleted = f.delete();
				if(deleted)
					log.debug("File: "+fileName+" deleted");
				else
					log.debug("could not delete file: "+fileName);
			
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


	private void updateLayersInFile(JSONObject jsonService, HttpServletRequest req) {
		String url;
		try {
			url = jsonService.getString("capabilitiesUrl");
			String fileName = url.substring(url.lastIndexOf("/"), url.length());			
			String path = req.getSession().getServletContext().getRealPath("wms");
			File f = new File(path+fileName);	
			DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
			DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
			Document doc = dBuilder.parse(f);
			//change the xml structure
			doc = changeXml(doc, jsonService);
			//delete the file
			deleteWmsFile(jsonService, req);
			
			TransformerFactory tFactory = TransformerFactory.newInstance();
			Transformer transformer = tFactory.newTransformer();
			DOMSource source = new DOMSource(doc);
			StreamResult result = new StreamResult(f);
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
}
