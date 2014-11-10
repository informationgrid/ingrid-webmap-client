/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
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
import java.util.List;

/**
 * ServiceCategory is used to organize wms servers into a hierarchical structure.
 * 
 * @author miguel@wemove.com
 */
public class MapServiceCategory {

	private String name;
	private List<MapServiceCategory> mapServiceCategories = new ArrayList<MapServiceCategory>();
	private Integer idx;


	public MapServiceCategory() {
	}
	
	public MapServiceCategory(String name, List<MapServiceCategory> mapServiceCategories, Integer idx) {
		this.name = name;
		this.mapServiceCategories = mapServiceCategories;
		this.idx = idx;
	}

	public String getName() {
		return this.name;
	}

	public List<MapServiceCategory> getMapServiceCategories() {
		return this.mapServiceCategories;
	}
	public int getId() {
		return idx;
	}

}
