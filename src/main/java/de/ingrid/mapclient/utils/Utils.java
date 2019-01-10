/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2018 wemove digital solutions GmbH
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

import java.io.BufferedInputStream;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLConnection;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Date;
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

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import de.ingrid.mapclient.ConfigurationProvider;
import sun.misc.BASE64Encoder;

public class Utils {

    private static final Logger log = Logger.getLogger( Utils.class );

    public static void cleanFileContent(File file) {
        PrintWriter writer = null;
        try {
            writer = new PrintWriter(file);
        } catch (FileNotFoundException e) {
           log.error("Error found file: " +  file.getAbsolutePath());
        }
        if(writer != null) {
            writer.print("");
            writer.close();
        }
    }
    
    public static String getFileContent(String path, String filename, String fileTyp, String prefix){
        if(!path.endsWith( "/" )){
            path = path.concat( "/" );
        }
        path = path.concat( prefix );
        File directory = new File(path);
        if(!directory.exists()){
            directory.mkdir();
        }
        File file = new File(path.concat(filename).concat(fileTyp));
        if(file.exists()){
            try {
                String fileContent = FileUtils.readFileToString( file, "UTF-8");
                if(fileContent != null){
                    return fileContent;
                }
            } catch (IOException e) {
                log.error( "Error read file '" + file.getAbsoluteFile() + "'.");
            }
        }else{
            log.debug( "Error get file" + file.getAbsoluteFile() + "'.");
        }
        return null;
    }

    public static void writeFileContent (File file, String content) throws IOException {
        if(file != null && content != null) {
            FileWriter fileWriter = null;
            try {
                fileWriter = new FileWriter( file );
                fileWriter.write( content );
                fileWriter.flush();
            } catch (IOException e) {
                log.error("Error update file: " + file.getAbsolutePath());
            } finally {
                if (fileWriter != null) {
                    fileWriter.close();
                }
            }
        }
    }

