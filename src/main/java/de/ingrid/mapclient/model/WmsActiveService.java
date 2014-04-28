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
public class WmsActiveService {

	private String name;
	private String capabilitiesUrl;
	private String originalCapUrl;
	private List<String> checkedLayers = new ArrayList<String>();

	public WmsActiveService(){
	}



	public WmsActiveService(String name, String capabilitiesUrl, String originalCapUrl, List<String> checkedLayers){
		this.name = name;
		this.capabilitiesUrl = capabilitiesUrl;
		this.originalCapUrl = originalCapUrl;
		this.checkedLayers = checkedLayers;
	}

	public void setOriginalCapUrl(String originalCapUrl) {
		this.originalCapUrl = originalCapUrl;
	}

	public void setCapabilitiesUrl(String capabilitiesUrl) {
		this.capabilitiesUrl = capabilitiesUrl;
	}

	public void setCheckedLayers(List<String> checkedLayers) {
		this.checkedLayers = checkedLayers;
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
	
	public void setName(String name) {
		this.name = name;
	}	
}