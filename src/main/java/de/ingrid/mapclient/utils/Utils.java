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

import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Properties;
import java.util.Set;

import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.activation.FileDataSource;
import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.ws.rs.WebApplicationException;
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
import org.w3c.dom.Node;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

public class Utils {

	private static final Logger log = Logger.getLogger(Utils.class);
	
	public static boolean sendEmail(String from, String subject, String[] to, String text, HashMap headers, String host, String port, String user, String password, boolean ssl, String protocol) {
		return sendEmail(from, subject, to, text, headers, host, port, user, password, ssl, protocol, null);
	}
	
	public static String getNameFromXML(Document doc) {
		XPath xpath = XPathFactory.newInstance().newXPath();
		String name = "";
		try {
			Node n = (Node) xpath.evaluate("//Service/Title", doc, XPathConstants.NODE);
			if(n != null){
				name = n.getTextContent();
			}
		} catch (XPathExpressionException e) {
			log.error("XPathExpressionException on get xm name: ",e);
		}
		return name;
	}
	
	/**
	 * utility method for parsing xml strings 
	 * @param xmlSource
	 * @return
	 * @throws SAXException
	 * @throws ParserConfigurationException
	 * @throws IOException
	 */
    public static Document stringToDom(String xmlSource) throws SAXException {

		try {
	        DocumentBuilder db = DocumentBuilderFactory.newInstance().newDocumentBuilder();
	        InputSource is = new InputSource();
	        is.setCharacterStream(new StringReader(xmlSource));
	        Document doc = db.parse(is);
	        return doc;
		} catch (ParserConfigurationException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			throw new WebApplicationException(e, Response.Status.CONFLICT);
		} catch (SAXException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			throw new SAXException(e);
		} catch (IOException e) {
			log.error("error on parsing xml string: "+e.getMessage());
			throw new WebApplicationException(e, Response.Status.CONFLICT);
		}
    }
	
	/**
	 * Send email
	 * 
	 * @param from
	 * @param subject
	 * @param to
	 * @param text
	 * @param headers
	 * @return true if email was sent, else false
	 */
	public static boolean sendEmail(String from, String subject, String[] to, String text, HashMap headers, String host, String port, String user, String password, boolean ssl, String protocol, File attachment) {

		boolean debug = log.isDebugEnabled();
		boolean emailSent = false;
		Session session; 

		Properties props = new Properties();
		props.put("mail.smtp.host", host);
		
		if(!port.equals("")){
			props.put("mail.smtp.port", port);
		}
	    
		if(!protocol.equals("")){
			props.put("mail.transport.protocol", protocol);
		}
		
		if(ssl){
			props.put("mail.smtp.starttls.enable","true");
			props.put("mail.smtp.socketFactory.port", port);
		    props.put("mail.smtp.ssl.enable", true);
		    props.put("mail.smtp.socketFactory.class","javax.net.ssl.SSLSocketFactory");
		    props.put("mail.smtp.socketFactory.fallback", "false"); 
		}

		if(!user.equals("") && !password.equals("")){
		    props.put("mail.smtp.auth", "true");
			Authenticator auth = new MailAuthenticator(user, password);
			// create some properties and get the default Session
			session = Session.getDefaultInstance(props, auth);
		}else{
			// create some properties and get the default Session
			session = Session.getDefaultInstance(props, null);
		}
		
		session.setDebug(debug);
		
		// create a message
		Message msg = new MimeMessage(session);

		try {
			// set the from and to address
			InternetAddress addressFrom = new InternetAddress(from);
			msg.setFrom(addressFrom);

			InternetAddress[] addressTo = new InternetAddress[to.length];
			for (int i = 0; i < to.length; i++) {
				addressTo[i] = new InternetAddress(to[i]);
			}
			msg.setRecipients(Message.RecipientType.TO, addressTo);

			// set custom headers
			if (headers != null) {
				Set keySet = headers.keySet();
				Iterator it = keySet.iterator();
				while (it.hasNext()) {
					String key = it.next().toString();
					msg.addHeader(key, (String) headers.get(key));
				}
			}
			
			// Setting the Subject and Content Type
			msg.setSubject(subject);
			
			// create the message part 
		    MimeBodyPart messageBodyPart = new MimeBodyPart();
		    // fill message
		    messageBodyPart.setText(text);
			
		    Multipart multipart = new MimeMultipart();
		    multipart.addBodyPart(messageBodyPart);

			if(attachment != null){
				// Part two is attachment
			    messageBodyPart = new MimeBodyPart();
			    DataSource source = new FileDataSource(attachment);
			    messageBodyPart.setDataHandler(new DataHandler(source));
			    messageBodyPart.setFileName(attachment.getName());
			    multipart.addBodyPart(messageBodyPart);
			}
			msg.setContent(multipart);
			Transport.send(msg);
			emailSent = true;
		} catch (AddressException e) {
			log.error("invalid email address format", e);
		} catch (MessagingException e) {
			log.error("error sending email.", e);
		} finally{
			if(attachment != null){
				attachment.delete();
			}
		}

		return emailSent;
	}
}

class MailAuthenticator extends Authenticator {
	private String user; 
	private String password;
	
	public MailAuthenticator(String user, String password) {
		this.user = user;
		this.password = password;
	}

	public PasswordAuthentication getPasswordAuthentication() {
		return new PasswordAuthentication(this.user, this.password);
	}
}
