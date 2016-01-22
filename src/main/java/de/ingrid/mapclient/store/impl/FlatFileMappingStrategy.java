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
import java.io.FileFilter;

import de.ingrid.mapclient.store.FileMappingStrategy;

/**
 * FlatFileMappingStrategy directly maps ids to files in the configured
 * base directory by just adding the configured file extension.
 * @author ingo@wemove.com
 *
 */
public class FlatFileMappingStrategy extends AbstractFileMappingStrategy implements FileMappingStrategy {

	DefaultFileFilter fileFilter = new DefaultFileFilter();
	protected static String emptyString = "";

	protected class DefaultFileFilter implements FileFilter {
		@Override
		public boolean accept(File pathname) {
			return !pathname.isDirectory() &&
					pathname.getName().endsWith(FlatFileMappingStrategy.this.getFileExtension());
		}
	}
	/**
	 * Constructor.
	 * @param fileExtension
	 */
	public FlatFileMappingStrategy(String fileExtension) {
		super(fileExtension);
	}

	@Override
	protected String getRelativePath(String id) {
		return emptyString;
	}

	@Override
	protected FileFilter getFileFilter() {
		return this.fileFilter;
	}
}
