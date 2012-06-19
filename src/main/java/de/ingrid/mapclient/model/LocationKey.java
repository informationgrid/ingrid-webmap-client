/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * LocationKey represents a location key
 * 
 * @author ingo@wemove.com
 */
public class LocationKey {

	private int rsKey;
	private int agsKey;

	public LocationKey() {
	}

	public LocationKey(int rsKey, int agsKey) {
		this.rsKey = rsKey;
		this.agsKey = agsKey;
	}

	public int getRsKey() {
		return this.rsKey;
	}

	public int getAgsKey() {
		return this.agsKey;
	}
}
