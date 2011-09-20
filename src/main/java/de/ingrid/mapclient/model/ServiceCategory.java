/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

import java.util.ArrayList;
import java.util.List;

/**
 * ServiceCategory is used to organize wms servers into a hierarchical structure.
 * 
 * @author ingo@wemove.com
 */
public class ServiceCategory {

	private String name;
	private List<ServiceCategory> serviceCategories = new ArrayList<ServiceCategory>();
	private List<WmsServer> services = new ArrayList<WmsServer>();

	public ServiceCategory(String name, List<ServiceCategory> serviceCategories, List<WmsServer> services) {
		this.name = name;
		this.serviceCategories = serviceCategories;
		this.services = services;
	}

	public String getName() {
		return this.name;
	}

	public List<ServiceCategory> getServiceCategories() {
		return this.serviceCategories;
	}

	public List<WmsServer> getServices() {
		return this.services;
	}
}
