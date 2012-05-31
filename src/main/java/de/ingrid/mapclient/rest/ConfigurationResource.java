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
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
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
import de.ingrid.mapclient.model.ServiceCategory;
import de.ingrid.mapclient.model.WmsServer;
import de.ingrid.mapclient.model.WmsService;
import de.ingrid.mapclient.url.impl.DbUrlMapper;
import de.ingrid.utils.xml.XMLUtils;
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
	 *  deactivatedLayers: [6,9,...],
	 *  checkedLayers: [3,5,7]}
	 *  the originalCapUrl HAS to be the original cap url, if the service we receive is already a copy!!!
	 * @param String containing the object
	 */
	@POST
	@Path(COPY_SERVICE)
	@Consumes(MediaType.TEXT_PLAIN)
	public void copyService(String serviceCopy, @Context HttpServletRequest req) throws IOException {
		try {
				JSONObject json = new JSONObject(serviceCopy);
				String url = makeCopyOfService(json, req);
				insertCopyIntoConfig(url, json);
		}
		catch (Exception ex) {
			log.error("Error setting default capabilities url", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}	
	
	

	private void insertCopyIntoConfig(String url, JSONObject json) {
			
			try {
				ConfigurationProvider p = ConfigurationProvider.INSTANCE;
				JSONArray jsonArray = json.getJSONArray("categories");
				JSONArray jsonCheckedLayers = json.getJSONArray("checkedLayers");
				JSONArray jsonDeactivatedLayers = json.getJSONArray("deactivatedLayers");
				List<Integer> checkLayers = new ArrayList<Integer>();
				int len = jsonCheckedLayers.length();
				for(int i = 0; i < len; i++){
					checkLayers.add(jsonCheckedLayers.getInt(i));
				}
				//we have to reassemble the list, since by deleting layers the indices are messed up 

				for (int j = 0; j < jsonDeactivatedLayers.length(); j++){
					for(int k = 0; k < jsonCheckedLayers.length(); k++){
						int checked;
						if(jsonDeactivatedLayers.getInt(j) < jsonCheckedLayers.getInt(k)){
							checked = checkLayers.get(k).intValue();
							checked--;
							checkLayers.set(k, (Integer)checked);
						}
					}
				}
				

				String title = json.getString("title");
				String originalCapUrl = json.getString("originalCapUrl");
				WmsService wmsService = new WmsService(title, url, new ArrayList<MapServiceCategory>(), originalCapUrl, checkLayers);
				for (int i = 0; i < jsonArray.length(); i++){
					int id = jsonArray.getInt(i);
					List<MapServiceCategory> catList = p.getPersistentConfiguration().getMapServiceCategories();
					Iterator<MapServiceCategory> it = catList.iterator();
					boolean cond = true;
					while(it.hasNext() && cond){
						MapServiceCategory cat = it.next();
						int catId = cat.getId();
						if(catId == id){
							wmsService.getMapServiceCategories().add(cat);
							cond = false;
						}else{
							List<MapServiceCategory> subCats = cat.getMapServiceCategories();
							Iterator<MapServiceCategory> catIt = subCats.iterator();
							while(catIt.hasNext() && cond){
								MapServiceCategory subCat = catIt.next();
								if(subCat.getId() == id){
									wmsService.getMapServiceCategories().add(subCat);
									cond = false;
								}
							}
						}
					}
				}
				
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
			String path = req.getRealPath("wms");
			urlPrefix = req.getRequestURL().toString();
			urlPrefix = urlPrefix.substring(0, urlPrefix.indexOf("rest/"));
			urlPrefix += "wms/";
			TransformerFactory tFactory = TransformerFactory.newInstance();
			Transformer transformer = tFactory.newTransformer();
			DOMSource source = new DOMSource(doc);
			url = title + ".xml";
			File f = new File(path + "/" + url);
			if (f.exists())
				do {
					url = new DbUrlMapper().createShortUrl(title);
					url = title + url + ".xml";
					f = new File(path + "/" + url);
				} while (f.exists());
			else
				log.debug("created file: " + f.getName());
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
	private Document changeXml(Document doc, JSONObject json) throws TransformerException {
		XPath xpath = XPathFactory.newInstance().newXPath();

		Node titleNode = null;
		try {
		JSONArray deactLayers = json.getJSONArray("deactivatedLayers");
		JSONObject layerNameChanges = json.getJSONObject("layerNameChanges");
		Iterator<String> it = layerNameChanges.keys();
		while(it.hasNext()){
			String layerId = it.next();
			Node n = (Node)xpath.evaluate("//Layer/Layer["+layerId+"]", doc, XPathConstants.NODE);
			Node titleNameNode = n.getFirstChild().getNextSibling();
			titleNameNode.setTextContent(layerNameChanges.getString(layerId));
			
		}

				
		String title = json.getString("title");

			//remove layers
			for(int i = 0; i < deactLayers.length();i++){
			int id = deactLayers.getInt(i);
			Node e = (Node)xpath.evaluate("//Layer/Layer["+(id - i)+"]", doc, XPathConstants.NODE);
			//we have to substract i from id, because everytime we remove a node, the index of the nodelist changes

			log.debug("removed node name: "+e.getNodeName());
			e.getParentNode().removeChild(e);
			}
			//change title
			titleNode = (Node)xpath.evaluate("//Service/Title", doc, XPathConstants.NODE);	
			titleNode.setTextContent(title);
			log.debug(XMLUtils.toString(doc));
		} catch (XPathExpressionException e) {
			log.error("error on xpathing document: "+e.getMessage());
			e.printStackTrace();
		} catch (JSONException e) {
			log.error("error on retrieving data from json document: "+e.getMessage());
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
}