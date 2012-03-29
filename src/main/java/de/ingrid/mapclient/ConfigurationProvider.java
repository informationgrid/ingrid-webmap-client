/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Properties;

import org.apache.log4j.Logger;

import com.thoughtworks.xstream.XStream;

import de.ingrid.mapclient.model.AreaCategory;
import de.ingrid.mapclient.model.Layer;
import de.ingrid.mapclient.model.MapArea;
import de.ingrid.mapclient.model.MapExtend;
import de.ingrid.mapclient.model.Projection;
import de.ingrid.mapclient.model.Scale;
import de.ingrid.mapclient.model.ServiceCategory;
import de.ingrid.mapclient.model.WmsServer;
import de.ingrid.mapclient.rest.ConfigurationResource;

/**
 * ConfigurationProvider gives access to the configuration of the map client.
 * The application configuration consists of two parts:
 *
 * - static: Static configuration is stored in the application.properties file and
 *           is read-only. It is retrieved via the ConfigurationProvider.getProperties()
 *           method and consists of key value pairs.
 * - dynamic: Dynamic configuration is stored in an xml file, that is defined in the
 *           static property named "administration.file". It is retrieved via the
 *           ConfigurationProvider.getConfiguration() method and stored via the
 *           ConfigurationProvider.write() method. The map client provides an administration
 *           frontend for managing the dynamic configuration.
 * 
 * @author ingo@wemove.com
 */
public enum ConfigurationProvider {

	// singleton instance
	INSTANCE;

	private static final String APPLICATION_PROPERTIES = "application.properties";
	private static final String CONFIGURATION_FILE_KEY = "administration.file";
	private static final String OPENSEARCH_URL = "opensearch.searchurl";
	private static final String DOWNLOAD_DIR = "mapdownload.dir";
	private Properties properties = null;
	private Configuration configuration = null;
	
	/**
	 * Constructor. Reads the configuration from disk.
	 */
	private ConfigurationProvider() {

		BufferedReader input = null;
		String xml = null;
		try {
			// get the configuration file name
			Properties props = this.getProperties();
			String configFile = props.getProperty(CONFIGURATION_FILE_KEY);
			File file = new File(configFile);

			// read the file content
			StringBuilder content = new StringBuilder();
			input = new BufferedReader(new InputStreamReader(new FileInputStream(file), "UTF-8"));
			String line = null;
			while((line = input.readLine()) != null) {
				content.append(line);
				content.append(System.getProperty("line.separator"));
			}
			input.close();
			input = null;

			// deserialize a temporary Configuration instance from xml
			xml = content.toString();
			XStream xstream = new XStream();
			this.setXStreamAliases(xstream);
			this.configuration = (Configuration)xstream.fromXML(xml);
		}
		catch (Exception e) {
			throw new RuntimeException(e);
		}
		finally {
			if (input != null) {
				try {
					input.close();
				}
				catch (IOException e) {}
			}
		}
	}

	/**
	 * Write the given Configuration to the disc. To keep the time for modifying the actual configuration
	 * file as short as possible, the method writes the configuration into a temporary file first and then renames
	 * this file to the original configuration file name.
	 * Note: Since renaming a file is not atomic in Windows, if the target file exists already (we need to delete
	 * and then rename), this method is synchronized.
	 * @param configuration Configuration instance
	 * @throws IOException
	 */
	public synchronized void write(Configuration configuration) throws IOException {

		// serialize the Configuration instance to xml
		XStream xstream = new XStream();
		this.setXStreamAliases(xstream);
		String xml = xstream.toXML(configuration);

		// write the configuration to a temporary file first
		File tmpFile = File.createTempFile("config", null);
		BufferedWriter output = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(tmpFile.getAbsolutePath()),"UTF8"));
		try {
			output.write(xml);
			output.close();
			output = null;
		}
		finally {
			if (output != null) {
				output.close();
			}
		}

		// move the temporary file to the configuration file
		Properties props = this.getProperties();
		String configFile = props.getProperty(CONFIGURATION_FILE_KEY);
		File file = new File(configFile);
		file.delete();
		boolean result = tmpFile.renameTo(file);
		if (!result) {
			throw new IOException("The configuration could not be stored. (Rename '" + tmpFile.getAbsolutePath() + "' to '" + file.getAbsolutePath() + "' failed.)");
		}
	}

	/**
	 * Get the application properties.
	 * @return Properties
	 * @throws IOException
	 */
	public Properties getProperties() throws IOException {
		if (this.properties == null) {
			this.properties = new Properties();
			InputStream inputStream = ConfigurationProvider.class.getClassLoader().getResourceAsStream(APPLICATION_PROPERTIES);
			this.properties.load(inputStream);
		}
		return this.properties;
	}
	/**
	 * Get the opensearch url only
	 * @return String
	 */
	public String getOpensearchUrl(){
		return this.properties.getProperty(OPENSEARCH_URL);
	}
	/**
	 * Get the mapdir only
	 * @return String
	 */
	public String getDownloadmapDir(){
		return this.properties.getProperty(DOWNLOAD_DIR);
	}	

	/**
	 * Get the map client configuration
	 * @return Configuration
	 */
	public Configuration getConfiguration() {
		return this.configuration;
	}

	/**
	 * Set the xml aliases for model classes
	 * @param xstream XStream instance
	 */
	private void setXStreamAliases(XStream xstream) {
		xstream.alias("configuration", Configuration.class);
		xstream.alias("layer", Layer.class);
		xstream.alias("mapExtend", MapExtend.class);
		xstream.alias("projection", Projection.class);
		xstream.alias("scale", Scale.class);
		xstream.alias("serviceCategory", ServiceCategory.class);
		xstream.alias("service", WmsServer.class);
		xstream.alias("areaCategory", AreaCategory.class);
		xstream.alias("area", MapArea.class);
	}
}
