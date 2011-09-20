/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.store;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;

public class FileUtils {

	/**
	 * Encode Filename to prevent invalid characters in file name. The encoding
	 * is reversible (url encoding (UTF-8) is used).
	 * 
	 * @param s
	 * @return
	 */
	public static String encodeFileName(String s) {
		try {
			return URLEncoder.encode(s, "UTF-8");
		} catch (UnsupportedEncodingException e) {
			return s;
		}
	}
	
	/**
	 * Decode Filename coded with <code>encodeFileName</code>.
	 * 
	 * @param s
	 * @return
	 */
	public static String decodeFileName(String s) {
		try {
			return URLDecoder.decode(s, "UTF-8");
		} catch (UnsupportedEncodingException e) {
			return s;
		}
	}
}
