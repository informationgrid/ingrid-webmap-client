/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient;

import java.util.ArrayList;
import java.util.List;

import com.thoughtworks.xstream.XStream;

import de.ingrid.mapclient.model.LocationKey;

/**
 * UserData holds the data that describes a user's map client session.
 * @note This class only contains a WMC document string, not a WmcDocument instance
 * in order to achieve simpler serialized representation
 *
 * @author ingo@wemove.com
 */
public class UserData {

	private String id;
	private String title;
	private String description;
	private String wmcDocument;
	private LocationKey locationKey;
	private List<String> activeServices = new ArrayList<String>();

	public void setId(String id) {
		this.id = id;
	}

	public String getId() {
		return this.id;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getTitle() {
		return this.title;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getDescription() {
		return this.description;
	}

	public void setWmcDocument(String wmcDocument) {
		this.wmcDocument = wmcDocument;
	}

	public String getWmcDocument() {
		return this.wmcDocument;
	}

	public void setLocationKey(LocationKey locationKey) {
		this.locationKey = locationKey;
	}

	public LocationKey getLocationKey() {
		return this.locationKey;
	}

	public void setActiveServices(List<String> activeServices) {
		this.activeServices = activeServices;
	}

	public List<String> getActiveServices() {
		return this.activeServices;
	}

	/**
	 * Get a xml representation of the instance
	 * @return String
	 */
	public String serialize() {
		XStream xstream = new XStream();
		setXStreamAliases(xstream);
		return xstream.toXML(this);
	}

	/**
	 * Create the instance from an xml representation
	 * @return String
	 */
	public static UserData unserialize(String xml) {
		XStream xstream = new XStream();
		setXStreamAliases(xstream);
		UserData data = (UserData)xstream.fromXML(xml);
		return data;
	}

	/**
	 * Set the xml aliases for model classes
	 * @param xstream XStream instance
	 */
	private static void setXStreamAliases(XStream xstream) {
		xstream.alias("locationKey", LocationKey.class);
	}
}
