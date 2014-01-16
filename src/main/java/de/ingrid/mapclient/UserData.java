/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

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

	private static final SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

	private String id;
	private String shortUrl; // TODO: transient
	private String title;
	private String description;
	private String date; // we use a string value to better control un-/serialization format
	private String wmcDocument;
	private String url;
	private LocationKey locationKey;
	private List<String> activeServices = new ArrayList<String>();
	private List<Map<String, String>> kmlArray = new ArrayList<Map<String, String>>();
	private List<Map<String, String>> selectedLayersByService= new ArrayList<Map<String, String>>();
	private List<Map<String, String>> treeState = new ArrayList<Map<String, String>>();
	
	public void setId(String id) {
		this.id = id;
	}

	public String getId() {
		return this.id;
	}

	public void setShortUrl(String shortUrl) {
		this.shortUrl = shortUrl;
	}

	public String getShortUrl() {
		return this.shortUrl;
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

	public void setDate(Date date) {
		this.date = df.format(date);
	}

	public Date getDate() throws ParseException {
		return df.parse(this.date);
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

	public List<Map<String, String>> getKml() {
		return kmlArray;
	}

	public void setKml(List<Map<String, String>> kml) {
		this.kmlArray = kml;
	}

	public List<Map<String, String>> getSelectedLayersByService() {
		return selectedLayersByService;
	}

	public void setSelectedLayersByService(List<Map<String, String>> selectedLayersByService) {
		this.selectedLayersByService = selectedLayersByService;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public List<Map<String, String>> getTreeState() {
		return treeState;
	}

	public void setTreeState(List<Map<String, String>> treeState) {
		this.treeState = treeState;
	}
}
