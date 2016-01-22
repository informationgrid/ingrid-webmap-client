/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * WmsService represents a WMS server
 * 
 * @author miguel@wemove.com
 */
public class WmsActiveService {

	private String name;
	private String capabilitiesUrl;
	private String originalCapUrl;
	private List<WmsServiceLayer> checkedLayers = new ArrayList<WmsServiceLayer>();

	public WmsActiveService(){
	}



	public WmsActiveService(String name, String capabilitiesUrl, String originalCapUrl, List<WmsServiceLayer> checkedLayers){
		this.name = name;
		this.capabilitiesUrl = capabilitiesUrl;
		this.originalCapUrl = originalCapUrl;
		this.checkedLayers = checkedLayers;
	}

	public void setOriginalCapUrl(String originalCapUrl) {
		this.originalCapUrl = originalCapUrl;
	}

	public void setCapabilitiesUrl(String capabilitiesUrl) {
		this.capabilitiesUrl = capabilitiesUrl;
	}

	public void setCheckedLayers(List<WmsServiceLayer> checkedLayers) {
		this.checkedLayers = checkedLayers;
	}

	public List<WmsServiceLayer> getCheckedLayers() {
		return checkedLayers;
	}

	public String getOriginalCapUrl() {
		return originalCapUrl;
	}

	public String getName() {
		return this.name;
	}

	public String getCapabilitiesUrl() {
		return this.capabilitiesUrl;
	}
	
	public void setName(String name) {
		this.name = name;
	}	
}
