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
package de.ingrid.mapclient.utils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPathExpressionException;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.Text;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.model.WmsService;
import de.ingrid.utils.tool.MD5Util;
import de.ingrid.utils.xml.XPathUtils;

public class CapabilitiesUtils { 

	private static final Logger log = Logger.getLogger(CapabilitiesUtils.class);
	
	protected static final char ALPHABET[] = "0123456789abcdefghijklmnopqrstuvwxyz".toCharArray();
	protected static final int LENGTH = 8;
	
	public static String createMD5NameText(String text, Node node) throws TransformerConfigurationException, TransformerException, TransformerFactoryConfigurationError, IOException {
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		DOMSource source = new DOMSource(node);
		StreamResult outputTarget = new StreamResult(outputStream);
		TransformerFactory.newInstance().newTransformer().transform(source, outputTarget);
		InputStream is = new ByteArrayInputStream(outputStream.toByteArray());
		
		return MD5Util.getMD5(is);
	}
	/**
	 * Generate a random string with LENGTH chars from ALPHABET
	 * @return String
	 */
	public static String generateRandomString() {
		StringBuffer buf = new StringBuffer();
		int numChars = ALPHABET.length;
		for (int i=0; i<LENGTH; i++) {
			buf.append(ALPHABET[(int)(Math.random()*numChars)]);
		}
		return buf.toString();
	}
	
	public static String generateMD5String(String value) throws NoSuchAlgorithmException, UnsupportedEncodingException{
		byte[] digest;
		MessageDigest md = MessageDigest.getInstance("MD5");
		md.update(value.getBytes("UTF-8"), 0, value.getBytes("UTF-8").length - 1); 
		digest = md.digest();
		return bytesToHex(digest); 
	}
	
	public static String bytesToHex(byte[] bytes) {
		char[] hexArray = "0123456789ABCDEF".toCharArray();
	    char[] hexChars = new char[bytes.length * 2];
	    int v;
	    for ( int j = 0; j < bytes.length; j++ ) {
	        v = bytes[j] & 0xFF;
	        hexChars[j * 2] = hexArray[v >>> 4];
	        hexChars[j * 2 + 1] = hexArray[v & 0x0F];
	    }
	    return new String(hexChars);
	}
	
	public static String getCapabilitiesValue(String response, String xPathExpression){
		Document doc = stringToDoc(response);
		Node node = (Node) XPathUtils.getNode(doc, xPathExpression);
		if(node != null){
			return node.getNodeValue();
		}
		return "";
	}
	
	public static void updateCapabilities(String response, WmsService service) throws TransformerFactoryConfigurationError, IOException{
		String url;
		ConfigurationProvider p = ConfigurationProvider.INSTANCE;
		String path = p.getWMSDir();
		
		try {
			// Get original copy xml file
			url = service.getCapabilitiesUrlOrg();
			String fileName = url.substring(url.lastIndexOf("/"), url.length());
			String [] splitFileName = fileName.split("\\?");
			File f = new File(path+splitFileName[0]);
			
			Document doc = stringToDoc(response);
			
			// Update new capabilities
			Document newDoc = updateCapabilititesDocument(doc, service);
			
			TransformerFactory tFactory = TransformerFactory.newInstance();
			Transformer transformer = tFactory.newTransformer();
			
			// Change the xml stucture for original copy
			DOMSource source = new DOMSource(newDoc);
			StreamResult result = new StreamResult(f);
			transformer.transform(source, result);
			
			// Get copy xml file
			url = service.getCapabilitiesUrl();
			fileName = url.substring(url.lastIndexOf("/"), url.length());
			splitFileName = fileName.split("\\?");
			f = new File(path+splitFileName[0]);
			
			//change the xml structure for copy
			source = new DOMSource(newDoc);
			result = new StreamResult(f);
			transformer.transform(source, result);
		}  catch (TransformerException e) {
			log.error("TransformerExceptionException on updating wms file: ",e);
		}
	}
	
	public static Document updateCapabilititesDocument(Document doc, WmsService service) throws TransformerConfigurationException, TransformerException, TransformerFactoryConfigurationError, IOException{
			// Set actual service name to capabilities 
			if(service.getName() != null){
				Node titleNode = (Node) XPathUtils.getNode(doc, "//Service/Title");
				if(titleNode != null){
					titleNode.setTextContent(service.getName());
				}
			}
			
			try {
				doc = addIndexToLayers(doc);
			} catch (XPathExpressionException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		return doc;
	}
	
	public static Document stringToDoc(String value) {

		try {
	        DocumentBuilder db = DocumentBuilderFactory.newInstance().newDocumentBuilder();
	        InputSource is = new InputSource();
	        is.setCharacterStream(new StringReader(value));
	        Document doc = db.parse(is);
	        return doc;
		} catch (ParserConfigurationException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			e.printStackTrace();
		} catch (SAXException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			e.printStackTrace();
		} catch (IOException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			e.printStackTrace();
		}
        return null;
    }

	public static Document addIndexToLayers(Document doc) throws XPathExpressionException, TransformerConfigurationException, TransformerException, TransformerFactoryConfigurationError, IOException{
		NodeList nodeList = XPathUtils.getNodeList(doc, "//Layer");
		for(int i=0; i < nodeList.getLength(); i++){
			Node node = nodeList.item(i);
			if(!XPathUtils.nodeExists(node, "./Name")){
				Element nameNode = doc.createElement("Name");
				String txt = "";
				if(node.getFirstChild() != null){
					Node childNode = node.getFirstChild();
					if(node.getNodeName() != null)
						txt = txt + "" + node.getNodeName();
					if(node.getNodeValue() != null)
						txt = txt + "" + node.getNodeValue();
					if(node.getTextContent() != null)
						txt = txt + "" + node.getTextContent();
					Text textNode = doc.createTextNode("INGRID-" + CapabilitiesUtils.createMD5NameText(txt));
					nameNode.appendChild(textNode);
					node.insertBefore(nameNode, childNode);					
				}
			}
		}
		return doc;
	}
	
	public static String createMD5NameText(String text) throws TransformerConfigurationException, TransformerException, TransformerFactoryConfigurationError, IOException {
		InputStream is = new ByteArrayInputStream(text.getBytes());
		 
		return MD5Util.getMD5(is);
	}
}
