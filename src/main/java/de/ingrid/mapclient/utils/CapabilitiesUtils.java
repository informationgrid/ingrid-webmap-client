package de.ingrid.mapclient.utils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPathExpressionException;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.Text;

import de.ingrid.utils.tool.MD5Util;
import de.ingrid.utils.xml.XPathUtils;

public class CapabilitiesUtils { 

	protected static final char ALPHABET[] = "0123456789abcdefghijklmnopqrstuvwxyz".toCharArray();
	protected static final int LENGTH = 8;
	
	public static Document addIndexToLayers(Document doc) throws XPathExpressionException, TransformerConfigurationException, TransformerException, TransformerFactoryConfigurationError, IOException{
		NodeList nodeList = XPathUtils.getNodeList(doc, "//Layer");
		for(int i=0; i < nodeList.getLength(); i++){
			Node node = nodeList.item(i);
			if(!XPathUtils.nodeExists(node, "./Name")){
				Element nameNode = doc.createElement("Name");
				String txt = "";
				if(node.getFirstChild() != null){
					txt = generateRandomString();
					Text textNode = doc.createTextNode(txt);
					nameNode.appendChild(textNode);
					node.insertBefore(nameNode, node.getFirstChild());					
				}
			}
		}
		return doc;
	}
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
}
