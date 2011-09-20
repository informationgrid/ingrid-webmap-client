/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.store;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Properties;

import de.ingrid.mapclient.ConfigurationProvider;

/**
 * FileStore is used to store and retrieve frontend user session data.
 * 
 * @author ingo@wemove.com
 */
public enum FileStore {

	// singleton instance
	INSTANCE;

	private static final String SESSION_DIR_KEY = "frontend.sessionDir";

	/**
	 * Constructor.
	 */
	private FileStore() {}

	/**
	 * File name filter for recognizing stored files
	 */
	protected class StoreFileFilter implements FileFilter {
		@Override
		public boolean accept(File file) {
			return !file.isDirectory() && file.getName().endsWith(".xml");
		}
	};

	/**
	 * Encode an id to be used in a filename.
	 * @return String
	 */
	protected String encodeId(String id) {
		return FileUtils.encodeFileName(id);
	}

	/**
	 * Decode an id that was used in a filename.
	 * @return String
	 */
	protected String decodeId(String id) {
		return FileUtils.decodeFileName(id);
	}

	/**
	 * Get the root path of the store.
	 * @return String
	 * @throws IOException
	 */
	protected String getRootPath() throws IOException {
		Properties props = ConfigurationProvider.INSTANCE.getProperties();
		String rootPath = props.getProperty(SESSION_DIR_KEY);
		if (!new File(rootPath).canWrite()) {
			throw new IOException("The configured root path "+rootPath+" is not writable.");
		}
		return rootPath;
	}

	/**
	 * Get the filename for a record
	 * @param id
	 * @return String
	 */
	protected String getFilename(String id) {
		return this.encodeId(id)+".xml";
	}

	/**
	 * Get the relative path to a record starting from the root path
	 * @param id
	 * @return String
	 */
	protected String getRelativePath(String id) {
		return this.encodeId(id).substring(0, 1);
	}

	/**
	 * Get the relative path to a record starting from the root path
	 * @param id
	 * @return String
	 * @throws IOException
	 */
	protected String getAbsolutePath(String id) throws IOException {
		StringBuffer buf = new StringBuffer();
		buf.append(this.getRootPath()).append(File.separatorChar).append(this.getRelativePath(id));
		return new File(buf.toString()).getAbsolutePath();
	}

	/**
	 * Get the absolute filename of a record.
	 * @param id
	 * @return String
	 * @throws IOException
	 */
	public String getAbsoluteFilename(String id) throws IOException {
		StringBuffer buf = new StringBuffer();
		buf.append(this.getAbsolutePath(id)).append(File.separatorChar).append(this.getFilename(id));
		return new File(buf.toString()).getAbsolutePath();
	}

	public String getRecord(String id) throws IOException {
		String filePath = this.getAbsoluteFilename(id);
		File file = new File(filePath);
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

	public void putRecord(String id, String record) throws IOException {
		// ensure that the directory exists
		String path = this.getAbsolutePath(id);
		new File(path).mkdirs();

		String filePath = this.getAbsoluteFilename(id);
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

	public void removeRecord(String id) throws IOException {
		String filePath = this.getAbsoluteFilename(id);
		File file = new File(filePath);
		if (file.exists()) {
			file.delete();
		}
	}
}
