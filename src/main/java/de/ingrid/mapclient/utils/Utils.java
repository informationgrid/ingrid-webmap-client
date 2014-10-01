package de.ingrid.mapclient.utils;

import java.io.File;
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

import org.apache.log4j.Logger;

public class Utils {

	private static final Logger log = Logger.getLogger(Utils.class);
	
	public static boolean sendEmail(String from, String subject, String[] to, String text, HashMap headers, String host, String port, String user, String password, boolean ssl, String protocol) {
		return sendEmail(from, subject, to, text, headers, host, port, user, password, ssl, protocol, null);
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
