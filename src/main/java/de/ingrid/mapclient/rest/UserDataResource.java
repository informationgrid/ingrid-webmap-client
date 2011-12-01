/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.io.Writer;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
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
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.json.JsonHierarchicalStreamDriver;
import com.thoughtworks.xstream.io.json.JsonWriter;

import de.ingrid.mapclient.UserData;
import de.ingrid.mapclient.store.Store;
import de.ingrid.mapclient.store.StoreManager;
import de.ingrid.mapclient.store.UserStore;
import de.ingrid.mapclient.url.UrlManager;
import de.ingrid.mapclient.url.UrlMapper;

/**
 * UserDataResource defines the interface for retrieving and storing user
 * data like activate services and the map state.
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
	 * Load the data for the given short url
	 * @param shortUrl The short url
	 * @return String representing a serialized UserData instance
	 */
	@GET
	@Path(MAPS_PATH+"/{shortUrl}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response loadData(@PathParam("shortUrl") String shortUrl) {
		try {
			// translate the short url
			String longUrl = UrlManager.INSTANCE.getUrlMapper().getLongUrl(shortUrl);
			// split the long url into user id and id
			String[] urlParts = longUrl.split("/");
			if (urlParts.length != 2) {
				throw new IllegalArgumentException("The long url expected to have the format userId/id");
			}
			String userId = urlParts[0];
			String id = urlParts[1];
			return this.loadUserData(userId, id);
		}
		catch (Exception ex) {
			log.error("Error retrieving data", ex);
			return null;
		}
	}

	/**
	 * Get the last saved data for the session belonging to the given request
	 * @param req The httpd servlet request identifying the session
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
		}
		catch (Exception ex) {
			// no logging, because we do not always expect to find stored session data
			//log.error("Error retrieving session data", ex);
			return null;
		}
	}

	/**
	 * Store the given data for the session belonging to the given request
	 * @param data representing a serialized UserData instance
	 * @param req The httpd servlet request
	 */
	@POST
	@Path(SESSION_PATH)
	@Consumes(MediaType.TEXT_PLAIN)
	public void storeSessionData(String data, @Context HttpServletRequest req) {

		HttpSession session= req.getSession(true);
		String sessionId = session.getId();

		try {
			// convert json string to UserData
			JSONObject rootObj = new JSONObject(data);
			String wmcDocument = rootObj.getString("wmcDocument");

			List<String> activeServices = new ArrayList<String>();
			JSONArray activeServicesTmp = rootObj.getJSONArray("activeServices");
			for (int i=0, count=activeServicesTmp.length(); i<count; i++) {
				String capabilitiesUrl = activeServicesTmp.getString(i);
				activeServices.add(capabilitiesUrl);
			}

			UserData userData = new UserData();
			userData.setWmcDocument(wmcDocument);
			userData.setActiveServices(activeServices);

			// store the data
			Store store = StoreManager.INSTANCE.getSessionStore();
			store.putRecord(sessionId, userData.serialize());
		}
		catch (Exception ex) {
			log.error("Error storing session data", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * List all stored data for the given user id
	 * @return String containing a JSON encoded array of data
	 * 		objects with keys id, title, description
	 */
	@GET
	@Path(USER_PATH+"/{userId}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response listUserData(@PathParam("userId") String userId) {

		try {
			UrlMapper urlMapper = UrlManager.INSTANCE.getUrlMapper();

			UserStore store = StoreManager.INSTANCE.getUserStore();
			List<String> ids = store.getRecordIds(userId);

			// create the list (we only keep id, title, description and set the other values null)
			List<UserData> data = new ArrayList<UserData>();
			for (String id : ids) {
				String xmlData = store.getRecord(userId, id);
				UserData userData = UserData.unserialize(xmlData);
				userData.setId(id);
				userData.setShortUrl(urlMapper.getShortUrl(userId+"/"+id));
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
		}
		catch (Exception ex) {
			log.error("Error listing user data", ex);
			return null;
		}
	}

	/**
	 * Load the data for the given user id and data id
	 * @param userId The user id
	 * @param id The data id
	 * @return String representing a serialized UserData instance
	 */
	@GET
	@Path(USER_PATH+"/{userId}/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response loadUserData(@PathParam("userId") String userId, @PathParam("id") String id) {
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
		}
		catch (Exception ex) {
			log.error("Error retrieving user data", ex);
			return null;
		}
	}

	/**
	 * Store the given data for the given user id
	 * @param data representing a serialized UserData instance
	 * @param userId The user id
	 */
	@POST
	@Path(USER_PATH+"/{userId}")
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
			for (int i=0, count=activeServicesTmp.length(); i<count; i++) {
				String capabilitiesUrl = activeServicesTmp.getString(i);
				activeServices.add(capabilitiesUrl);
			}

			UserData userData = new UserData();
			userData.setTitle(title);
			userData.setDescription(description);
			userData.setDate(Calendar.getInstance().getTime());
			userData.setWmcDocument(wmcDocument);
			userData.setActiveServices(activeServices);

			// create a unique record id
			String recordId = UUID.randomUUID().toString();

			UserStore store = StoreManager.INSTANCE.getUserStore();
			store.putRecord(userId, recordId, userData.serialize());
		}
		catch (Exception ex) {
			log.error("Error storing user data", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}

	/**
	 * Delete the data for the given user id and data id
	 * @param userId The user id
	 * @param id The data id
	 */
	@DELETE
	@Path(USER_PATH+"/{userId}/{id}")
	@Consumes(MediaType.TEXT_PLAIN)
	public void removeUserData(String data, @PathParam("userId") String userId, @PathParam("id") String id) {
		try {
			UserStore store = StoreManager.INSTANCE.getUserStore();
			store.removeRecord(userId, id);
		}
		catch (Exception ex) {
			log.error("Error removing user data", ex);
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
}