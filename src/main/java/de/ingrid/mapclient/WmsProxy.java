package de.ingrid.mapclient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.io.Writer;
import java.net.URL;
import java.net.URLConnection;
import java.util.regex.Pattern;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.w3c.dom.Document;
import org.xml.sax.InputSource;

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
	 * exception if not. The server response is supposed to be an Xml document and
	 * the method will fail, if that is not true.
	 * @param urlStr The request url
	 * @return String (Xml)
	 * @throws Exception
	 */
	public static String doRequest(String urlStr) throws Exception {
		String response = null;

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

			// read the response into a DOM tree
			reader = new BufferedReader(new InputStreamReader(
					conn.getInputStream()));
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			DocumentBuilder db = factory.newDocumentBuilder();
			InputSource inStream = new InputSource();
			inStream.setCharacterStream(reader);
			Document doc = db.parse(inStream);

			// serialize the DOM tree back into a string
			// (we encode to utf8)
			Writer out = new StringWriter();
			Transformer tf = TransformerFactory.newInstance().newTransformer();
			tf.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
			tf.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
			//tf.setOutputProperty(OutputKeys.INDENT, "no");
			tf.transform(new DOMSource(doc), new StreamResult(out));
			response = out.toString();
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
		return response;
	}
}