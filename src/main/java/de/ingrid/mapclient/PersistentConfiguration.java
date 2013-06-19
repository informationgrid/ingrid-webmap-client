/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient;

import java.util.ArrayList;
import java.util.List;

import de.ingrid.mapclient.model.AreaCategory;
import de.ingrid.mapclient.model.Layer;
import de.ingrid.mapclient.model.MapExtend;
import de.ingrid.mapclient.model.MapServiceCategory;
import de.ingrid.mapclient.model.Projection;
import de.ingrid.mapclient.model.Scale;
import de.ingrid.mapclient.model.ServiceCategory;
import de.ingrid.mapclient.model.Setting;
import de.ingrid.mapclient.model.WmsService;

/**
 * Configuration holds the dynamic configuration of the map client that
 * is managed in the administration application.
 * 
 * @author ingo@wemove.com
 */
public class PersistentConfiguration {

	private String wmsCapUrl;
	private String featureUrl;
	private String wmsCopyright;

	private List<Layer> layers;
	private MapExtend mapExtend;
	private List<Projection> projections;
	private List<Scale> scales;
	private List<Setting> settings;
	private String proxyUrl;
	private List<MapServiceCategory> mapServiceCategories;
	private List<WmsService> wmsServices;
	private List<AreaCategory> areaCategories;
	private List<ServiceCategory> serviceCategories;
	



	/**
	 * Constructor
	 */
	public PersistentConfiguration() {
		this.wmsCapUrl = "";
		this.wmsCopyright = "";
		this.layers = new ArrayList<Layer>();
		this.mapExtend = new MapExtend();
		this.projections = new ArrayList<Projection>();
		this.scales = new ArrayList<Scale>();
		this.setSettings(new ArrayList<Setting>());
		this.proxyUrl = "";
		this.wmsServices = new ArrayList<WmsService>();
		this.mapServiceCategories = new ArrayList<MapServiceCategory>();
	}

	public List<ServiceCategory> getServiceCategories() {
		return serviceCategories;
	}

	public void setServiceCategories(List<ServiceCategory> serviceCategories) {
		this.serviceCategories = serviceCategories;
	}
	
	public List<MapServiceCategory> getMapServiceCategories() {
		return mapServiceCategories;
	}

	public void setMapServiceCategories(
			List<MapServiceCategory> mapServiceCategories) {
		this.mapServiceCategories = mapServiceCategories;
	}

	public List<WmsService> getWmsServices() {
		return wmsServices;
	}

	public void setWmsServices(List<WmsService> wmsServices) {
		this.wmsServices = wmsServices;
	}

	public String getWmsCapUrl() {
		return this.wmsCapUrl;
	}

	public void setWmsCapUrl(String wmsCapUrl) {
		this.wmsCapUrl = wmsCapUrl;
	}

	public List<Layer> getLayers() {
		return this.layers;
	}

	public void setLayers(List<Layer> layers) {
		this.layers = layers;
	}

	public MapExtend getMapExtend() {
		return this.mapExtend;
	}

	public void setMapExtend(MapExtend mapExtend) {
		this.mapExtend = mapExtend;
	}

	public List<Projection> getProjections() {
		return this.projections;
	}

	public void setProjections(List<Projection> projections) {
		this.projections = projections;
	}

	public List<Scale> getScales() {
		return this.scales;
	}

	public void setScales(List<Scale> scales) {
		this.scales = scales;
	}

	public String getProxyUrl() {
		return this.proxyUrl;
	}

	public void setProxyUrl(String proxyUrl) {
		this.proxyUrl = proxyUrl;
	}



	public List<AreaCategory> getAreaCategories() {
		return this.areaCategories;
	}

	public void setAreaCategeories(List<AreaCategory> areaCategories) {
		this.areaCategories = areaCategories;
	}
	public String getFeatureUrl() {
		return featureUrl;
	}

	public void setFeatureUrl(String featureUrl) {
		this.featureUrl = featureUrl;
	}

	public String getWmsCopyright() {
		return wmsCopyright;
	}

	public void setWmsCopyright(String wmsCopyright) {
		this.wmsCopyright = wmsCopyright;
	}

	public List<Setting> getSettings() {
		return settings;
	}

	public void setSettings(List<Setting> settings) {
		this.settings = settings;
	}
}
