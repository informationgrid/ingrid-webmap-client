/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.json.JsonHierarchicalStreamDriver;
import com.thoughtworks.xstream.io.json.JsonWriter;

import de.ingrid.iplug.opensearch.communication.OSCommunication;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.model.AdministrativeInfo;
import de.ingrid.mapclient.model.WmsServer;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/wms")
public class WmsResource {

	private static final Logger log = Logger.getLogger(WmsResource.class);

	/**
	 * The service pattern that urls must match
	 */
	private final static Pattern SERVICE_PATTERN = Pattern.compile("SERVICE=WMS", Pattern.CASE_INSENSITIVE);

	/**
	 * The request pattern that urls must match
	 */
	private final static Pattern REQUEST_PATTERN = Pattern.compile("REQUEST=(GetCapabilities|GetFeatureInfo)", Pattern.CASE_INSENSITIVE);


	/**
	 * Get WMS response from the given url
	 * @param url The request url
	 * @return String
	 */
	@GET
	@Path("proxy")
	@Produces(MediaType.TEXT_PLAIN)
	public String doWmsRequest(@QueryParam("url") String url) {
		// check if the url string is valid
		if (!SERVICE_PATTERN.matcher(url).find() && !REQUEST_PATTERN.matcher(url).find()) {
			throw new IllegalArgumentException("The url is not a valid wms request: "+url);
		}

		try {
			String response = HttpProxy.doRequest(url);
			return response;
		}
		catch (Exception ex) {
			log.error("Error sending WMS request: "+url, ex);
			throw new WebApplicationException(ex, Response.Status.NOT_FOUND);
		}
	}
	
	/**
	 * Get WMS response from the given url
	 * @param url The request url
	 * @return String
	 */
	@GET
	@Path("proxyAdministrativeInfos")
	@Produces(MediaType.APPLICATION_JSON)
	public Response doAdministrativeInfosWmsRequest(@QueryParam("url") String url) {
		// check if the url string is valid
		if (!SERVICE_PATTERN.matcher(url).find() && !REQUEST_PATTERN.matcher(url).find()) {
			throw new IllegalArgumentException("The url is not a valid wms request: "+url);
		}

		OSCommunication comm = new OSCommunication();
		InputStream result = null;
		result = comm.sendRequest(url);
		Document doc = null;
		XPath xpath = XPathFactory.newInstance().newXPath();
		NodeList fields = null;

		List<AdministrativeInfo> adminInfos = new ArrayList<AdministrativeInfo>();
		try {
			doc = getDocumentFromStream(result);
			fields = (NodeList) xpath.evaluate("/FeatureInfoResponse/FIELDS",
					doc, XPathConstants.NODESET);

			for (int i = 0; i < fields.getLength(); i++) {
				AdministrativeInfo aInfo = new AdministrativeInfo();
				if(fields.item(i).getAttributes().getNamedItem("USE").getNodeValue().trim().equals("2"))
				aInfo.setType("Bundesland");
				else if(fields.item(i).getAttributes().getNamedItem("USE").getNodeValue().trim().equals("4"))
				aInfo.setType("Kreis");
				else if(fields.item(i).getAttributes().getNamedItem("USE").getNodeValue().trim().equals("3"))
				aInfo.setType("Regierungsbezirk");
				aInfo.setName(fields.item(i).getAttributes().getNamedItem("GEN").getNodeValue());
				aInfo.setRs(fields.item(i).getAttributes().getNamedItem("RS").getNodeValue());
				adminInfos.add(aInfo);
			}
		} catch (XPathExpressionException e) {
			log.error("Error while parsing the InputStream!");
			e.printStackTrace();
		} catch (ParserConfigurationException e) {
			log.error("Error while parsing the InputStream!");
			e.printStackTrace();
		} catch (SAXException e) {
			log.error("Error while parsing the InputStream!");
			e.printStackTrace();
		} catch (IOException e) {
			log.error("Error while performing xpath.evaluate on a document!");
			e.printStackTrace();
		}

		comm.releaseConnection();
		XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
			@Override
			public HierarchicalStreamWriter createWriter(Writer writer) {
				return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
			}
		});
		
		String json = xstream.toXML(adminInfos);
		return Response.ok(json).build();
	}	
	/**
	 * Create a parseable DOM-document of the InputStream, which should be XML/HTML.
	 *  
	 * @param result
	 * @return
	 * @throws ParserConfigurationException
	 * @throws SAXException
	 * @throws IOException
	 */
	private Document getDocumentFromStream(InputStream result)
			throws ParserConfigurationException, SAXException, IOException {
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		DocumentBuilder builder = factory.newDocumentBuilder();
		//Document descriptorDoc = builder.parse(new InputSource(new InputStreamReader(result, "UTF8")));
		Document descriptorDoc = builder.parse(result);
		return descriptorDoc;
	}	
}