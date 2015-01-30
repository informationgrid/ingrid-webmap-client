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

import java.io.File;
import java.io.IOException;
import java.util.Properties;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.store.impl.FileStore;
import de.ingrid.mapclient.store.impl.FlatFileMappingStrategy;
import de.ingrid.mapclient.store.impl.TreeFileMappingStrategy;
import de.ingrid.mapclient.store.impl.UserFileStore;

/**
 * StoreManager is used to retrieve store instances.
 * @author ingo@wemove.com
 */
public enum StoreManager {

	// singleton instance
	INSTANCE;

	private static final String FILE_EXTENSION = "xml";
	private static final String SESSION_DIR_KEY = "frontend.sessionDir";
	private static final String USERDATA_DIR_KEY = "frontend.userDataDir";

	// store instances
	private Store sessionStore = null;;
	private UserStore userStore = null;;

	/**
	 * Constructor.
	 */
	private StoreManager() {}

	/**
	 * Get the UserStore instance for storing user data.
	 * @return UserStore
	 * @throws IOException
	 */
	public UserStore getUserStore() throws IOException {
		if (this.userStore == null) {
			File rootPath = this.getStoreDirectory(USERDATA_DIR_KEY);
			FileMappingStrategy strategy = new FlatFileMappingStrategy(FILE_EXTENSION);
			this.userStore = new UserFileStore(rootPath, strategy);
		}
		return this.userStore;
	}

	/**
	 * Get the Store instance for storing temporary session data.
	 * @return Store
	 * @throws IOException
	 */
	public Store getSessionStore() throws IOException {
		if (this.sessionStore == null) {
			File rootPath = this.getStoreDirectory(SESSION_DIR_KEY);
			FileMappingStrategy strategy = new TreeFileMappingStrategy(FILE_EXTENSION);
			this.sessionStore = new FileStore(rootPath, strategy);
		}
		return this.sessionStore;
	}

	/**
	 * Get the directory denoted by the given key from the configuration.
	 * @param configKey
	 * @return File
	 * @throws IOException
	 */
	protected File getStoreDirectory(String configKey) throws IOException {
		Properties props = ConfigurationProvider.INSTANCE.getProperties();
		File rootPath = new File(props.getProperty(configKey));
		if (!rootPath.exists() || !rootPath.canWrite()) {
			throw new IOException("The configured session dir "+rootPath.getAbsolutePath()+
					" does not exist or is not writable.");
		}
		return rootPath;
	}
}
