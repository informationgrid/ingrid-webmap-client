package de.ingrid.mapclient.utils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

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
				String txt = "INGRID-";
				if(node.getFirstChild() != null){
					txt = txt.concat(generateRandomString());
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
}
