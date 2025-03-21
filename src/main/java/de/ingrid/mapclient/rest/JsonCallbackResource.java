/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2025 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/software/page/eupl
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
import java.util.HashMap;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Path("/jsonCallback")
public class JsonCallbackResource {

    private static final Logger log = Logger.getLogger(JsonCallbackResource.class);

    /**
     * Path to search term
     */
    private static final String SEARCH_PATH = "query";
    private static final String SEARCHPOST_PATH = "queryPost";
    private static final String SEARCHALL_PATH = "queryAll";

    private static final ObjectMapper mapper = new ObjectMapper();

    @GET
    @Path(SEARCH_PATH)
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response search(@QueryParam("searchterm") String searchTerm, @QueryParam("json_callback") String jsonCallback, @QueryParam("url") String paramURL,
                           @QueryParam("searchID") String identifier, @QueryParam("header") String header) throws IOException {

        String urlString = paramURL;
        if(searchTerm != null) {
            searchTerm = searchTerm.trim();
            try {
                searchTerm = URLEncoder.encode(searchTerm, "UTF-8").replace("+", "%20");
            } catch (Exception e) {
                log.error("Error url encoding seach term: " + searchTerm, e);
            }
            if(identifier != null) {
                urlString = urlString.concat("&" + identifier + "=" + searchTerm);
            }
        }
        URL url = new URL(urlString);
        HttpURLConnection  con = (HttpURLConnection) url.openConnection();
        if (header != null) {
            TypeReference<HashMap<String,String>> typeRef = new TypeReference<HashMap<String,String>>() {};
            HashMap<String, String> headerMap = mapper.readValue(header, typeRef);
            for (Map.Entry<String, String> entry : headerMap.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();
                con.setRequestProperty(key, value);
            }
        }
        try {
            InputStream in = null;
            switch (con.getResponseCode()) {
                case 404:
                    in = con.getErrorStream();
                    break;
                default:
                    in = con.getInputStream();
                    break;
            }
            String encoding = con.getContentEncoding();
            encoding = encoding == null ? "UTF-8" : encoding;
            String response = IOUtils.toString(in, encoding);
            try {
                response = mapper.readTree(response).toString();
                if (jsonCallback != null && response.indexOf(jsonCallback) == -1) {
                    response = jsonCallback + "(" + response + ")";
                }
                return Response.ok(response).build();
            } catch (Exception e) {
                return Response.ok("{\"error\":true}").build();
            }
        } catch (Exception e) {
            return Response.ok("{\"error\":true}").build();
        }
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
        try {
            OutputStreamWriter writer = new OutputStreamWriter(con.getOutputStream());
            writer.write(content);
            writer.flush();
            InputStream in = null;
            switch (con.getResponseCode()) {
                case 404:
                    in = con.getErrorStream();
                    break;
                default:
                    in = con.getInputStream();
                    break;
            }
            String encoding = con.getContentEncoding();
            encoding = encoding == null ? "UTF-8" : encoding;
            String response = IOUtils.toString(in, encoding);
            try {
                response = mapper.readTree(response).toString();
                return Response.ok(response).build();
            } catch (Exception e) {
                return Response.ok("{\"error\":true}").build();
            }
        } catch (Exception e) {
            return Response.ok("{\"error\":true}").build();
        }

    }

