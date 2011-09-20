/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * Projection represents a map projection
 * 
 * @author ingo@wemove.com
 */
public class Projection {

	private String name;
	private String epsgCode;

	public Projection(String name, String epsgCode) {
		this.name = name;
		this.epsgCode = epsgCode;
	}

	public String getName() {
		return this.name;
	}

	public String getEpsgCode() {
		return this.epsgCode;
	}
}
