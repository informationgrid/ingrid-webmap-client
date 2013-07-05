/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
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

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.UserData;
import de.ingrid.mapclient.store.Store;
import de.ingrid.mapclient.store.StoreManager;
import de.ingrid.mapclient.store.UserStore;
import de.ingrid.mapclient.url.UrlManager;
import de.ingrid.mapclient.url.UrlMapper;

/**
 * UserDataResource defines the interface for retrieving and storing user data
 * like activate services and the map state.
 * 
 * @author ingo@wemove.com
 */
@Path("/data")
public class UserDataResource {

	private static final Logger log = Logger.getLogger(UserDataResource.class);

	/**
	 * Path to map data retrievable by short urls
	 */
	private static final String MAPS_PATH = "maps";

	/**
	 * Path to session data functions
	 */
	private static final String SESSION_PATH = "session";

	/**
	 * Path to user data functions
	 */
	private static final String USER_PATH = "user";

	/**
	 * Path to current user map generation
	 */
	private static final String CURRENT_MAP = "currentmap";
	
	/**
	 * Path to current user map location
	 */
	private static final String MAP_SITE = "mapsite";


	/**
	 * Load the data for the given short url
	 * 
	 * @param shortUrl
	 *            The short url
	 * @return String representing a serialized UserData instance
	 */
	@GET
	@Path(MAPS_PATH + "/{shortUrl}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response loadData(@PathParam("shortUrl") String shortUrl) {
		try {
			// translate the short url
			String longUrl = UrlManager.INSTANCE.getUrlMapper().getLongUrl(
					shortUrl);
			// split the long url into user id and id
			String[] urlParts = longUrl.split("/");
			if (urlParts.length != 2) {
				throw new IllegalArgumentException(
						"The long url expected to have the format userId/id");
			}
			String userId = urlParts[0];
			String id = urlParts[1];
			return this.loadUserData(userId, id);
		} catch (Exception ex) {
			log.error("Error retrieving data", ex);
			return null;
		}
	}

