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
package de.ingrid.mapclient.store.impl;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.List;

import de.ingrid.mapclient.store.FileMappingStrategy;
import de.ingrid.mapclient.store.Store;

/**
 * FileStore is used to manage records in the file system.
 * It uses a FileMappingStragegy for determining the locations of the files.
 * @author ingo@wemove.com
 */
public class FileStore implements Store {

	private File basePath;
	private FileMappingStrategy mappingStrategy;

	/**
	 * Constructor.
	 * @param basePath
	 * @param mappingStrategy
	 */
	public FileStore(File basePath, FileMappingStrategy mappingStrategy) {
		this.basePath = basePath;
		this.mappingStrategy = mappingStrategy;
	}

	@Override
	public List<String> getRecordIds() throws IOException {
		return this.mappingStrategy.getMappedIds(this.basePath);
	}

	@Override
	public String getRecord(String id) throws IOException {
		File file = this.getFile(id);
		if (file.exists()) {

			StringBuilder content = new StringBuilder();
			BufferedReader input = new BufferedReader(new InputStreamReader(new FileInputStream(file), "UTF-8"));

			try {
				String line = null;
				while((line = input.readLine()) != null) {
					content.append(line);
					content.append(System.getProperty("line.separator"));
				}
				input.close();
				input = null;

				return content.toString();
			}
			catch (Exception e) {
				throw new IOException(e);
			}
			finally {
				if (input != null) {
					input.close();
				}
			}
		}
		else {
			throw new IOException("No entry with id "+id+" found.");
		}
	}

	@Override
	public void putRecord(String id, String record) throws IOException {
		// ensure that the directory exists
		File file = this.getFile(id);
		String path = file.getParent();
		new File(path).mkdirs();

		String filePath = file.getAbsolutePath();
		BufferedWriter output = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(filePath), "UTF8"));
		try {
			output.write(record);
			output.close();
			output = null;
		}
		finally {
			if (output != null) {
				output.close();
			}
		}
	}

	@Override
	public void removeRecord(String id) throws IOException {
		File file = this.getFile(id);
		if (file.exists()) {
			file.delete();
		}
	}

	/**
	 * Get the file belonging to a given id.
	 * @param id
	 * @return File
	 * @throws IOException
	 */
	protected File getFile(String id) throws IOException {
		String relativePath = this.mappingStrategy.getFilePath(id);
		StringBuffer buf = new StringBuffer();
		buf.append(this.basePath).append(File.separatorChar).append(relativePath);
		return new File(buf.toString());
	}
}
