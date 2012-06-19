/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * MapExtend represents a map extend
 * 
 * @author ingo@wemove.com
 */
public class MapExtend {

	private double north = 0.0;
	private double south = 0.0;
	private double west = 0.0;
	private double east = 0.0;

	public MapExtend() {
	}

	public MapExtend(double north, double south, double west, double east) {
		this.north = north;
		this.south = south;
		this.west = west;
		this.east = east;
	}

	public double getNorth() {
		return this.north;
	}

	public double getSouth() {
		return this.south;
	}

	public double getWest() {
		return this.west;
	}

	public double getEast() {
		return this.east;
	}
}
