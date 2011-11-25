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
		File[] files = basePath.listFiles(this.getFileFilter());
		List<String> ids = new ArrayList<String>();
		for (File file : files) {
			ids.add(this.getId(file));
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