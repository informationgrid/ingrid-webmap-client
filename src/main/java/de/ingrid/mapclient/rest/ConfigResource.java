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
package de.ingrid.mapclient.rest;

import java.util.Properties;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.scheduler.tasks.CapabilitiesUpdateTask;
import de.ingrid.mapclient.utils.Utils;

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
            
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            String fileContent = null;
            if(config_dir != null){
                fileContent = Utils.getFileContent(config_dir, filename, ".js", "config/");
            }
            
            if(fileContent != null){
                return Response.ok( fileContent ).build();
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
            
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            String fileContent = null;
            if(config_dir != null){
                fileContent = Utils.getFileContent(config_dir, filename, ".json", "data/");
            }
            
            if(fileContent != null){
                return Response.ok( fileContent ).build();
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("layerupdate")
    @Produces(MediaType.APPLICATION_JSON)
    public Response layerUpdateRequest() {
        CapabilitiesUpdateTask cut = new CapabilitiesUpdateTask();
        cut.run();
        return Response.status(Response.Status.OK ).build();
    }
}
