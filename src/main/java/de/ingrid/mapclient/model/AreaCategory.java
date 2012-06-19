/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

import java.util.ArrayList;
import java.util.List;

/**
 * AreaCategory is used to organize map areas into a hierarchical structure.
 * 
 * @author ingo@wemove.com
 */
public class AreaCategory {

	private String name;
	private List<AreaCategory> areaCategories = new ArrayList<AreaCategory>();
	private List<MapArea> areas = new ArrayList<MapArea>();

	public AreaCategory() {
	}

	public AreaCategory(String name, List<AreaCategory> areaCategories, List<MapArea> areas) {
		this.name = name;
		this.areaCategories = areaCategories;
		this.areas = areas;
	}

	public String getName() {
		return this.name;
	}

	public List<AreaCategory> getAreaCategories() {
		return this.areaCategories;
	}

	public List<MapArea> getAreas() {
		return this.areas;
	}
}
