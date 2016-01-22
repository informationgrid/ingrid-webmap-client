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
package de.ingrid.mapclient.store.impl;

import java.io.File;
import java.io.IOException;
import java.util.List;

import de.ingrid.mapclient.store.FileMappingStrategy;
import de.ingrid.mapclient.store.FileUtils;
import de.ingrid.mapclient.store.Store;
import de.ingrid.mapclient.store.UserStore;

/**
 * UserFileStore is is a file store that is capable of managing distinct
 * directories for different users. It uses a FileMappingStragegy for
 * determining the locations of the files.
 * @author ingo@wemove.com
 *
 */
public class UserFileStore implements UserStore {

	private File basePath;
	private FileMappingStrategy mappingStrategy;

	/**
	 * Constructor.
	 * @param mappingStrategy
	 */
	public UserFileStore(File basePath, FileMappingStrategy mappingStrategy) {
		this.basePath = basePath;
		this.mappingStrategy = mappingStrategy;
		
		if (!this.basePath.exists()) this.basePath.mkdirs();
	}

	@Override
	public List<String> getRecordIds(String userId) throws IOException {
		return this.getStore(userId).getRecordIds();
	}

	@Override
	public String getRecord(String userId, String recordId) throws IOException {
		return this.getStore(userId).getRecord(recordId);
	}

	@Override
	public void putRecord(String userId, String recordId, String record)
			throws IOException {
		this.getStore(userId).putRecord(recordId, record);
	}

	@Override
	public void removeRecord(String userId, String recordId) throws IOException {
		this.getStore(userId).removeRecord(recordId);
	}

	/**
	 * Get a Store instance for the given user id
	 * @param userId
	 * @return Store
	 */
	protected Store getStore(String userId) {
		File userBasePath = this.getUserBasePath(userId);
		Store store = new FileStore(userBasePath, this.mappingStrategy);
		return store;
	}

	/**
	 * Get the base path for the given user id
	 * @param userId
	 * @return File
	 */
	protected File getUserBasePath(String userId) {
		String encodedId = FileUtils.encodeFileName(userId);
		StringBuffer buf = new StringBuffer();
		buf.append(this.basePath.getAbsolutePath()).
    		append(File.separatorChar).append(encodedId.substring(0, 1)).
    		append(File.separatorChar).append(encodedId);
		return new File(buf.toString());
	}
}
