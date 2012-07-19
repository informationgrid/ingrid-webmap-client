/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient;

import java.util.ArrayList;
import java.util.List;

import de.ingrid.mapclient.model.AreaCategory;
import de.ingrid.mapclient.model.Layer;
import de.ingrid.mapclient.model.MapExtend;
import de.ingrid.mapclient.model.Projection;
import de.ingrid.mapclient.model.Scale;
import de.ingrid.mapclient.model.ServiceCategory;

/**
 * Configuration holds the dynamic configuration of the map client that
 * is managed in the administration application.
 * 
 * @author ingo@wemove.com
 */
public class Configuration {

	private String wmsCapUrl;
	private String featureUrl;


	private List<Layer> layers;
	private MapExtend mapExtend;
	private List<Projection> projections;
	private List<Scale> scales;
	private String proxyUrl;
	private List<ServiceCategory> serviceCategories;
	private List<AreaCategory> areaCategories;

	/**
	 * Constructor
	 */
	public Configuration() {
		this.wmsCapUrl = "";
		this.layers = new ArrayList<Layer>();
		this.mapExtend = new MapExtend();
		this.projections = new ArrayList<Projection>();
		this.scales = new ArrayList<Scale>();
		this.proxyUrl = "";
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

	public List<ServiceCategory> getServiceCategories() {
		return this.serviceCategories;
	}

	public void setServiceCategories(List<ServiceCategory> serviceCategories) {
		this.serviceCategories = serviceCategories;
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
}
