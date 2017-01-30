/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2017 wemove digital solutions GmbH
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
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

@Path("/jsonCallback")
public class JsonCallbackResource {

    private static final Logger log = Logger.getLogger( JsonCallbackResource.class );

    /**
     * Path to search term
     */
    private static final String SEARCH_PATH = "query";
    private static final String SEARCHPOST_PATH = "queryPost";
    private static final String SEARCHALL_PATH = "queryAll";

    @GET
    @Path(SEARCH_PATH)
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response search(@QueryParam("searchterm") String searchTerm, @QueryParam("json_callback") String jsonCallback, @QueryParam("url") String paramURL,
            @QueryParam("searchID") String identifier) throws IOException {

        searchTerm = searchTerm.trim();
        try {
            searchTerm = URLEncoder.encode( searchTerm, "UTF-8" ).replace( "+", "%20" );
        } catch (Exception e) {
            log.error( "Error url encoding seach term: " + searchTerm, e );
        }

        URL url = new URL( paramURL.concat( "&" + identifier + "=" + searchTerm ) );
        URLConnection con = url.openConnection();
        InputStream in = con.getInputStream();
        String encoding = con.getContentEncoding();
        encoding = encoding == null ? "UTF-8" : encoding;

        String json = IOUtils.toString( in, encoding );
        if (jsonCallback != null) {
            if (json.indexOf( jsonCallback ) < 0) {
                json = jsonCallback + "(" + json + ")";
            }
        }
        return Response.ok( json ).build();

    }

    @GET
    @Path(SEARCHPOST_PATH)
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchPost(@QueryParam("data") String data, @QueryParam("url") String paramURL) throws IOException {

        String content = data.trim();
        
        URL url = new URL(paramURL);
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setDoInput(true);
        con.setDoOutput(true);
        con.setRequestProperty("Content-Type", MediaType.APPLICATION_JSON);
        con.setRequestProperty("Content-Length", String.valueOf(content.length()));
        
        OutputStreamWriter writer = new OutputStreamWriter( con.getOutputStream() );
        writer.write(content);
        writer.flush();
        
        InputStream in = con.getInputStream();
        String encoding = con.getContentEncoding();
        encoding = encoding == null ? "UTF-8" : encoding;
        
        String json = IOUtils.toString(in, encoding);
        return Response.ok(json).build();

    }

