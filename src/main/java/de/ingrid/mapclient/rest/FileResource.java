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
/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;

import javax.imageio.ImageIO;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/data")
public class FileResource {

    private static final Logger log = Logger.getLogger( FileResource.class );
    private static final String path = "./data/";
    
    @POST
    @Path("files")
    @Produces(MediaType.TEXT_PLAIN)
    public Response fileRequest(String content) {
        if (content != null && content.length() > 0) {
            String filename = path + "" + content.hashCode();
            File file = new File( filename + "" );
            try {
                FileWriter fileWriter = new FileWriter( file );
                fileWriter.write( content );
                fileWriter.flush();
                fileWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        String json = "{\"adminId\":" + content.hashCode() + ", \"fileId\":" + content.hashCode() + "}";
        return Response.ok( json ).build();
    }

    @POST
    @Path("files/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response updateFileRequest(@PathParam("id") String id, String content) {
        if (id != null && id.length() > 0) {
            String filename = path + "" + id;
            File file = new File( filename + "" );
            try {
                FileWriter fileWriter = new FileWriter( file );
                fileWriter.write( content );
                fileWriter.flush();
                fileWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        String json = "{\"adminId\":" + id + ", \"fileId\":" + id + "}";
        return Response.ok( json ).build();
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public String getFileRequest(@PathParam("id") String id) {
        String content = null;
        if (id != null && id.length() > 0) {
            try {
                content = new String( Files.readAllBytes( Paths.get( path + "" + id ) ) );
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return content;
    }
    
    @GET
    @Path("images")
    @Produces("image/png")
    public Response getFileImageRequest(@QueryParam("url") String url){
        if (url != null && url.length() > 0) {
            URL tmpUrl;
            try {
                tmpUrl = new URL(url);
                BufferedImage image = ImageIO.read(tmpUrl);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(image, "png", baos);
                byte[] imageData = baos.toByteArray();
                return Response.ok(new ByteArrayInputStream(imageData)).build();
            } catch (MalformedURLException e) {
                return Response.status(Response.Status.NOT_FOUND ).build();
            } catch (IOException e) {
                return Response.status(Response.Status.OK ).build();
            }
        }
        return Response.status(Response.Status.OK ).build();
    }
}