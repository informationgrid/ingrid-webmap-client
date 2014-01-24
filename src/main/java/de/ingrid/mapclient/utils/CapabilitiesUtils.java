package de.ingrid.mapclient.utils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactoryConfigurationError;
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
