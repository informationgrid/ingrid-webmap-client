/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * Layer represents a map layer
 * 
 * @author ingo@wemove.com
 */
public class Layer {

	private String name;
	private Boolean isBaseLayer;

	public Layer(String name, Boolean isBaseLayer) {
		this.name = name;
		this.isBaseLayer = isBaseLayer;
	}

	public String getName() {
		return this.name;
	}

	public Boolean isBaseLayer() {
		return this.isBaseLayer;
	}
}
