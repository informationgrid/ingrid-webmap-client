package de.ingrid.mapclient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;


/**
 * HttpProxy is used to call remote services to eliminate cross domain issues.
 * 
 * @author ingo@wemove.com
 */
public class HttpProxy {

	/**
	 * Do a HTTP request. The method checks, if the url contains the strings
	 * SERVICE=WMS and REQUEST=GetCapabilities or REQUEST=GetFeatureInfo and throws an
	 * exception if not.
	 * @param urlStr The request url
	 * @return String
	 * @throws Exception
	 */
	public static String doRequest(String urlStr) throws Exception {
		StringBuffer response = new StringBuffer();

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
			
			SniffedXmlInputStream xmlInputStream = new SniffedXmlInputStream(conn.getInputStream());
			
			// read the response into the string buffer
			char[] buf = new char[1024];
			int numRead = 0;
			reader = new BufferedReader(new InputStreamReader(xmlInputStream, xmlInputStream.getXmlEncoding()));
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