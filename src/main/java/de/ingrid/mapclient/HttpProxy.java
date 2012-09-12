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
		// TODO this doesn't replace anything , String are immutable,
		// so nothing happens here, which never seemed to be a problem though...
		// should be urlStr = urlStr.repl...
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
			boolean firstRow = true;
			reader = new BufferedReader(new InputStreamReader(xmlInputStream, xmlInputStream.getXmlEncoding()));
			while((numRead = reader.read(buf)) != -1) {
				//in some case the first char is a blank which brings the parser to thrown an exception
				
				// if the first character is not empty we usually have some kind of status message
				if(buf[0] != '<' && firstRow && buf[0] == " ".toCharArray()[0]){
					//25 is '<' should be the beginning of the xml doc
					
					int i = 0;
					while(buf[i] != '<'){
						i++;	
					}
					
					// String s = String.copyValueOf(buf);					
					// buf = s.substring(i).toCharArray();
					// this doesnt work since toCharArray inits a new array
					// we make this c-style

					for (int j = i; j < buf.length; j++){
						buf[j -i] = buf[j];
					}
					for(int j = buf.length - 1; j > (buf.length-1) - i; j--)
						buf[j] = ' ';
					
				}
					//do something	
				firstRow = false;
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