/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * Scale represents a map scale
 * 
 * @author ingo@wemove.com
 */
public class Setting {

	private String key;
	private String name;
	private String value;

	public Setting() {
	}

	public Setting(String key, String name, String value) {
		this.key = key;
		this.name = name;
		this.value = value;
	}

	public String getKey() {
		return key;
	}

	public String getName() {
		return name;
	}

	public String getValue() {
		return value;
	}
}
