/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.io.IOException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Arrays;
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

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.json.JsonHierarchicalStreamDriver;
import com.thoughtworks.xstream.io.json.JsonWriter;

import de.ingrid.mapclient.Configuration;
import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.PersistentConfiguration;
import de.ingrid.mapclient.model.AreaCategory;
import de.ingrid.mapclient.model.Layer;
import de.ingrid.mapclient.model.MapArea;
import de.ingrid.mapclient.model.MapExtend;
import de.ingrid.mapclient.model.Projection;
import de.ingrid.mapclient.model.Scale;
import de.ingrid.mapclient.model.ServiceCategory;
import de.ingrid.mapclient.model.WmsServer;

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
}