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

/**
 * Layer represents a map layer
 * 
 * @author ingo@wemove.com
 */
public class Layer {

	private String name;
	private Boolean isBaseLayer;

	public Layer() {
	}

	
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


	public void setName(String name) {
		this.name = name;
	}


	public void setIsBaseLayer(Boolean isBaseLayer) {
		this.isBaseLayer = isBaseLayer;
	}
	
	
}
