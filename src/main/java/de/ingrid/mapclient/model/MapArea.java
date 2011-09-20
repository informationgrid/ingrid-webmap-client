/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * MapArea represents a map area
 * 
 * @author ingo@wemove.com
 */
public class MapArea extends MapExtend {

	private String name;

	public MapArea() {
	}

	public MapArea(String name, double north, double south,
			double west, double east) {
		super(north, south, west, east);
		this.name = name;
	}

	public String getName() {
		return this.name;
	}
}
