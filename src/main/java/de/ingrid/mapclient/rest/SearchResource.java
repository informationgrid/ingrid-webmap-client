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
package de.ingrid.mapclient.rest;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.Iterator;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import de.ingrid.mapclient.utils.Utils;

@Path("/search")
public class SearchResource {

    private static final Logger log = Logger.getLogger( SearchResource.class );
    /**
     * Path to search term
     */
    private static final String SEARCH_PATH = "query";

    private static final ObjectMapper mapper = new ObjectMapper();


    @GET
    @Path(SEARCH_PATH)
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response search(@QueryParam("q") String searchTerm, @QueryParam("lang") String lang, @QueryParam("type") String type, @QueryParam("searchUrl") String searchUrl,
            @QueryParam("searchUrlParams") String searchUrlParams) throws Exception {
        searchTerm = searchTerm.trim();

        if (searchTerm.length() > 2 && type != null) {
            if (type.indexOf( "locations" ) > -1) {
                ArrayNode json = mapper.createArrayNode();
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
                    ArrayNode questJson = (ArrayNode) mapper.readTree( tmpJson );
                    for (int j = 0; j < questJson.size(); j++) {
                        JsonNode questJsonEntry = questJson.get( j );
                        ObjectNode newEntry = mapper.createObjectNode();
                        newEntry.put( "id", questJsonEntry.get( "place_id" ) );
                        newEntry.put( "weight", 7 );
                        ObjectNode newAttrs = mapper.createObjectNode();
                        newAttrs.put( "origin", "gazetteer" );
                        newAttrs.put( "label", questJsonEntry.get( "display_name" ) );
                        newAttrs.put( "detail", questJsonEntry.get( "licence" ) );
                        newAttrs.put( "rank", 6 );
                        ArrayNode bounding = (ArrayNode) questJsonEntry.get( "boundingbox" );
                        float minX = bounding.get( 2 ).intValue();
                        float minY = bounding.get( 0 ).intValue();
                        float maxX = bounding.get( 3 ).intValue();
                        float maxY = bounding.get( 1 ).intValue();
                        newAttrs.put( "geom_st_box2d", minX + " " + minY + " " + maxX + " " + maxY );
                        newAttrs.set( "lon", questJsonEntry.get( "lon" ) );
                        newAttrs.set( "lat", questJsonEntry.get( "lat" ) );
                        newEntry.set( "attrs", newAttrs );
                        json.add( newEntry );
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
                ArrayNode json = mapper.createArrayNode();
                try {
                    questUrl = new URL( url );
                    URLConnection con = questUrl.openConnection();
                    InputStream in = con.getInputStream();
                    String encoding = con.getContentEncoding();
                    encoding = encoding == null ? "UTF-8" : encoding;

                    String tmpJson = IOUtils.toString( in, encoding );
                    JsonNode questJson = mapper.readTree( tmpJson );
                    Iterator<Map.Entry<String, JsonNode>> keys = questJson.fields();

                    while (keys.hasNext()) {
                        Map.Entry<String, JsonNode> key = keys.next();
                        if (questJson.get( key.getKey() ) instanceof JsonNode) {
                            JsonNode questJsonEntry = key.getValue();
                            ObjectNode newEntry = mapper.createObjectNode();
                            String label = questJsonEntry.get( "label" ).textValue();
                            boolean isSearchable = false;
                            if(questJsonEntry.hasNonNull( "searchable" ) && questJsonEntry.get( "searchable" ) != null){
                                isSearchable = Boolean.valueOf( questJsonEntry.get( "searchable" ).toString());
                            }
                            if(isSearchable && label.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 ){
                                newEntry.put( "id", "" );
                                newEntry.put( "weight", 143 );
                                ObjectNode newAttrs = mapper.createObjectNode();
                                newAttrs.put( "origin", "layer" );
                                newAttrs.put( "layer", key.getKey() );
                                newAttrs.put( "label", label );
                                newAttrs.put( "detail", label );
                                newAttrs.put( "lang", "de" );
                                newAttrs.put( "staging", "prod" );
                                newEntry.put( "attrs", newAttrs );
                                json.add( newEntry );
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
                String osUrl = searchUrl.replace( " ", "+" );
                ArrayNode jsonArray = mapper.createArrayNode();
                
                searchTerm = searchTerm.replaceAll("\\s", "+");
                try {
                    searchTerm = URLEncoder.encode(searchTerm, "UTF-8");
                    String url = osUrl.replace("{query}", searchTerm); 
                    URL questUrl = new URL( url );
                    URLConnection con = questUrl.openConnection();
                    InputStream in = con.getInputStream();
                    XPath xpath = XPathFactory.newInstance().newXPath();
                    Document doc = Utils.getDocumentFromStream(in);
                    
                    if(doc != null){
                        NodeList items = (NodeList) xpath.evaluate( "/rss/channel/item", doc , XPathConstants.NODESET);
                        for (int i = 0; i < items.getLength(); i++) {
                            Node item = items.item( i );
                            NodeList tmp;
                            ObjectNode newEntry = mapper.createObjectNode();
                            newEntry.put( "id", "" );
                            newEntry.put( "weight", 143 );
                            ObjectNode newAttrs = mapper.createObjectNode();
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
                            jsonArray.add( newEntry );
                        }
                    }
                } catch (SAXException | ParserConfigurationException e) {
                    log.error("Error while parsing the InputStream!", e);
                } catch (IOException e) {
                    log.error("Error while performing xpath.evaluate on a document!", e);
                }
                String responseStr = jsonArray.toString();
                if (jsonArray != null) {
                    responseStr = "{\"results\":" + jsonArray + "}";
                }
                return Response.ok( responseStr ).build();
            }else if(type.equals("bwalocator")){
                ArrayNode jsonArray = mapper.createArrayNode();
                URL questUrl;
                questUrl = new URL(searchUrl.concat("&searchterm="+URLEncoder.encode(searchTerm, "UTF-8")));
                URLConnection con = questUrl.openConnection();
                InputStream in = con.getInputStream();
                String encoding = con.getContentEncoding();
                encoding = encoding == null ? "UTF-8" : encoding;
                String tmpJson = IOUtils.toString(in, encoding);
                JsonNode questJsonResult = mapper.readTree(tmpJson);
                if(!questJsonResult.isNull()){
                    ArrayNode questJson = (ArrayNode) questJsonResult.get("result");
                    
                    for (int j=0; j < questJson.size(); j++) {
                        JsonNode questJsonEntry = questJson.get(j);
                        ObjectNode newEntry = mapper.createObjectNode();
                        newEntry.put( "id", questJsonEntry.get("bwastrid").textValue());
                        ObjectNode newAttrs = mapper.createObjectNode();
                        newAttrs.put("label", questJsonEntry.get("concat_name").textValue());
                        newAttrs.put("qid", questJsonEntry.get("qid").textValue());
                        newAttrs.put("bwastrid", questJsonEntry.get("bwastrid").textValue());
                        newAttrs.put("bwastr_name", questJsonEntry.get("bwastr_name").textValue());
                        newAttrs.put("strecken_name", questJsonEntry.get("strecken_name").textValue());
                        newAttrs.put("concat_name", questJsonEntry.get("concat_name").textValue());
                        newAttrs.put("km_von", questJsonEntry.get("km_von").textValue());
                        newAttrs.put("km_bis", questJsonEntry.get("km_bis").textValue());
                        newAttrs.put("priority", questJsonEntry.get("priority").textValue());
                        newAttrs.put("fehlkilometer", questJsonEntry.get("fehlkilometer").textValue());
                        newAttrs.put("fliessrichtung", questJsonEntry.get("fliessrichtung").textValue());
                        newEntry.set( "attrs", newAttrs );
                        jsonArray.add(newEntry);
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

}
