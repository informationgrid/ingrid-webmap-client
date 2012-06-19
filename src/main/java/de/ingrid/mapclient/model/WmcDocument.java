/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * WmcDocument represents a WMC document
 * 
 * @author ingo@wemove.com
 */
public class WmcDocument {

	private String xml;

	public WmcDocument() {
	}
	
	public WmcDocument(String xml) {
		this.xml = xml;
	}

	public MapExtend getMapExtend() {
		// TODO extract the map extend from xml
		return null;
	}
}
