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
package de.ingrid.mapclient.url.impl;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Hashtable;
import java.util.Map;
import java.util.Properties;

import org.apache.log4j.Logger;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.url.UrlMapper;

/**
 * This UrlMapper implementation uses a database backed hashmap.
 * @author ingo@wemove.com
 */
public class DbUrlMapper implements UrlMapper {

	private static final Logger log = Logger.getLogger(UrlMapper.class);

	private static final String DB_DRIVER_KEY = "frontend.db.driver";
	private static final String DB_URL_KEY = "frontend.db.url";
	private static final String DB_USER_KEY = "frontend.db.user";
	private static final String DB_PASSWORD_KEY = "frontend.db.password";

	/**
	 * Stores the url mappings: shortUrl as key longUrl as value
	 */
	private Map<String, String> mappings = null;
	private Map<String, String> reverseMappings = null;

	private boolean dbOk = false;

	/**
	 * The characters used in short urls
	 */
	protected static final char ALPHABET[] = "0123456789abcdefghijklmnopqrstuvwxyz".toCharArray();

	/**
	 * The length of short urls
	 */
	protected static final int LENGTH = 6;

	/**
	 * Constructor
	 */
	public DbUrlMapper() {

		Connection conn = null;
		try {
			// try to connect and ensure that the url table exists
			conn = this.getConnection();
			String query = "CREATE TABLE IF NOT EXISTS urls(id int identity, short varchar(255), long varchar(255));";
			Statement stmt = conn.createStatement();
			stmt.execute(query);
			this.dbOk = true;
		}
		catch (Exception ex) {
			log.error("Could not initialize database", ex);
			this.dbOk = false;
		}
		finally {
			if (conn != null) {
				try {
					conn.close();
				} catch (SQLException e) {}
			}
		}

		this.mappings = this.getMappings();
		// build the reverse mapping for faster lookup
		this.reverseMappings = new Hashtable<String, String>();
		for(Map.Entry<String, String> entry : this.mappings.entrySet()){
			this.reverseMappings.put(entry.getValue(), entry.getKey());
		}
	}

	@Override
	public String getShortUrl(String longUrl) throws Exception {
		// create the mapping if it does not exist yet
		if (!this.mappings.containsValue(longUrl)) {
			String shortUrl = this.createShortUrl(longUrl);
			// make sure it is unique
			while (this.mappings.containsKey(shortUrl)) {
				shortUrl = this.createShortUrl(longUrl);
			}
			// store the mapping in the database
			this.storeMapping(shortUrl, longUrl);
			// store the mapping in the memory maps
			this.mappings.put(shortUrl, longUrl);
			this.reverseMappings.put(longUrl, shortUrl);
		}
		return this.reverseMappings.get(longUrl);
	}

	@Override
	public String getLongUrl(String shortUrl) throws Exception {
		// throw an exception if the mapping does not exist yet
		if (!this.mappings.containsKey(shortUrl)) {
			throw new IllegalArgumentException("The short url "+shortUrl+" is unknown.");
		}
		return this.mappings.get(shortUrl);
	}

	/**
	 * Create a short url for a long url
	 * @param longUrl
	 * @return String
	 */
	public String createShortUrl(String longUrl) {
		return this.generateRandomString();
	}

	/**
	 * Store the given mapping in the database
	 * @param shortUrl
	 * @param longUrl
	 */
	protected void storeMapping(String shortUrl, String longUrl) {
		if (this.dbOk) {
			Connection conn = null;
			String query = "INSERT INTO urls (short, long) VALUES (?, ?)";
			try {
				conn = this.getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);
				stmt.setString(1, shortUrl);
				stmt.setString(2, longUrl);
				stmt.execute();
			}
			catch (Exception ex) {
				log.error("Could not store url mapping", ex);
			}
			finally {
				if (conn != null) {
					try {
						conn.close();
					} catch (SQLException e) {}
				}
			}
		}
	}

	/**
	 * Get all mappings from the database. The returned Map contains
	 * the short urls as keys and the long urls as values
	 * @return Map<String, String>
	 */
	protected Map<String, String> getMappings() {
		Map<String, String> mappings = new Hashtable<String, String>();
		if (this.dbOk) {
			Connection conn = null;
			String query = "SELECT short, long FROM urls";
			try {
				conn = this.getConnection();
				Statement st = conn.createStatement();
				ResultSet rs = st.executeQuery(query);
				while (rs.next()) {
					mappings.put(rs.getString("short"), rs.getString("long"));
				}
			}
			catch (Exception ex) {
				log.error("Could not retrieve url mappings", ex);
			}
			finally {
				if (conn != null) {
					try {
						conn.close();
					} catch (SQLException e) {}
				}
			}
		}
		return mappings;
	}

	/**
	 * Generate a random string with LENGTH chars from ALPHABET
	 * @return String
	 */
	protected String generateRandomString() {
		StringBuffer buf = new StringBuffer();
		int numChars = ALPHABET.length;
		for (int i=0; i<LENGTH; i++) {
			buf.append(ALPHABET[(int)(Math.random()*numChars)]);
		}
		return buf.toString();
	}

	/**
	 * Get the database connection
	 * @return Connection
	 */
	protected Connection getConnection() throws Exception {
		// get the connection parameters
		Properties props = ConfigurationProvider.INSTANCE.getProperties();
		String driver = props.getProperty(DB_DRIVER_KEY);
		String url = props.getProperty(DB_URL_KEY);
		String user = props.getProperty(DB_USER_KEY);
		String password = props.getProperty(DB_PASSWORD_KEY);

		// try to connect
		Class.forName(driver);
		Connection conn = DriverManager.getConnection(url, user, password);
		return conn;
	}
}
