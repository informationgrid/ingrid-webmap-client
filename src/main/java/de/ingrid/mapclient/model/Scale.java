/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * Scale represents a map scale
 * 
 * @author ingo@wemove.com
 */
public class Scale {

	private String name;
	private double zoomLevel;

	public Scale(String name, double zoomLevel) {
		this.name = name;
		this.zoomLevel = zoomLevel;
	}

	public String getName() {
		return this.name;
	}

	public double getZoomLevel() {
		return this.zoomLevel;
	}
}
