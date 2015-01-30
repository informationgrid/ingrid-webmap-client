/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
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
