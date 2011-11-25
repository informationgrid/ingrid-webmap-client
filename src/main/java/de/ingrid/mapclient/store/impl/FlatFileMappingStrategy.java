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
