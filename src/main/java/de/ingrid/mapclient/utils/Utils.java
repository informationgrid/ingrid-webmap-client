package de.ingrid.mapclient.utils;

import java.io.File;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Properties;
import java.util.Set;

import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.activation.FileDataSource;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
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
	
	public static boolean sendEmail(String from, String subject, String[] to, String text, HashMap headers, String host) {
		return sendEmail(from, subject, to, text, headers, host, null);
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
	public static boolean sendEmail(String from, String subject, String[] to, String text, HashMap headers, String host, File attachment) {

		boolean debug = log.isDebugEnabled();
		boolean emailSent = false;

		Properties props = new Properties();
		props.put("mail.smtp.host", host);

		Session session = Session.getDefaultInstance(props, null);
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
