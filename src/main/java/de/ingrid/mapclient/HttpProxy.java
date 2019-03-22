/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2019 wemove digital solutions GmbH
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
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;

import org.apache.commons.lang.StringUtils;

import de.ingrid.mapclient.utils.Utils;

/**
 * HttpProxy is used to call remote services to eliminate cross domain issues.
 * 
 * @author ingo@wemove.com
 */
public class HttpProxy {

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
        StringBuffer response = new StringBuffer();
        if(urlStr != null) {
            // add protocol if missing
            if (!urlStr.startsWith( "https://" )) {
                if (!urlStr.startsWith( "http://" )) {
                    urlStr = "http://" + urlStr;
                }
            }
    
            // send request
            InputStream is = null;
            try {
                URL url = new URL( urlStr );
                URLConnection conn = url.openConnection();
                if(StringUtils.isNotEmpty(login) && StringUtils.isNotEmpty(password)) {
                    Utils.urlConnectionAuth(conn, login, password);
                }
                is = new BufferedInputStream(conn.getInputStream());
                BufferedReader br = new BufferedReader(new InputStreamReader(is));
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
            finally {
                if (is != null) {
                    try { 
                        is.close(); 
                    } 
                    catch (IOException e) {
                    }
                }   
            }
            if(urlStr.startsWith("http:") && (result == null || result.trim().length() == 0)){
                result = doRequest(urlStr.replace("http:", "https:"), login, password);
            }
        }
        return result;
    }
}