    public static void createFile(String filename, JSONObject item) throws JSONException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File file = new File(config_dir.concat(filename));
        if(!file.exists()){
            try(FileWriter fw = new FileWriter(file, true);
                BufferedWriter bw = new BufferedWriter(fw);
                PrintWriter out = new PrintWriter(bw)){
                out.println(item.toString());
            } catch (IOException e) {
                log.error( "Error write new json file!" );
            }
        }
    }
    public static void updateFile(String filename, Object item) {
        updateFile(filename, item, true);
    }

    public static void updateFile(String filename, Object item, boolean doBackup) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File file;
        if(doBackup) {
            File cpFile = new File(config_dir.concat(filename + "." + getDateFlag()));
            if(cpFile.exists()){
                if(!cpFile.delete()) {
                    log.error("Error delete file: '" + cpFile.getName() + "'" );
                }
            }
            file = new File(config_dir.concat(filename));
            if(file.exists()) {
                if(!file.renameTo( cpFile )) {
                    log.error("Error rename file: '" + file.getName() + "'" );
                }
            }
        }
        file = new File(config_dir.concat(filename));
        cleanFileContent(file);
        cleanDirectory(file);
        log.debug( "Update file :" + file.getAbsoluteFile() );
        if(file != null){
            try(FileWriter fw = new FileWriter(file, true);
                BufferedWriter bw = new BufferedWriter(fw);
                PrintWriter out = new PrintWriter(bw)){
                out.println(item.toString());
            } catch (IOException e) {
                log.error( "Error write new json file!" );
            }
        }
    }
    
    public static void cleanDirectory(File file) {
        if(file != null) {
            String flagYear = getDateFlag("yyyy");
            String flagMonth = getDateFlag("yyyyMM");
            File parentFolder = file.getParentFile();
            if(parentFolder.isDirectory()) {
               for(File tmpFile: parentFolder.listFiles()) {
                   if(!tmpFile.isDirectory()) {
                       String tmpFileName = tmpFile.getName();
                       if(tmpFileName.indexOf("." + flagYear) > -1) {
                           if(tmpFile.getName().indexOf("." + flagMonth) == -1) {
                               tmpFile.delete();
                           }
                       }
                   }
               }
            }
        }
        
    }

    public static void removeFile(String filename) throws JSONException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File file = new File(config_dir.concat(filename));
        if(file.exists()) {
            if(!file.delete()) {
                log.error("Error delete file: '" + file.getName() + "'" );
            }
        }
    }

    public static String checkWMSUrl(String url, String paramString){
        String[] partsParamString = paramString.split("&");
        String tmpUrl = url.toLowerCase();
        for (int i = 0; i < partsParamString.length; i++) {
          String partParamString = partsParamString[i];
          if(tmpUrl.indexOf(partParamString.toLowerCase()) < 0){
            if(url.indexOf("?") < 0){
                url += "?";
            }
            if(url.endsWith("?") == false){
                url += "&";
            }
            if(url.indexOf(partParamString.split("=")[0]) < 0){
                url += partParamString;
            }
          }
        }
        return url;
    }
    
    public static String getPropertyFromJSONFiles(String[] paths, String key, String defaultValue) throws Exception {
        JSONObject values = new JSONObject();
        for (String path : paths) {
            File file = new File(path);
            if(file.exists()) {
                log.debug("Load file: " + path);
                String fileContent = Utils.getFileContent(path, "", "", "");
                if(fileContent != null) {
                    JSONObject setting = new JSONObject(fileContent);
                    Iterator<?> keys = setting.keys();
                    while( keys.hasNext() ) {
                        String tmpKey = (String)keys.next();
                        values.put(tmpKey, setting.get(tmpKey));
                    }
                }
            }
        }
        if(values.has(key)) {
            return values.getString(key);
        }
        log.debug("Use default value for key: "+ key + "=" + defaultValue);
        return defaultValue;
    }

    public static String readFileAsString(File file) {
        byte[] buffer = new byte[(int) file.length()];
        BufferedInputStream f = null;
        try {
            f = new BufferedInputStream( new FileInputStream( file ) );
            f.read( buffer );
        } catch (Exception e) {
           log.error("Error read file: '" + file.getName() + "'");
        } finally {
            if (f != null)
                try {
                    f.close();
                } catch (IOException ignored) {}
        }
        return new String( buffer );
    }
    
    public static boolean sendEmail(String from, String subject, String[] to, String text, HashMap headers, String host, String port, String user, String password, boolean ssl,
            String protocol) {
        return sendEmail( from, subject, to, text, headers, host, port, user, password, ssl, protocol, null );
    }

    public static String getNameFromXML(Document doc) {
        XPath xpath = XPathFactory.newInstance().newXPath();
        String name = "";
        try {
            Node n = (Node) xpath.evaluate( "//Service/Title", doc, XPathConstants.NODE );
            if (n != null) {
                name = n.getTextContent();
            }
        } catch (XPathExpressionException e) {
            log.error( "XPathExpressionException on get xm name: ", e );
        }
        return name;
    }

    /**
     * utility method for parsing xml strings
     * 
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
            is.setCharacterStream( new StringReader( xmlSource ) );
            Document doc = db.parse( is );
            return doc;
        } catch (ParserConfigurationException e) {
            log.error( "error on parsing xml string: " + e.getMessage() );
            throw new WebApplicationException( e, Response.Status.CONFLICT );
        } catch (SAXException e) {
            log.error( "error on parsing xml string: " + e.getMessage() );
            throw new SAXException( e );
        } catch (IOException e) {
            log.error( "error on parsing xml string: " + e.getMessage() );
            throw new WebApplicationException( e, Response.Status.CONFLICT );
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
    public static boolean sendEmail(String from, String subject, String[] to, String text, HashMap headers, String host, String port, String user, String password, boolean ssl,
            String protocol, File attachment) {

        boolean debug = log.isDebugEnabled();
        boolean emailSent = false;
        Session session;

        Properties props = new Properties();
        props.put( "mail.smtp.host", host );

        if (!port.equals( "" )) {
            props.put( "mail.smtp.port", port );
        }

        if (!protocol.equals( "" )) {
            props.put( "mail.transport.protocol", protocol );
        }

        if (ssl) {
            props.put( "mail.smtp.starttls.enable", "true" );
            props.put( "mail.smtp.socketFactory.port", port );
            props.put( "mail.smtp.ssl.enable", true );
            props.put( "mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory" );
            props.put( "mail.smtp.socketFactory.fallback", "false" );
        }

        if (!user.equals( "" ) && !password.equals( "" )) {
            props.put( "mail.smtp.auth", "true" );
            Authenticator auth = new MailAuthenticator( user, password );
            // create some properties and get the default Session
            session = Session.getDefaultInstance( props, auth );
        } else {
            // create some properties and get the default Session
            session = Session.getDefaultInstance( props, null );
        }

        session.setDebug( debug );

        // create a message
        Message msg = new MimeMessage( session );

        try {
            // set the from and to address
            InternetAddress addressFrom = new InternetAddress( from );
            msg.setFrom( addressFrom );

            InternetAddress[] addressTo = new InternetAddress[to.length];
            for (int i = 0; i < to.length; i++) {
                addressTo[i] = new InternetAddress( to[i] );
            }
            msg.setRecipients( Message.RecipientType.TO, addressTo );

            // set custom headers
            if (headers != null) {
                Set keySet = headers.keySet();
                Iterator it = keySet.iterator();
                while (it.hasNext()) {
                    String key = it.next().toString();
                    msg.addHeader( key, (String) headers.get( key ) );
                }
            }

            // Setting the Subject and Content Type
            msg.setSubject( subject );

            // create the message part
            MimeBodyPart messageBodyPart = new MimeBodyPart();
            // fill message
            messageBodyPart.setText( text );

            Multipart multipart = new MimeMultipart();
            multipart.addBodyPart( messageBodyPart );

            if (attachment != null) {
                // Part two is attachment
                messageBodyPart = new MimeBodyPart();
                DataSource source = new FileDataSource( attachment );
                messageBodyPart.setDataHandler( new DataHandler( source ) );
                messageBodyPart.setFileName( attachment.getName() );
                multipart.addBodyPart( messageBodyPart );
            }
            msg.setContent( multipart );
            Transport.send( msg );
            emailSent = true;
        } catch (AddressException e) {
            log.error( "invalid email address format", e );
        } catch (MessagingException e) {
            log.error( "error sending email.", e );
        } finally {
            if (attachment != null) {
                attachment.delete();
            }
        }

        return emailSent;
    }
    
    public static void urlConnectionAuth(URLConnection conn, String login, String password) {
        String userPassword = login + ":" + password;
        String encoding = new BASE64Encoder().encode(userPassword.getBytes());
        conn.setRequestProperty("Authorization", "Basic " + encoding);
    }
    
    public static void setServiceLogin(String url, String login, String password) throws JSONException, URISyntaxException {
        String fileContent = "{}";
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "service.auth", ".json", "config/");
        }
        URI uri = new URI(url);
        JSONObject serviceAuth = new JSONObject(fileContent);
        JSONObject loginAuth = null;
        String host = uri.getHost();
        if(serviceAuth.has(host)) {
            loginAuth = serviceAuth.getJSONObject(host);
        } else {
            loginAuth = new JSONObject();
            loginAuth.put("login", login);
            loginAuth.put("password", password);
            if(uri.getScheme().equals("https")) {
                loginAuth.put("port", "443");
            }
        }
        serviceAuth.put(host, loginAuth);
        Utils.updateFile("config/service.auth.json", serviceAuth);
    }
    
    public static String getServiceLogin(String url, String login) throws JSONException, URISyntaxException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(config_dir != null){
            String fileContent = Utils.getFileContent(config_dir, "service.auth", ".json", "config/");
            URI uri = new URI(url);
            JSONObject serviceAuth = new JSONObject(fileContent);
            String key = uri.getHost();
            if(serviceAuth.has(key)){
                JSONObject auth = serviceAuth.getJSONObject(key);
                if(auth.has("login") && auth.has("password")) {
                    if(login.equals(auth.getString("login"))) {
                        return auth.getString("password"); 
                    }
                }
            }
        }
        return null;
    }
    
    public static String getDateFlag() {
        return getDateFlag("yyyyMMdd");
    }
    
    public static String getDateFlag(String format) {
        Date date = new Date();  
        Timestamp ts=new Timestamp(date.getTime());  
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMdd");  
        
        return formatter.format(ts);
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
        return new PasswordAuthentication( this.user, this.password );
    }
}


