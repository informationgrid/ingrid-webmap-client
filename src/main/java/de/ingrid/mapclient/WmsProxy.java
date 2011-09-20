package de.ingrid.mapclient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.io.Writer;
import java.net.URL;
import java.net.URLConnection;

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
 * WmsProxy is used to proxy remote web map services to eliminate cross domain
 * issues.
 * 
 * @author ingo@wemove.com
 */
public class WmsProxy {
	/**
	 * Get the GetCapabilities document from a WMS server.
	 * @param capUrl The url of the GetCapabilities service
	 * @return String (Xml)
	 * @throws Exception
	 */
	public static String getCapabilities(String capUrl) throws Exception {
		String result = null;
		// add protocol if missing
		if (!capUrl.startsWith("http://")) {
			capUrl = "http://"+capUrl;
		}
		// replace & and ?
		capUrl.replaceAll("\\&", "%26");
		capUrl.replaceAll("\\?", "%3f");

		// send request
		BufferedReader reader = null;
		try {
			String urlStr = capUrl;
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
			result = out.toString();
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
		return result;
	}
}