    @GET
    @Path(SEARCHALL_PATH)
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchAll(@QueryParam("searchTerm") String searchTerm, @QueryParam("json_callback") String jsonCallback, @QueryParam("data") String data) throws JSONException {
        JSONObject obj = new JSONObject( data );
        JSONArray cmps = new JSONArray( obj.get( "cmp" ).toString() );
        JSONArray json = new JSONArray();
        for (int i = 0; i < cmps.length(); i++) {
            JSONObject cmp = cmps.getJSONObject( i );
            String group = cmp.getString( "group" );
            String url = cmp.getString( "url" );
            String identifier = cmp.getString( "identifier" );
            String displayPre = cmp.getString( "displayPre" );

            URL questUrl;
            try {
                questUrl = new URL( url.concat( "&" + identifier + "=" + URLEncoder.encode( searchTerm.trim() ) ) );
                URLConnection con = questUrl.openConnection();
                InputStream in = con.getInputStream();
                String encoding = con.getContentEncoding();
                encoding = encoding == null ? "UTF-8" : encoding;

                String tmpJson = IOUtils.toString( in, encoding );
                if (group.equals( "nominatim" )) {
                    JSONArray questJson = new JSONArray( tmpJson );
                    for (int j = 0; j < questJson.length(); j++) {
                        JSONObject questJsonEntry = questJson.getJSONObject( j );
                        JSONObject newEntry = new JSONObject();
                        newEntry.put( "display_field", questJsonEntry.getString( "display_name" ) );
                        newEntry.put( "value_field", questJsonEntry.getJSONArray( "boundingbox" ) );
                        newEntry.put( "group", group );
                        newEntry.put( "displayPre", displayPre );
                        newEntry.put( "name", questJsonEntry.getString( "display_name" ) );
                        JSONArray bounds = new JSONArray();
                        bounds.put( questJsonEntry.getJSONArray( "boundingbox" ).get( 2 ) );
                        bounds.put( questJsonEntry.getJSONArray( "boundingbox" ).get( 0 ) );
                        bounds.put( questJsonEntry.getJSONArray( "boundingbox" ).get( 3 ) );
                        bounds.put( questJsonEntry.getJSONArray( "boundingbox" ).get( 1 ) );
                        newEntry.put( "bounds", bounds );
                        JSONArray lonlat = new JSONArray();
                        lonlat.put( questJsonEntry.getString( "lon" ) );
                        lonlat.put( questJsonEntry.getString( "lat" ) );
                        newEntry.put( "lonlat", lonlat );
                        json.put( newEntry );
                    }
                } else if (group.equals( "portalsearch" )) {
                    JSONArray questJson = new JSONArray( tmpJson );
                    for (int j = 0; j < questJson.length(); j++) {
                        JSONObject questJsonEntry = questJson.getJSONObject( j );
                        JSONObject newEntry = new JSONObject();
                        newEntry.put( "display_field", questJsonEntry.getString( "name" ) );
                        newEntry.put( "value_field", questJsonEntry.getString( "capabilitiesUrl" ) );
                        newEntry.put( "group", group );
                        newEntry.put( "displayPre", displayPre );
                        newEntry.put( "name", questJsonEntry.getString( "name" ) );
                        newEntry.put( "capabilitiesUrl", questJsonEntry.getString( "capabilitiesUrl" ) );
                        json.put( newEntry );
                    }
                } else if (group.equals( "bwastrlocator" )) {
                    JSONObject questJsonResult = new JSONObject( tmpJson );
                    if (questJsonResult != JSONObject.NULL) {
                        JSONArray questJson = questJsonResult.getJSONArray( "result" );

                        for (int j = 0; j < questJson.length(); j++) {
                            JSONObject questJsonEntry = questJson.getJSONObject( j );
                            JSONObject newEntry = new JSONObject();
                            newEntry.put( "display_field", questJsonEntry.getString( "concat_name" ) );
                            newEntry.put( "value_field", questJsonEntry.getString( "bwastrid" ) );
                            newEntry.put( "group", group );
                            newEntry.put( "displayPre", displayPre );
                            newEntry.put( "qid", questJsonEntry.getString( "qid" ) );
                            newEntry.put( "bwastrid", questJsonEntry.getString( "bwastrid" ) );
                            newEntry.put( "bwastr_name", questJsonEntry.getString( "bwastr_name" ) );
                            newEntry.put( "strecken_name", questJsonEntry.getString( "strecken_name" ) );
                            newEntry.put( "concat_name", questJsonEntry.getString( "concat_name" ) );
                            newEntry.put( "km_von", questJsonEntry.getString( "km_von" ) );
                            newEntry.put( "km_bis", questJsonEntry.getString( "km_bis" ) );
                            newEntry.put( "priority", questJsonEntry.getString( "priority" ) );
                            newEntry.put( "fehlkilometer", questJsonEntry.getString( "fehlkilometer" ) );
                            newEntry.put( "fliessrichtung", questJsonEntry.getString( "fliessrichtung" ) );
                            json.put( newEntry );
                        }
                    }
                }
            } catch (Exception e) {
                log.info( "Search service unreachable: " + url );
                continue;
            }
        }
        String responseStr = json.toString();
        if (jsonCallback != null) {
            if (responseStr.indexOf( jsonCallback ) < 0) {
                responseStr = jsonCallback + "(" + json + ")";
            }
        }
        return Response.ok( responseStr ).build();
    }

    @GET
    @Path("help")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response help(@QueryParam("lang") String lang, @QueryParam("id") String id, @QueryParam("helpUrl") String helpUrl) throws IOException, JSONException {

        URL url = new URL(helpUrl.replace( "{lang}", lang ));
        URLConnection con = url.openConnection();
        InputStream in = con.getInputStream();
        String encoding = con.getContentEncoding();
        encoding = encoding == null ? "UTF-8" : encoding;

        String tmpJson = IOUtils.toString( in, encoding );
        JSONObject jsonObj = new JSONObject();
        JSONObject questJsonResult = new JSONObject( tmpJson );
        if(questJsonResult != null){
            JSONObject jsonObjId = (JSONObject) questJsonResult.get(id);
            if(jsonObjId != null){
                String title = jsonObjId.getString( "title" );
                String text = jsonObjId.getString( "text" );
                String image = jsonObjId.getString( "image" );
                
                JSONArray jsonRowObj = new JSONArray();
                jsonRowObj.put(id);
                jsonRowObj.put(title);
                jsonRowObj.put(text);
                jsonRowObj.put("");
                jsonRowObj.put(image);
                
                JSONArray jsonRow = new JSONArray();
                jsonRow.put( jsonRowObj );
                jsonObj.put( "rows", jsonRow );
            }
        }
        return Response.ok( jsonObj ).build();
    }
}
