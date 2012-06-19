package de.ingrid.mapclient.store.impl;

import java.io.File;
import java.io.FileFilter;

import de.ingrid.mapclient.store.FileMappingStrategy;

/**
 * TreeFileMappingStrategy creates a directory tree by distributing the
 * files to subdirectories named after the first letter of the id.
 * This is useful if many files are expected and the first letter
 * is uniformly distributed.
 * @author ingo@wemove.com
 *
 */
public class TreeFileMappingStrategy extends AbstractFileMappingStrategy implements FileMappingStrategy {

	DefaultFileFilter fileFilter = new DefaultFileFilter();

	protected class DefaultFileFilter implements FileFilter {
		@Override
		public boolean accept(File pathname) {
			return !pathname.isDirectory() &&
					pathname.getName().endsWith(TreeFileMappingStrategy.this.getFileExtension());
		}
	}

	/**
	 * Constructor.
	 * @param fileExtension
	 */
	public TreeFileMappingStrategy(String fileExtension) {
		super(fileExtension);
	}

	@Override
	protected String getRelativePath(String id) {
		return this.getFilename(id).substring(0, 1);
	}

	@Override
	protected FileFilter getFileFilter() {
		return this.fileFilter;
	}
}
