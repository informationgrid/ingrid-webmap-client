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
	private String capabilitiesUrlOrg;
	private List<MapServiceCategory> mapServiceCategories = new ArrayList<MapServiceCategory>();
	private String originalCapUrl;
	private List<String> checkedLayers = new ArrayList<String>();
//	private List<Integer> deactivatedLayers = new ArrayList<Integer>();
	private String capabilitiesHash;
	private String capabilitiesHashUpdate;
	private String capabilitiesUpdateFlag;
	private Boolean capabilitiesUpdateMailStatus;

	public WmsService()
	{
	}



	public WmsService(String name, String capabilitiesUrl, String capabilitiesUrlOrg, List<MapServiceCategory> mapServiceCategories, String originalCapUrl, List<String> checkedLayers, String capabilitiesHash, String capabilitiesHashUpdate, String capabilitiesUpdateFlag, boolean capabilitiesUpdateMailStatus)//, List<Integer> deactivatedLayers)
	{
		this.name = name;
		this.capabilitiesUrl = capabilitiesUrl;
		this.capabilitiesUrlOrg = capabilitiesUrlOrg;
		this.mapServiceCategories = mapServiceCategories;
		this.originalCapUrl = originalCapUrl;
		this.checkedLayers = checkedLayers;
		this.capabilitiesHash = capabilitiesHash;
		this.capabilitiesHashUpdate = capabilitiesHashUpdate;
		this.capabilitiesUpdateFlag = capabilitiesUpdateFlag;
		this.capabilitiesUpdateMailStatus = capabilitiesUpdateMailStatus;
//		this.deactivatedLayers = deactivatedLayers;
	}

	public void setOriginalCapUrl(String originalCapUrl) {
		this.originalCapUrl = originalCapUrl;
	}

	public void setCapabilitiesUrl(String capabilitiesUrl) {
		this.capabilitiesUrl = capabilitiesUrl;
	}

	public void setMapServiceCategories(
			List<MapServiceCategory> mapServiceCategories) {
		this.mapServiceCategories = mapServiceCategories;
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
	
	public List<MapServiceCategory> getMapServiceCategories() {
		return mapServiceCategories;
	}	
	public void setName(String name) {
		this.name = name;
	}	
	
	public String getCapabilitiesUrlOrg() {
		return capabilitiesUrlOrg;
	}

	public void setCapabilitiesUrlOrg(String capabilitiesUrlOrg) {
		this.capabilitiesUrlOrg = capabilitiesUrlOrg;
	}



	public String getCapabilitiesHash() {
		return capabilitiesHash;
	}



	public void setCapabilitiesHash(String capabilitiesHash) {
		this.capabilitiesHash = capabilitiesHash;
	}

	public String getCapabilitiesHashUpdate() {
		return capabilitiesHashUpdate;
	}



	public void setCapabilitiesHashUpdate(String capabilitiesHashUpdate) {
		this.capabilitiesHashUpdate = capabilitiesHashUpdate;
	}



	public Boolean getCapabilitiesUpdateMailStatus() {
		return capabilitiesUpdateMailStatus;
	}



	public void setCapabilitiesUpdateMailStatus(
			Boolean capabilitiesUpdateMailStatus) {
		this.capabilitiesUpdateMailStatus = capabilitiesUpdateMailStatus;
	}



	public String getCapabilitiesUpdateFlag() {
		return capabilitiesUpdateFlag;
	}



	public void setCapabilitiesUpdateFlag(String capabilitiesUpdateFlag) {
		this.capabilitiesUpdateFlag = capabilitiesUpdateFlag;
	}
	
//	public List<Integer> getDeactivatedLayers() {
//		return deactivatedLayers;
//	}	
}
