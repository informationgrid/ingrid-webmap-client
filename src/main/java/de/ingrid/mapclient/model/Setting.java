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
	private String group;

	public Setting() {
	}

	public Setting(String key, String name, String value, String group) {
		this.key = key;
		this.name = name;
		this.value = value;
		this.group = group;
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

	public String getGroup() {
		return group;
	}

	public void setGroup(String group) {
		this.group = group;
	}
}
