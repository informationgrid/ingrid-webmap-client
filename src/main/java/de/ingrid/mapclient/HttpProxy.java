/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2020 wemove digital solutions GmbH
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
package de.ingrid.mapclient;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.URL;
import java.net.URLConnection;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.w3c.dom.Document;

import de.ingrid.mapclient.model.GetCapabilitiesDocument;
import de.ingrid.mapclient.utils.Utils;

/**
 * HttpProxy is used to call remote services to eliminate cross domain issues.
 * 
 * @author ingo@wemove.com
 */
public class HttpProxy {
    
    private static final Logger log = Logger.getLogger( HttpProxy.class );

    /**
     * Do a HTTP request. The method checks, if the url contains the strings
     * SERVICE=WMS and REQUEST=GetCapabilities or REQUEST=GetFeatureInfo and
     * throws an exception if not.
     * 
     * @param urlStr
     *            The request url
     * @return String
     * @throws Exception
     */
    public static GetCapabilitiesDocument doCapabilitiesRequest(String urlStr) throws Exception {
        return doCapabilitiesRequest(urlStr, null);
    }

    public static GetCapabilitiesDocument doCapabilitiesRequest(String urlStr, String login) throws Exception {
        String password = null;
        if(login != null) {
            password = Utils.getServiceLogin(urlStr, login);
        }
        return doCapabilitiesRequest(urlStr, login, password);
    }

    public static GetCapabilitiesDocument doCapabilitiesRequest(String urlStr, String login, String password) throws Exception {
        GetCapabilitiesDocument result = null;
        if(urlStr != null) {
            // add protocol if missing
            if (!urlStr.startsWith( "https://" ) && !urlStr.startsWith( "http://" )) {
                urlStr = "http://" + urlStr;
            }
    
            // send request
            URL url = new URL( urlStr );
            URLConnection conn = url.openConnection();
            if(StringUtils.isNotEmpty(login) && StringUtils.isNotEmpty(password)) {
                Utils.urlConnectionAuth(conn, login, password);
            }
            try (
                InputStream is = new BufferedInputStream(conn.getInputStream());
            ){
                DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                factory.setValidating(false);
                DocumentBuilder builder = factory.newDocumentBuilder();
                Document doc = builder.parse(is);
                
                TransformerFactory tf = TransformerFactory.newInstance();
                Transformer transformer = tf.newTransformer();
                StringWriter writer = new StringWriter();
                transformer.transform(new DOMSource(doc), new StreamResult(writer));
                if (doc != null) {
                    result = new GetCapabilitiesDocument();
                    result.setDoc(doc);
                    result.setXml(writer.getBuffer().toString());
                }
            }
            catch (Exception e) {
                log.error("Error load xml content: " + urlStr, e);
                result = null;
            }
            if(urlStr.startsWith("http:") && result == null){
                result = doCapabilitiesRequest(urlStr.replace("http:", "https:"), login, password);
            }
        }
        return result;
    }
    
    public static String doRequest(String urlStr) throws Exception {
        return doRequest(urlStr, null);
    }

    public static String doRequest(String urlStr, String login) throws Exception {
        String password = null;
        if(login != null) {
            password = Utils.getServiceLogin(urlStr, login);
        }
        return doRequest(urlStr, login, password);
    }

    public static String doRequest(String urlStr, String login, String password) throws Exception {
        String result = null;
        StringBuilder response = new StringBuilder();
        if(urlStr != null) {
            // add protocol if missing
            if (!urlStr.startsWith( "https://" ) && !urlStr.startsWith( "http://" )) {
                urlStr = "http://" + urlStr;
            }
    
            // send request
            URL url = new URL( urlStr );
            URLConnection conn = url.openConnection();
            if(StringUtils.isNotEmpty(login) && StringUtils.isNotEmpty(password)) {
                Utils.urlConnectionAuth(conn, login, password);
            }
            try (
                InputStream is = new BufferedInputStream(conn.getInputStream());
                BufferedReader br = new BufferedReader(new InputStreamReader(is));
            ){
                
                String inputLine = "";
                while ((inputLine = br.readLine()) != null) {
                    response.append(inputLine);
                    response.append("\n");
                }
                result = response.toString();
            }
            catch (Exception e) {
                result = null;
            }
            if(urlStr.startsWith("http:") && (result == null || result.trim().length() == 0)){
                result = doRequest(urlStr.replace("http:", "https:"), login, password);
            }
        }
        return result;
    }
}
