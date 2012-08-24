package de.ingrid.mapclient.rest;

import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
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
import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.model.WmsServer;






@Path("/search")
public class SearchResource {

	
	private static final Logger log = Logger.getLogger(SearchResource.class);
	
	/**
	 * Path to search term
	 */
	private static final String SEARCH_PATH = "query";
	
	@GET
	@Path(SEARCH_PATH)
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.APPLICATION_JSON)
	public Response search(@QueryParam("searchTerm") String searchTerm) {
		//get the opensearch url through the applicaton properties file
		String OSUrl = ConfigurationProvider.INSTANCE.getOpensearchUrl();
		InputStream result = null;
		searchTerm = searchTerm.trim();
		searchTerm = searchTerm.replaceAll("\\s", "+");
		//some logic borrowed from the opensearch iplug
		//we open a stream though this module 
		//the rest is bascially simple xml parsing of the result 
		//into a json string which gets to the mapclient through the 
		//response
		OSCommunication comm = new OSCommunication();
		String url = OSUrl.replace("{query}", searchTerm); 
		result = comm.sendRequest(url);
		Document doc = null;
		XPath xpath = XPathFactory.newInstance().newXPath();
		NodeList nodesTitles = null;
		NodeList nodesWmsUrls = null;
		List<WmsServer> services = new ArrayList<WmsServer>();
		try {
			doc = getDocumentFromStream(result);
			nodesTitles = (NodeList) xpath.evaluate("/rss/channel/item/title",
					doc, XPathConstants.NODESET);
			nodesWmsUrls = (NodeList) xpath.evaluate(
					"/rss/channel/item/wms-url", doc, XPathConstants.NODESET);
			for (int i = 0; i < nodesTitles.getLength(); i++) {
				WmsServer wmsServer = new WmsServer(nodesTitles.item(i).getTextContent(), 
						nodesWmsUrls.item(i).getTextContent().replace("&amp;", "&"));
				services.add(wmsServer);
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
		
		String json = xstream.toXML(services);
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