	/**
	 * Get the last saved data for the session belonging to the given request
	 * 
	 * @param req
	 *            The httpd servlet request identifying the session
	 * @return String representing a serialized UserData instance
	 */
	@GET
	@Path(SESSION_PATH)
	@Produces(MediaType.APPLICATION_JSON)
	public Response getLastSessionData(@Context HttpServletRequest req) {

		HttpSession session = req.getSession(true);
		String sessionId = session.getId();

		try {
			Store store = StoreManager.INSTANCE.getSessionStore();
			String xmlData = store.getRecord(sessionId);

			UserData userData = UserData.unserialize(xmlData);
			XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
				@Override
				public HierarchicalStreamWriter createWriter(Writer writer) {
					return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
				}
			});
			String json = xstream.toXML(userData);
			return Response.ok(json).build();
		} catch (Exception ex) {
			// no logging, because we do not always expect to find stored
			// session data
			// log.error("Error retrieving session data", ex);
			return null;
		}
	}

	/**
	 * Store the given data for the session belonging to the given request
	 * 
	 * @param data
	 *            representing a serialized UserData instance
	 * @param req
	 *            The httpd servlet request
	 */
	@POST
	@Path(SESSION_PATH)
	@Consumes(MediaType.TEXT_PLAIN)
	public void storeSessionData(String data, @Context HttpServletRequest req) {

		HttpSession session = req.getSession(true);
		String sessionId = session.getId();

		try {
			// convert json string to UserData
			JSONObject rootObj = new JSONObject(data);
			String wmcDocument = rootObj.getString("wmcDocument");
//			log.debug("wmc document: "+wmcDocument);
			List<String> activeServices = new ArrayList<String>();
			JSONArray activeServicesTmp = rootObj
					.getJSONArray("activeServices");
			log.debug("active services count: "+activeServicesTmp.length());
			for (int i = 0, count = activeServicesTmp.length(); i < count; i++) {
				String capabilitiesUrl = activeServicesTmp.getString(i);
				activeServices.add(capabilitiesUrl);
				log.debug("capabilities url: "+capabilitiesUrl);
			}

			List<Map<String, String>> kmlArray = new ArrayList<Map<String, String>>();
			JSONArray kmlTmp = rootObj.getJSONArray("kmlArray");
			for (int i = 0, count = kmlTmp.length(); i < count; i++) {
				if (kmlTmp.get(i) instanceof JSONObject) {
					JSONObject kmlTmpEntry = kmlTmp.getJSONObject(i);

					Map<String, String> kmlEntry = new HashMap<String, String>();
					kmlEntry.put("title", kmlTmpEntry.get("title").toString());
					kmlEntry.put("url", kmlTmpEntry.get("url").toString());
					kmlArray.add(kmlEntry);
				} else if (kmlTmp.get(i) instanceof JSONArray) {
					JSONArray kmlTmpEntries = kmlTmp.getJSONArray(i);
					Map<String, String> kmlTmpEntry = new HashMap<String, String>();
					for (int j = 0; j < kmlTmpEntries.length(); j++) {
						JSONArray kmlTmpAddedEntries = kmlTmpEntries
								.getJSONArray(j);
						kmlTmpEntry.put(kmlTmpAddedEntries.getString(0),
								kmlTmpAddedEntries.getString(1));
					}
					kmlArray.add(kmlTmpEntry);
				}

			}

			List<Map<String, String>> selectedLayersByService = new ArrayList<Map<String, String>>();
			JSONArray selectedLayersByServiceTmp = rootObj.getJSONArray("selectedLayersByService");
			for (int i = 0, count = selectedLayersByServiceTmp.length(); i < count; i++) {
				if (selectedLayersByServiceTmp.get(i) instanceof JSONObject) {
					JSONObject jsonEntry = selectedLayersByServiceTmp.getJSONObject(i);
	
					Map<String, String> entry = new HashMap<String, String>();
					entry.put("id", jsonEntry.get("id").toString());
					entry.put("capabilitiesUrl", jsonEntry.get("capabilitiesUrl").toString());
					entry.put("checked", jsonEntry.get("checked").toString());
					entry.put("cls", jsonEntry.get("cls").toString());
					entry.put("leaf", jsonEntry.get("leaf").toString());
					selectedLayersByService.add(entry);
				}
			}
			
			UserData userData = new UserData();
			userData.setId(sessionId);
			userData.setWmcDocument(wmcDocument);
			userData.setActiveServices(activeServices);
			userData.setKml(kmlArray);
			userData.setSelectedLayersByService(selectedLayersByService);

			// store the data
			Store store = StoreManager.INSTANCE.getSessionStore();
			store.putRecord(sessionId, userData.serialize());
		} catch (Exception ex) {
			log.error("Error storing session data", ex);
			throw new WebApplicationException(ex,
					Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * List all stored data for the given user id
	 * 
	 * @return String containing a JSON encoded array of data objects with keys
	 *         id, title, description
	 */
	@GET
	@Path(USER_PATH + "/{userId}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response listUserData(@PathParam("userId") String userId) {

		try {
			UrlMapper urlMapper = UrlManager.INSTANCE.getUrlMapper();

			UserStore store = StoreManager.INSTANCE.getUserStore();
			List<String> ids = store.getRecordIds(userId);

			// create the list (we only keep id, title, description and set the
			// other values null)
			List<UserData> data = new ArrayList<UserData>();
			for (String id : ids) {
				String xmlData = store.getRecord(userId, id);
				UserData userData = UserData.unserialize(xmlData);
				userData.setId(id);
				userData.setShortUrl(urlMapper.getShortUrl(userId + "/" + id));
				userData.setActiveServices(null);
				userData.setLocationKey(null);
				userData.setWmcDocument(null);
				data.add(userData);
			}
			XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
				@Override
				public HierarchicalStreamWriter createWriter(Writer writer) {
					return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
				}
			});
			String json = xstream.toXML(data);
			return Response.ok(json).build();
		} catch (Exception ex) {
			log.error("Error listing user data", ex);
			return null;
		}
	}

	/**
	 * Load the data for the given user id and data id
	 * 
	 * @param userId
	 *            The user id
	 * @param id
	 *            The data id
	 * @return String representing a serialized UserData instance
	 */
	@GET
	@Path(USER_PATH + "/{userId}/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response loadUserData(@PathParam("userId") String userId,
			@PathParam("id") String id) {
		try {
			UserStore store = StoreManager.INSTANCE.getUserStore();
			String xmlData = store.getRecord(userId, id);

			UserData userData = UserData.unserialize(xmlData);
			XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
				@Override
				public HierarchicalStreamWriter createWriter(Writer writer) {
					return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
				}
			});
			String json = xstream.toXML(userData);
			return Response.ok(json).build();
		} catch (Exception ex) {
			log.error("Error retrieving user data", ex);
			return null;
		}
	}

	/**
	 * Store the given data for the given user id
	 * 
	 * @param data
	 *            representing a serialized UserData instance
	 * @param userId
	 *            The user id
	 */
	@POST
	@Path(USER_PATH + "/{userId}")
	@Consumes(MediaType.TEXT_PLAIN)
	public void storeUserData(String data, @PathParam("userId") String userId) {
		try {
			// convert json string to UserData
			JSONObject rootObj = new JSONObject(data);
			String title = rootObj.getString("title");
			String description = rootObj.getString("description");
			String wmcDocument = rootObj.getString("wmcDocument");

			List<String> activeServices = new ArrayList<String>();
			JSONArray activeServicesTmp = rootObj.getJSONArray("activeServices");
			for (int i = 0, count = activeServicesTmp.length(); i < count; i++) {
				String capabilitiesUrl = activeServicesTmp.getString(i);
				activeServices.add(capabilitiesUrl);
			}

			List<Map<String,String>> selectedLayersByService = new ArrayList<Map<String,String>>();
			JSONArray selectedLayersByServiceTmp = rootObj.getJSONArray("selectedLayersByService");
			for (int i = 0, count = selectedLayersByServiceTmp.length(); i < count; i++) {
				Map<String, String> map = new HashMap<String, String>();
				JSONObject obj = selectedLayersByServiceTmp.getJSONObject(i);
				map.put("id", (String) obj.get("id"));
				map.put("cls", (String) obj.get("cls"));
				map.put("checked", (String) obj.get("checked").toString());
				map.put("leaf", (String) obj.get("leaf").toString());
				map.put("capabilitiesUrl", (String) obj.get("capabilitiesUrl"));
				selectedLayersByService.add(map);
			}
			
			
			UserData userData = new UserData();
			userData.setTitle(title);
			userData.setDescription(description);
			userData.setDate(Calendar.getInstance().getTime());
			userData.setWmcDocument(wmcDocument);
			userData.setActiveServices(activeServices);
			userData.setSelectedLayersByService(selectedLayersByService);

			// create a unique record id
			String recordId = UUID.randomUUID().toString();

			UserStore store = StoreManager.INSTANCE.getUserStore();
			store.putRecord(userId, recordId, userData.serialize());
		} catch (Exception ex) {
			log.error("Error storing user data", ex);
			throw new WebApplicationException(ex,
					Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Delete the data for the given user id and data id
	 * 
	 * @param userId
	 *            The user id
	 * @param id
	 *            The data id
	 */
	@DELETE
	@Path(USER_PATH + "/{userId}/{id}")
	@Consumes(MediaType.TEXT_PLAIN)
	public void removeUserData(String data, @PathParam("userId") String userId,
			@PathParam("id") String id) {
		try {
			UserStore store = StoreManager.INSTANCE.getUserStore();
			store.removeRecord(userId, id);
		} catch (Exception ex) {
			log.error("Error removing user data", ex);
			throw new WebApplicationException(ex,
					Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Get the current map as xml file in wmc format
	 * 

	 * @param data
	 *            the map data
	 * @return String representing a serialized User map as wmc document
	 */
	@POST
	@Path(CURRENT_MAP)
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.TEXT_PLAIN)
	public Response getCurrentMap(String data) {

		JSONObject rootObj;
		try {
			rootObj = new JSONObject(data);
			String wmcDocument = rootObj.getString("wmcDocument");
			String title = rootObj.getString("title");
			String mapDir = ConfigurationProvider.INSTANCE.getDownloadmapDir();
			File f = new File(mapDir);
			String s = f.getAbsolutePath();
			File file = new File(s, title + ".xml");
			String filePath = file.getAbsolutePath();
			BufferedWriter out;
			out = new BufferedWriter(new OutputStreamWriter(
					new FileOutputStream(filePath), "UTF8"));
			out.write(wmcDocument);
			out.close();
			out = null;
			return Response.ok(file.getName()).build();
		} catch (JSONException e) {
			log.error("Error with the json object", e);
			e.printStackTrace();
			return null;
		} catch (UnsupportedEncodingException e) {
			log.error("Error with the encoding", e);
			e.printStackTrace();
			return null;
		} catch (FileNotFoundException e) {
			log.error("File not Found Exception", e);
			e.printStackTrace();
			return null;
		} catch (IOException e) {
			log.error("I/O Exception", e);
			e.printStackTrace();
			return null;
		}

	}
	
	/**
	 * Get the current map as xml file in wmc format
	 * 

	 * @param the map title
	 * @return Xml representing a serialized User map as wmc document
	 */
	@GET
	@Path(MAP_SITE)
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.APPLICATION_XML)
	public Response downloadMap(@QueryParam("title") String title) {


			
			String mapDir = ConfigurationProvider.INSTANCE.getDownloadmapDir();
			File f = new File(mapDir);
			String s = f.getAbsolutePath();
			File file = new File(s, title);
			if(file.exists())
			return Response.ok(file).build();
			else 
			return null;	
			

	}
}