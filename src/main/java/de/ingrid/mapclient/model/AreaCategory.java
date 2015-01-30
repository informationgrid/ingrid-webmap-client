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

import java.util.ArrayList;
import java.util.List;

/**
 * AreaCategory is used to organize map areas into a hierarchical structure.
 * 
 * @author ingo@wemove.com
 */
public class AreaCategory {

	private String name;
	private List<AreaCategory> areaCategories = new ArrayList<AreaCategory>();
	private List<MapArea> areas = new ArrayList<MapArea>();

	public AreaCategory() {
	}

	public AreaCategory(String name, List<AreaCategory> areaCategories, List<MapArea> areas) {
		this.name = name;
		this.areaCategories = areaCategories;
		this.areas = areas;
	}

	public String getName() {
		return this.name;
	}

	public List<AreaCategory> getAreaCategories() {
		return this.areaCategories;
	}

	public List<MapArea> getAreas() {
		return this.areas;
	}
}
