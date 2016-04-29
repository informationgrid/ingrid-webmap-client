/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
package de.ingrid.mapclient.rest;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.Iterator;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

@Path("/search")
public class SearchResource {

    private static final Logger log = Logger.getLogger( SearchResource.class );
    /**
     * Path to search term
     */
    private static final String SEARCH_PATH = "query";

    @GET
    @Path(SEARCH_PATH)
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response search(@QueryParam("q") String searchTerm, @QueryParam("lang") String lang, @QueryParam("type") String type, @QueryParam("searchUrl") String searchUrl,
            @QueryParam("searchUrlParams") String searchUrlParams) throws Exception {
        searchTerm = searchTerm.trim();

        if (searchTerm.length() > 2) {
            try {
                searchTerm = URLEncoder.encode( searchTerm, "UTF-8" );
            } catch (Exception e) {
                log.error( "Error url encoding seach term: " + searchTerm, e );
            }

            if (type != null) {
                if (type.indexOf( "locations" ) > -1) {
                    JSONArray json = new JSONArray();
                    URL questUrl;

                    // Nominatim
                    try {
                        questUrl = new URL( searchUrl.concat( "&q=" + URLEncoder.encode( searchTerm.trim() ) ) );
                        URLConnection con = questUrl.openConnection();
                        InputStream in = con.getInputStream();
                        String encoding = con.getContentEncoding();
                        encoding = encoding == null ? "UTF-8" : encoding;

                        String tmpJson = IOUtils.toString( in, encoding );
                        JSONArray questJson = new JSONArray( tmpJson );
                        for (int j = 0; j < questJson.length(); j++) {
                            JSONObject questJsonEntry = questJson.getJSONObject( j );
                            JSONObject newEntry = new JSONObject();
                            newEntry.put( "id", questJsonEntry.get( "place_id" ) );
                            newEntry.put( "weight", 7 );
                            JSONObject newAttrs = new JSONObject();
                            newAttrs.put( "origin", "gazetteer" );
                            newAttrs.put( "label", questJsonEntry.get( "display_name" ) );
                            newAttrs.put( "detail", questJsonEntry.get( "licence" ) );
                            newAttrs.put( "rank", 6 );
                            JSONArray bounding = (JSONArray) questJsonEntry.get( "boundingbox" );
                            float minX = bounding.getInt( 2 );
                            float minY = bounding.getInt( 0 );
                            float maxX = bounding.getInt( 3 );
                            float maxY = bounding.getInt( 1 );
                            newAttrs.put( "geom_st_box2d", minX + " " + minY + " " + maxX + " " + maxY );
                            newAttrs.put( "lon", questJsonEntry.get( "lon" ) );
                            newAttrs.put( "lat", questJsonEntry.get( "lat" ) );
                            newEntry.put( "attrs", newAttrs );
                            json.put( newEntry );
                        }
                    } catch (Exception e) {}
                    String responseStr = json.toString();
                    if (json != null) {
                        responseStr = "{\"results\":" + json + "}";
                    }
                    return Response.ok( responseStr ).build();
                } else if (type.equals( "layers" )) {
                    String url = searchUrl;
                    URL questUrl;
                    JSONArray json = new JSONArray();
                    try {
                        questUrl = new URL( url );
                        URLConnection con = questUrl.openConnection();
                        InputStream in = con.getInputStream();
                        String encoding = con.getContentEncoding();
                        encoding = encoding == null ? "UTF-8" : encoding;

                        String tmpJson = IOUtils.toString( in, encoding );
                        JSONObject questJson = new JSONObject( tmpJson );
                        Iterator<?> keys = questJson.keys();

                        while (keys.hasNext()) {
                            String key = (String) keys.next();
                            if (questJson.get( key ) instanceof JSONObject) {
                                JSONObject questJsonEntry = (JSONObject) questJson.get( key );
                                JSONObject newEntry = new JSONObject();
                                newEntry.put( "id", "" );
                                newEntry.put( "weight", 143 );
                                JSONObject newAttrs = new JSONObject();
                                newAttrs.put( "origin", "layer" );
                                newAttrs.put( "layer", questJsonEntry.get( "serverLayerName" ) );
                                newAttrs.put( "label", questJsonEntry.get( "label" ) );
                                newAttrs.put( "detail", questJsonEntry.get( "label" ) );
                                newAttrs.put( "lang", "de" );
                                newAttrs.put( "staging", "prod" );
                                newAttrs.put( "topics", questJsonEntry.get( "topics" ) );
                                newEntry.put( "attrs", newAttrs );
                                json.put( newEntry );
                            }
                        }
                    } catch (Exception e) {
                        log.info( "Search service unreachable: " + url );
                    }
                    String responseStr = json.toString();
                    if (json != null) {
                        responseStr = "{\"results\":" + json + "}";
                    }
                    return Response.ok( responseStr ).build();
                }
            }
        }
        return Response.ok( "{\"results\":[]}" ).build();
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
    private Document getDocumentFromStream(InputStream result) throws ParserConfigurationException, SAXException, IOException {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        // Document descriptorDoc = builder.parse(new InputSource(new
        // InputStreamReader(result, "UTF8")));
        Document descriptorDoc = builder.parse( result );
        return descriptorDoc;
    }
}
