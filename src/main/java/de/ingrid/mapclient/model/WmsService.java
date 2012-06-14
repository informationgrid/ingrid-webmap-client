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
	private String originalCapUrl;
	private List<String> checkedLayers = new ArrayList<String>();
//	private List<Integer> deactivatedLayers = new ArrayList<Integer>();

	public WmsService()
	{
	}



	public WmsService(String name, String capabilitiesUrl,List<MapServiceCategory> mapServiceCategories, String originalCapUrl, List<String> checkedLayers)//, List<Integer> deactivatedLayers)
	{
		this.name = name;
		this.capabilitiesUrl = capabilitiesUrl;
		this.mapServiceCategories = mapServiceCategories;
		this.originalCapUrl = originalCapUrl;
		this.checkedLayers = checkedLayers;
//		this.deactivatedLayers = deactivatedLayers;
	}

	public void setMapServiceCategories(
			List<MapServiceCategory> mapServiceCategories) {
		this.mapServiceCategories = mapServiceCategories;
	}



	public List<String> getCheckedLayers() {
		return checkedLayers;
	}

	public String getOriginalCapUrl() {
		return originalCapUrl;
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
	public void setName(String name) {
		this.name = name;
	}	
//	public List<Integer> getDeactivatedLayers() {
//		return deactivatedLayers;
//	}	
}