    @GET
    @Path(SEARCHALL_PATH)
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchAll(@QueryParam("searchTerm") String searchTerm, @QueryParam("json_callback") String jsonCallback, @QueryParam("data") String data) throws JsonProcessingException {
        JsonNode obj = mapper.readTree(data);
        ArrayNode cmps = (ArrayNode) mapper.readTree(obj.get("cmp").toString());
        ArrayNode json = mapper.createArrayNode();
        for (int i = 0; i < cmps.size(); i++) {
            JsonNode cmp = cmps.get(i);
            String group = cmp.get("group").textValue();
            String url = cmp.get("url").textValue();
            String identifier = cmp.get("identifier").textValue();
            String displayPre = cmp.get("displayPre").textValue();

            URL questUrl;
            try {
                questUrl = new URL(url.concat("&" + identifier + "=" + URLEncoder.encode(searchTerm.trim())));
                URLConnection con = questUrl.openConnection();
                InputStream in = con.getInputStream();
                String encoding = con.getContentEncoding();
                encoding = encoding == null ? "UTF-8" : encoding;

                String tmpJson = IOUtils.toString(in, encoding);
                if (group.equals("nominatim")) {
                    ArrayNode questJson = (ArrayNode) mapper.readTree(tmpJson);
                    for (int j = 0; j < questJson.size(); j++) {
                        JsonNode questJsonEntry = questJson.get(j);
                        ObjectNode newEntry = mapper.createObjectNode();
                        newEntry.set("display_field", questJsonEntry.get("display_name"));
                        newEntry.set("value_field", questJsonEntry.get("boundingbox"));
                        newEntry.put("group", group);
                        newEntry.put("displayPre", displayPre);
                        newEntry.set("name", questJsonEntry.get("display_name"));
                        ArrayNode bounds = mapper.createArrayNode();
                        bounds.add(questJsonEntry.get("boundingbox").get(2));
                        bounds.add(questJsonEntry.get("boundingbox").get(0));
                        bounds.add(questJsonEntry.get("boundingbox").get(3));
                        bounds.add(questJsonEntry.get("boundingbox").get(1));
                        newEntry.set("bounds", bounds);
                        ArrayNode lonlat = mapper.createArrayNode();
                        lonlat.add(questJsonEntry.get("lon").textValue());
                        lonlat.add(questJsonEntry.get("lat").textValue());
                        newEntry.put("lonlat", lonlat);
                        json.add(newEntry);
                    }
                } else if (group.equals("portalsearch")) {
                    ArrayNode questJson = (ArrayNode) mapper.readTree(tmpJson);
                    for (int j = 0; j < questJson.size(); j++) {
                        JsonNode questJsonEntry = questJson.get(j);
                        ObjectNode newEntry = mapper.createObjectNode();
                        newEntry.set("display_field", questJsonEntry.get("name"));
                        newEntry.set("value_field", questJsonEntry.get("capabilitiesUrl"));
                        newEntry.put("group", group);
                        newEntry.put("displayPre", displayPre);
                        newEntry.set("name", questJsonEntry.get("name"));
                        newEntry.set("capabilitiesUrl", questJsonEntry.get("capabilitiesUrl"));
                        json.add(newEntry);
                    }
                } else if (group.equals("bwastrlocator")) {
                    JsonNode questJsonResult = mapper.readTree(tmpJson);
                    if (!questJsonResult.isNull()) {
                        ArrayNode questJson = (ArrayNode) questJsonResult.get("result");

                        for (int j = 0; j < questJson.size(); j++) {
                            JsonNode questJsonEntry = questJson.get(j);
                            ObjectNode newEntry = mapper.createObjectNode();
                            newEntry.set("display_field", questJsonEntry.get("concat_name"));
                            newEntry.set("value_field", questJsonEntry.get("bwastrid"));
                            newEntry.put("group", group);
                            newEntry.put("displayPre", displayPre);
                            newEntry.set("qid", questJsonEntry.get("qid"));
                            newEntry.set("bwastrid", questJsonEntry.get("bwastrid"));
                            newEntry.set("bwastr_name", questJsonEntry.get("bwastr_name"));
                            newEntry.set("strecken_name", questJsonEntry.get("strecken_name"));
                            newEntry.set("concat_name", questJsonEntry.get("concat_name"));
                            newEntry.set("km_von", questJsonEntry.get("km_von"));
                            newEntry.set("km_bis", questJsonEntry.get("km_bis"));
                            newEntry.set("priority", questJsonEntry.get("priority"));
                            newEntry.set("fehlkilometer", questJsonEntry.get("fehlkilometer"));
                            newEntry.set("fliessrichtung", questJsonEntry.get("fliessrichtung"));
                            json.add(newEntry);
                        }
                    }
                }
            } catch (Exception e) {
                log.info("Search service unreachable: " + url);
            }
        }
        String responseStr = json.toString();
        if (jsonCallback != null && responseStr.indexOf(jsonCallback) == -1) {
            responseStr = jsonCallback + "(" + json + ")";
        }
        return Response.ok(responseStr).build();
    }
}
