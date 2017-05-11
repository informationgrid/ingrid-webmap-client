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

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.Properties;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;

import de.ingrid.mapclient.ConfigurationProvider;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/config")
public class ConfigResource {

    private static final Logger log = Logger.getLogger( ConfigResource.class );
    
    @GET
    @Path("setting")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.TEXT_PLAIN)
    public Response configRequest(String content, @QueryParam("filename") String filename) {
        if(filename != null && filename.length() > 0){
            if(log.isDebugEnabled()){
                log.debug( "Load file: " + filename );
            }
            
            Properties p;
            try {
                p = ConfigurationProvider.INSTANCE.getProperties();
                String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                String fileContent = null;
                if(config_dir != null){
                    fileContent = getFileContent(config_dir, filename, ".js", "config/");
                }
                
                if(fileContent == null){
                    config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR_ALTERNATIVE);
                    if(config_dir != null){
                        fileContent = getFileContent(config_dir, filename, ".js", "config/");
                    }
                }
                if(fileContent != null){
                    return Response.ok( fileContent ).build();
                }
            } catch (IOException e) {
                log.error( "Error read config directory property: " + e );
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("data")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response dataRequest(String content, @QueryParam("filename") String filename) {
        if(filename != null && filename.length() > 0){
            if(log.isDebugEnabled()){
                log.debug( "Load file: " + filename );
            }
            
            Properties p;
            try {
                p = ConfigurationProvider.INSTANCE.getProperties();
                String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                String fileContent = null;
                if(config_dir != null){
                    fileContent = getFileContent(config_dir, filename, ".json", "data/");
                }
                
                if(fileContent == null){
                    config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR_ALTERNATIVE);
                    if(config_dir != null){
                        fileContent = getFileContent(config_dir, filename, ".json", "data/");
                    }
                }
                if(fileContent != null){
                    return Response.ok( fileContent ).build();
                }
            } catch (IOException e) {
                log.error( "Error read config directory property: " + e );
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("help")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response helpRequest(@QueryParam("id") String id, @QueryParam("lang") String lang, @QueryParam("helpUrl") String helpUrl) {
        if(helpUrl != null && id != null && lang != null){
            URL url;
            try {
                url = new URL(helpUrl.replace( "{lang}", lang ));
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
            } catch (Exception e) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    private String getFileContent(String path, String filename, String fileTyp, String prefix){
        if(!path.endsWith( "/" )){
            path = path.concat( "/" );
        }
        path = path.concat( prefix );
        File directory = new File(path);
        if(directory.exists()){
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
        }
        return null;
    }
}
