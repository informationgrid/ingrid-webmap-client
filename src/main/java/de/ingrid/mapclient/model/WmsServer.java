/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * WmsService represents a WMS server
 * 
 * @author ingo@wemove.com
 */
public class WmsServer {

	private String name;
	private String capabilitiesUrl;

	public WmsServer()
	{
	}

	public WmsServer(String name, String capabilitiesUrl)
	{
		this.name = name;
		this.capabilitiesUrl = capabilitiesUrl;
	}

	public String getName() {
		return this.name;
	}

	public String getCapabilitiesUrl() {
		return this.capabilitiesUrl;
	}
}
