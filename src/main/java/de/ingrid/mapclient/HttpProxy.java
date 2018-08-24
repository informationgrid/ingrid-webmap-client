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
package de.ingrid.mapclient;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;

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
        String result = null;
        if(urlStr != null) {
            StringBuffer response = new StringBuffer();
    
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
    
                is = new BufferedInputStream(conn.getInputStream());
                BufferedReader br = new BufferedReader(new InputStreamReader(is));
                String inputLine = "";
                while ((inputLine = br.readLine()) != null) {
                    response.append(inputLine);
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
                result = doRequest(urlStr.replace("http:", "https:"));
            }
        }
        return result;
    }
}
