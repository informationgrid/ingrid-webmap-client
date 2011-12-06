package de.ingrid.mapclient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;
import java.util.regex.Pattern;

/**
 * WmsProxy is used to call remote web map services to
 * eliminate cross domain issues.
 * 
 * @author ingo@wemove.com
 */
public class WmsProxy {

	/**
	 * The service pattern that urls must match
	 */
	private final static Pattern SERVICE_PATTERN = Pattern.compile("SERVICE=WMS", Pattern.CASE_INSENSITIVE);

	/**
	 * The request pattern that urls must match
	 */
	private final static Pattern REQUEST_PATTERN = Pattern.compile("REQUEST=(GetCapabilities|GetFeatureInfo)", Pattern.CASE_INSENSITIVE);

	/**
	 * Do a WMS request. The method checks, if the url contains the strings
	 * SERVICE=WMS and REQUEST=GetCapabilities or REQUEST=GetFeatureInfo and throws an
	 * exception if not.
	 * @param urlStr The request url
	 * @return String
	 * @throws Exception
	 */
	public static String doRequest(String urlStr) throws Exception {
		StringBuffer response = new StringBuffer();

		// check if the url string is valid
		if (!SERVICE_PATTERN.matcher(urlStr).find() && !REQUEST_PATTERN.matcher(urlStr).find()) {
			throw new IllegalArgumentException("The url is not a valid wms request: "+urlStr);
		}

		// add protocol if missing
		if (!urlStr.startsWith("http://")) {
			urlStr = "http://"+urlStr;
		}
		// replace & and ?
		urlStr.replaceAll("\\&", "%26");
		urlStr.replaceAll("\\?", "%3f");

		// send request
		BufferedReader reader = null;
		try {
			URL url = new URL(urlStr);
			URLConnection conn = url.openConnection();

			// read the response into the string buffer
			char[] buf = new char[1024];
			int numRead = 0;
			reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
			while((numRead = reader.read(buf)) != -1) {
				response.append(buf, 0, numRead);
			}
		}
		catch (Exception e) {
			throw e;
		}
		finally {
			if (reader != null) {
				try {
					reader.close();
				} catch (IOException e) {}
			}
		}
		return response.toString();
	}
}