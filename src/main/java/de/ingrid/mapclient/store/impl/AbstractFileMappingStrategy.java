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
package de.ingrid.mapclient.store.impl;

import java.io.File;
import java.io.FileFilter;
import java.util.ArrayList;
import java.util.List;

import de.ingrid.mapclient.store.FileMappingStrategy;
import de.ingrid.mapclient.store.FileUtils;

public abstract class AbstractFileMappingStrategy implements FileMappingStrategy {

	private static final String DOT = ".";
	private String fileExtension;

	public AbstractFileMappingStrategy(String fileExtension) {
		this.fileExtension = fileExtension;
	}

	@Override
	public String getFilePath(String id) {
		StringBuffer buf = new StringBuffer();
		buf.append(this.getRelativePath(id)).append(File.separatorChar).append(this.getFilename(id));
		return buf.toString();
	}

	@Override
	public List<String> getMappedIds(File basePath) {
		List<String> ids = new ArrayList<String>();
		File[] files = basePath.listFiles(this.getFileFilter());
		if (files != null) {
			for (File file : files) {
				ids.add(this.getId(file));
			}
		}
		return ids;
	}

	/**
	 * Get the relative path to the file mapped to id starting from base path
	 * @param id
	 * @return String
	 */
	protected abstract String getRelativePath(String id);

	/**
	 * Get the filter to use on File.listFiles in order to get
	 * all mapped files that are contained inside base path
	 * @return
	 */
	protected abstract FileFilter getFileFilter();

	/**
	 * Get the file extension
	 * @return
	 */
	protected String getFileExtension() {
		return this.fileExtension;
	}

	/**
	 * Get the filename for a given id.
	 * @param id
	 * @return String
	 */
	protected String getFilename(String id) {
		StringBuffer buf = new StringBuffer();
		buf.append(FileUtils.encodeFileName(id)).append(DOT).append(this.fileExtension);
		return buf.toString();
	}

	/**
	 * Get the id for a given file.
	 * @param filename
	 * @return String
	 */
	protected String getId(File file) {
		return FileUtils.decodeFileName(FileUtils.getNameWithoutExtension(file));
	}
}
