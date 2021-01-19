/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2021 wemove digital solutions GmbH
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
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import de.ingrid.iplug.opensearch.communication.OSCommunication;

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

        if (searchTerm.length() > 2 && type != null) {
            if (type.indexOf( "locations" ) > -1) {
                JSONArray json = new JSONArray();
                URL questUrl = null;

                // Nominatim
                try {
                    questUrl = new URL( searchUrl.concat( "&q=" + URLEncoder.encode( searchTerm, "UTF-8" ) ) );
                    if (log.isDebugEnabled()) {
                        log.debug( "Requesting nominatim: " + questUrl);                            
                    }
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
                } catch (Exception e) {
                    log.warn( "Problems requesting nominatim: " + questUrl, e);                            
                }
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
                            String label = (String) questJsonEntry.get( "label" );
                            boolean isSearchable = false;
                            if(questJsonEntry.has( "searchable" ) && questJsonEntry.get( "searchable" ) != null){
                                isSearchable = Boolean.valueOf( questJsonEntry.get( "searchable" ).toString());
                            }
                            if(isSearchable && label.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 ){
                                newEntry.put( "id", "" );
                                newEntry.put( "weight", 143 );
                                JSONObject newAttrs = new JSONObject();
                                newAttrs.put( "origin", "layer" );
                                newAttrs.put( "layer", key );
                                newAttrs.put( "label", label );
                                newAttrs.put( "detail", label );
                                newAttrs.put( "lang", "de" );
                                newAttrs.put( "staging", "prod" );
                                newEntry.put( "attrs", newAttrs );
                                json.put( newEntry );
                            }
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
            }else if(type.equals("services")){
                String osURL = searchUrl.replace( " ", "+" );
                JSONArray jsonArray = new JSONArray();
                InputStream result = null;
                
                searchTerm = searchTerm.replaceAll("\\s", "+");
                try {
                    searchTerm = URLEncoder.encode(searchTerm, "UTF-8");
                } catch (Exception e) {
                    log.error("Error url encoding seach term: " + searchTerm, e);
                }
                //some logic borrowed from the opensearch iplug
                //we open a stream though this module 
                //the rest is basically simple xml parsing of the result 
                //into a json string which gets to the mapclient through the 
                //response
                OSCommunication comm = new OSCommunication();
                String url = osURL.replace("{query}", searchTerm); 
                result = comm.sendRequest(url);
                Document doc = null;
                XPath xpath = XPathFactory.newInstance().newXPath();
                if(result != null){
                    try {
                        doc = getDocumentFromStream(result);
                        if(doc != null){
                            NodeList items = (NodeList) xpath.evaluate( "/rss/channel/item", doc , XPathConstants.NODESET);
                            for (int i = 0; i < items.getLength(); i++) {
                                Node item = items.item( i );
                                NodeList tmp;
                                JSONObject newEntry = new JSONObject();
                                newEntry.put( "id", "" );
                                newEntry.put( "weight", 143 );
                                JSONObject newAttrs = new JSONObject();
                                newAttrs.put( "origin", "service" );
                                
                                tmp = ((NodeList) xpath.evaluate("./wms-url", item, XPathConstants.NODESET ));
                                if(tmp.getLength() > 0){
                                    newAttrs.put( "service", tmp.item(0).getTextContent() );
                                }
                                
                                newAttrs.put( "label", xpath.evaluate("./title", item ) );
                                newAttrs.put( "detail", xpath.evaluate("./description", item ) );
                                newAttrs.put( "link", xpath.evaluate("./link", item ) );
                                
                                tmp = ((NodeList) xpath.evaluate("./iso-xml-url", item, XPathConstants.NODESET ));
                                if(tmp.getLength() > 0){
                                    newAttrs.put( "isoxml", tmp.item(0).getTextContent() );
                                }
                                
                                newAttrs.put( "lang", "de" );
                                newAttrs.put( "staging", "prod" );
                                newEntry.put( "attrs", newAttrs );
                                jsonArray.put( newEntry );
                            }
                        }
                    } catch (SAXException | ParserConfigurationException e) {
                        log.error("Error while parsing the InputStream!");
                    } catch (IOException e) {
                        log.error("Error while performing xpath.evaluate on a document!");
                    }
                }
                comm.releaseConnection();
                String responseStr = jsonArray.toString();
                if (jsonArray != null) {
                    responseStr = "{\"results\":" + jsonArray + "}";
                }
                return Response.ok( responseStr ).build();
            }else if(type.equals("bwalocator")){
                JSONArray jsonArray = new JSONArray();
                URL questUrl;
                questUrl = new URL(searchUrl.concat("&searchterm="+URLEncoder.encode(searchTerm, "UTF-8")));
                URLConnection con = questUrl.openConnection();
                InputStream in = con.getInputStream();
                String encoding = con.getContentEncoding();
                encoding = encoding == null ? "UTF-8" : encoding;
                String tmpJson = IOUtils.toString(in, encoding);
                JSONObject questJsonResult = new JSONObject(tmpJson);
                if(questJsonResult != JSONObject.NULL){
                    JSONArray questJson = questJsonResult.getJSONArray("result");
                    
                    for (int j=0; j < questJson.length(); j++) {
                        JSONObject questJsonEntry = questJson.getJSONObject(j);
                        JSONObject newEntry = new JSONObject();
                        newEntry.put( "id", questJsonEntry.getString("bwastrid") );
                        JSONObject newAttrs = new JSONObject();
                        newAttrs.put("label", questJsonEntry.getString("concat_name"));
                        newAttrs.put("qid", questJsonEntry.getString("qid"));
                        newAttrs.put("bwastrid", questJsonEntry.getString("bwastrid"));
                        newAttrs.put("bwastr_name", questJsonEntry.getString("bwastr_name"));
                        newAttrs.put("strecken_name", questJsonEntry.getString("strecken_name"));
                        newAttrs.put("concat_name", questJsonEntry.getString("concat_name"));
                        newAttrs.put("km_von", questJsonEntry.getString("km_von"));
                        newAttrs.put("km_bis", questJsonEntry.getString("km_bis"));
                        newAttrs.put("priority", questJsonEntry.getString("priority"));
                        newAttrs.put("fehlkilometer", questJsonEntry.getString("fehlkilometer"));
                        newAttrs.put("fliessrichtung", questJsonEntry.getString("fliessrichtung"));
                        newEntry.put( "attrs", newAttrs );
                        jsonArray.put(newEntry);
                    }
                }
                String responseStr = jsonArray.toString();
                if (jsonArray != null) {
                    responseStr = "{\"results\":" + jsonArray + "}";
                }
                return Response.ok( responseStr ).build();
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
        return builder.parse( result );
    }
}
