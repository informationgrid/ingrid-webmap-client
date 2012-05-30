/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

import java.util.ArrayList;
import java.util.List;

/**
 * ServiceCategory is used to organize wms servers into a hierarchical structure.
 * 
 * @author miguel@wemove.com
 */
public class MapServiceCategory {

	private String name;
	private List<MapServiceCategory> mapServiceCategories = new ArrayList<MapServiceCategory>();
	private Integer id;


	public MapServiceCategory() {
	}
	
	public MapServiceCategory(String name, List<MapServiceCategory> mapServiceCategories, Integer id) {
		this.name = name;
		this.mapServiceCategories = mapServiceCategories;
		this.id = id;
	}

	public String getName() {
		return this.name;
	}

	public List<MapServiceCategory> getMapServiceCategories() {
		return this.mapServiceCategories;
	}
	public int getId() {
		return id;
	}

}
