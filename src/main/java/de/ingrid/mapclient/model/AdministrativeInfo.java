/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * AdministrativeInfo represents AdministrativeInfo
 * the type: i.e. Province, municipality
 * rs: the code of the name of the type
 * the name of the chosen type
 * 
 * @author miguel@wemove.com
 */
public class AdministrativeInfo {
	private String type;
	private String rs;
	private String name;	
	


	public AdministrativeInfo() {
	}
	public AdministrativeInfo(String type, String rs, String name) {
		super();
		this.type = type;
		this.rs = rs;
		this.name = name;
	}
	
	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getRs() {
		return rs;
	}

	public void setRs(String rs) {
		this.rs = rs;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}





	
}