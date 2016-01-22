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
/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.store;

import java.io.File;
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

	/**
	 * Get the filename without extension
	 * @param file
	 * @return String
	 */
	public static String getNameWithoutExtension(File file) {
		String filename = file.getName();
		int extensionIndex = filename.lastIndexOf('.');
		if (extensionIndex == -1) {
			return filename;
		}
		return filename.substring(0, extensionIndex);
	}
}
