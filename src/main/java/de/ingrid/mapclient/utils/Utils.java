/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2022 wemove digital solutions GmbH
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
import java.io.InputStream;
import java.io.PrintWriter;
import java.net.URISyntaxException;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.*;

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
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.SAXException;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.model.GetCapabilitiesDocument;

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
                String fileContent = FileUtils.readFileToString( file, StandardCharsets.UTF_8.toString());
                if(StringUtils.isNotEmpty(fileContent)){
                    return fileContent;
                }
            } catch (IOException e) {
                log.error( "Error read file '" + file.getAbsoluteFile() + "'.");
            }
        }else{
            log.debug( "Error get file" + file.getAbsoluteFile() + "'.");
        }
        return "";
    }

    public static void writeFileContent (File file, String content) throws IOException {
        if(file != null && content != null) {
            try (
                FileWriter fileWriter = new FileWriter( file );
            ){
                fileWriter.write( content );
                fileWriter.flush();
            } catch (IOException e) {
                log.error("Error update file: " + file.getAbsolutePath());
            }
        }
    }

    public static void createFile(String filename, JSONObject item) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File file = new File(configDir.concat(filename));
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
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File file;
        if(doBackup) {
            File cpFile = new File(configDir.concat(filename + "." + getDateFlag()));
            if(cpFile.exists() && !cpFile.delete()) {
                log.error("Error delete file: '" + cpFile.getName() + "'" );
            }
            file = new File(configDir.concat(filename));
            if(file.exists() && !file.renameTo( cpFile )) {
                log.error("Error rename file: '" + file.getName() + "'" );
            }
        }
        file = new File(configDir.concat(filename));
        cleanFileContent(file);
        cleanDirectory(file);
        log.debug( "Update file :" + file.getAbsoluteFile() );
        try(FileWriter fw = new FileWriter(file, true);
            BufferedWriter bw = new BufferedWriter(fw);
            PrintWriter out = new PrintWriter(bw)){
            out.println(item.toString());
        } catch (IOException e) {
            log.error( "Error write new json file!" );
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
                       if(tmpFileName.indexOf("." + flagYear) > -1 && tmpFile.getName().indexOf("." + flagMonth) == -1 && tmpFile.delete()) {
                           log.debug("Delete file: " +  tmpFile.getName());
                       }
                   }
               }
            }
        }
        
    }

    public static void removeFile(String filename) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File file = new File(configDir.concat(filename));
        if(file.exists() && !file.delete()) {
            log.error("Error delete file: '" + file.getName() + "'" );
        }
    }

    public static String checkWMSUrl(String url, String paramString){
        String[] partsParamString = paramString.split("&");
        StringBuilder tmpUrl = new StringBuilder(url);
        for (int i = 0; i < partsParamString.length; i++) {
          String partParamString = partsParamString[i];
          if(tmpUrl.toString().toLowerCase().indexOf(partParamString.toLowerCase()) < 0){
            if(tmpUrl.toString().indexOf('?') < 0){
                tmpUrl.append("?");
            }
            if(!tmpUrl.toString().endsWith("?")){
                tmpUrl.append("&");
            }
            if(tmpUrl.toString().indexOf(partParamString.split("=")[0]) < 0){
                tmpUrl.append(partParamString);
            }
          }
        }
        return tmpUrl.toString();
    }
    
    public static String getPropertyFromJSONFiles(String[] paths, String key, String defaultValue) throws Exception {
        JSONObject values = new JSONObject();
        for (String path : paths) {
            File file = new File(path);
            if(file.exists()) {
                log.debug("Load file: " + path);
                String fileContent = Utils.getFileContent(path, "", "", "");
                if(StringUtils.isNotEmpty(fileContent)) {
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
        try (
            BufferedInputStream f = new BufferedInputStream( new FileInputStream( file ) );
        ){
            f.read( buffer );
        } catch (Exception e) {
           log.error("Error read file: '" + file.getName() + "'");
        }
        return new String( buffer );
    }
    
    public static boolean sendEmail(String from, String subject, String[] to, String text, Map headers, String host, String port, String user, String password, boolean ssl,
            String protocol) {
        return sendEmail( from, subject, to, text, headers, host, port, user, password, ssl, protocol, null, null);
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

    public static boolean evaluate(GetCapabilitiesDocument getCapabilities) {
        boolean isMapContent = false;
        if(getCapabilities != null) {
            String content = getCapabilities.getXml();
            String[] checkList = { "gpx", "kml", "Capabilities", "WMS_Capabilities", "WMT_MS_Capabilities" };
            if(content != null) {
                for (String check : checkList) {
                    if(content.indexOf("<" + check) > -1 && content.indexOf("</" + check + ">") > -1) {
                        isMapContent = true;
                        break;
                    }
                }
            }
        }
        return isMapContent;
    }

    /**
     * Create a parseable DOM-document of the InputStream, which should be
     * XML/HTML.
     * 
     * @param result
     * @return
     * @throws ParserConfigurationException
     * @throws SAXException
     * @throws IOException
     */
    public static Document getDocumentFromStream(InputStream result) throws ParserConfigurationException, SAXException, IOException {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        factory.setValidating(false);
        factory.setNamespaceAware(false);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setFeature("http://apache.org/xml/features/nonvalidating/load-dtd-grammar", false);
        factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        return builder.parse( result );
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
    public static boolean sendEmail(String from, String subject, String[] to, String text, Map headers, String host, String port, String user, String password, boolean ssl,
            String protocol, File attachment, String[] replyToList) {

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

            if(replyToList != null) {
                InternetAddress[] replyTo = new InternetAddress[replyToList.length];
                for (int i = 0; i < replyToList.length; i++) {
                    replyTo[i] = new InternetAddress(replyToList[i]);
                }
                msg.setReplyTo(replyTo);
            }

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
            if (attachment != null && attachment.delete()) {
                log.debug("Delete attachment: " + attachment.getName());
            }
        }
        return emailSent;
    }
    
    public static void urlConnectionAuth(URLConnection conn, String login, String password) {
        String userPassword = login + ":" + password;
        String encoding = Base64.getEncoder().encodeToString(userPassword.getBytes());
        conn.setRequestProperty("Authorization", "Basic " + encoding);
    }
    
    public static void setServiceLogin(String url, String login, String password) throws JSONException, URISyntaxException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "service.auth", ".json", "config/");
            if(fileContent.isEmpty()) {
                fileContent = "{}";
            }
            JSONObject serviceAuth = new JSONObject(fileContent);
            JSONObject loginAuth = null;
            loginAuth = new JSONObject();
            loginAuth.put("login", login);
            loginAuth.put("password", password);
            serviceAuth.put(url.split("\\?")[0], loginAuth);
            Utils.updateFile("config/service.auth.json", serviceAuth);
        }
    }
    
    public static String getServiceLogin(String url, String login) throws JSONException, URISyntaxException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "service.auth", ".json", "config/");
            if(StringUtils.isNotEmpty(fileContent)) {
                JSONObject serviceAuth = new JSONObject(fileContent);
                String tmpUrl = url.split("\\?")[0];
                if(serviceAuth.has(tmpUrl)){
                    JSONObject auth = serviceAuth.getJSONObject(tmpUrl);
                    if(auth.has("login") && auth.has("password") && login.equals(auth.getString("login"))) {
                        return auth.getString("password"); 
                    }
                }
            }
        }
        return "";
    }
    
    public static String getDateFlag() {
        return getDateFlag("yyyyMMdd");
    }
    
    public static String getDateFlag(String format) {
        Date date = new Date();  
        Timestamp ts=new Timestamp(date.getTime());  
        SimpleDateFormat formatter = new SimpleDateFormat(format);  
        
        return formatter.format(ts);
    }

    public static int countDirectoryFiles(File[] files) {
        return countDirectoryFiles(files, false);
    }

    public static int countDirectoryFiles(File[] files, boolean includeSubDir) {
        int count = files.length;
        if(includeSubDir) {
            for (int i = 0; i < files.length; i++) {
                File file = files[i];
                if(file.isDirectory()) {
                    count += countDirectoryFiles(file.listFiles(), includeSubDir);
                }
            }
        }
        return count;
    } 
}

class MailAuthenticator extends Authenticator {
    private String user;
    private String password;

    public MailAuthenticator(String user, String password) {
        this.user = user;
        this.password = password;
    }

    @Override
    public PasswordAuthentication getPasswordAuthentication() {
        return new PasswordAuthentication( this.user, this.password );
    }
}


