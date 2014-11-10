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
package de.ingrid.mapclient.store;

import java.io.File;
import java.util.List;

/**
 * FileMappingStrategy implementations are used to define the relative
 * location of a file belonging to a given id. FileStore instances use
 * them to locate files beneath their base path.
 * @author ingo@wemove.com
 */
public interface FileMappingStrategy {

	/**
	 * Get the relative path (including the filename) of the file belonging
	 * to a given id.
	 * @param id
	 * @return String
	 */
	String getFilePath(String id);

	/**
	 * Get a list of ids mapped by this strategy
	 * @param basePath The base path to search from
	 * @return List<String>
	 */
	List<String> getMappedIds(File basePath);
}
