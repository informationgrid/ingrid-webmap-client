/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.io.IOException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.json.JsonHierarchicalStreamDriver;
import com.thoughtworks.xstream.io.json.JsonWriter;

import de.ingrid.mapclient.UserData;
import de.ingrid.mapclient.store.FileStore;

/**
 * SessionResource defines the interface for retrieving and storing user
 * session data like activate services and the map state
 * 
 * @author ingo@wemove.com
 */
@Path("/session")
public class SessionResource {

	/**
	 * Get the last saved session data for the current user
	 * @param req The httpd servlet request
	 * @return String representing a serialized UserData instance
	 */
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response getLastSessionData(@Context HttpServletRequest req) {

		HttpSession session= req.getSession(true);
		String sessionId = session.getId();

		FileStore store = FileStore.INSTANCE;
		try {
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
		catch (IOException ex) {
			return null;
		}
	}

	/**
	 * Store the session data for the current user
	 * @param data representing a serialized UserData instance
	 * @param req The httpd servlet request
	 * @throws JSONException
	 */
	@POST
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.TEXT_PLAIN)
	public String storeSessionData(String data, @Context HttpServletRequest req) {
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
			HttpSession session= req.getSession(true);
			String sessionId = session.getId();

			FileStore store = FileStore.INSTANCE;
			store.putRecord(sessionId, userData.serialize());
			return store.getAbsoluteFilename(sessionId);
		}
		catch (Exception ex) {
			throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
		}
	}
}