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
package de.ingrid.mapclient.store;

import java.io.IOException;
import java.util.List;

/**
 * Interface for data store functionality that can handle records
 * for different user ids.
 * @author ingo@wemove.com
 */
public interface UserStore {

	/**
	 * Get all record ids contained in this store
	 * @return List<String>
	 */
	public List<String> getRecordIds(String userId) throws IOException;

	/**
	 * Get the record with the given record id.
	 * @param recordId
	 * @return String
	 */
	public String getRecord(String userId, String recordId) throws IOException;

	/**
	 * Store/overwrite the given record with the given record id.
	 * @param recordId
	 * @param record
	 */
	public void putRecord(String userId, String recordId, String record) throws IOException;

	/**
	 * Remove the record with the given record id.
	 * @param recordId
	 */
	public void removeRecord(String userId, String recordId) throws IOException;
}
