/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

import java.util.ArrayList;
import java.util.List;

/**
 * WmsService represents a WMS server
 * 
 * @author miguel@wemove.com
 */
public class WmsService {

	private String name;
	private String capabilitiesUrl;
	private List<MapServiceCategory> mapServiceCategories = new ArrayList<MapServiceCategory>();

	public WmsService()
	{
	}

	public WmsService(String name, String capabilitiesUrl,List<MapServiceCategory> mapServiceCategories)
	{
		this.name = name;
		this.capabilitiesUrl = capabilitiesUrl;
		this.mapServiceCategories = mapServiceCategories;
	}

	public String getName() {
		return this.name;
	}

	public String getCapabilitiesUrl() {
		return this.capabilitiesUrl;
	}
	
	public List<MapServiceCategory> getMapServiceCategories() {
		return mapServiceCategories;
	}	
}
