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
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Properties;

import javax.imageio.ImageIO;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

import com.sun.jersey.core.header.FormDataContentDisposition;
import com.sun.jersey.multipart.FormDataParam;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.utils.Utils;

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
    
    @POST
    @Path("feedback")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFeedbackRequest(@FormDataParam("email") String email, @FormDataParam("feedback") String feedback, 
            @FormDataParam("ua") String ua, @FormDataParam("permalink") String permalink, @FormDataParam("attachement") InputStream attachement, 
            @FormDataParam("attachement") FormDataContentDisposition attachementContentDisposition, @FormDataParam("kml") String kml, @FormDataParam("version") String version,
            @FormDataParam("subject") String subject) throws FileNotFoundException, IOException{
        
        String text = "";
        if(email != null){
            text += "E-Mail:\n" + email;
            text += "\n\n";
        }
        if(feedback != null){
            text += "Feedback:\n" + feedback;
            text += "\n\n";
        }
        if(ua != null){
            text += "User-Interface:\n" + ua;
            text += "\n\n";
        }
        if(permalink != null){
            text += "Permalink:\n" + permalink;
            text += "\n\n";
        }
        if(kml != null){
            text += "KML:\n" + kml;
            text += "\n\n";
        }
        if(version != null){
            text += "Version:\n" + version;
            text += "\n\n";
        }
        
        File file = null;
        if(attachement != null){
            if(attachementContentDisposition != null){
                if(attachementContentDisposition.getFileName() != null){
                    file = new File(attachementContentDisposition.getFileName());
                    try {
                        OutputStream out = new FileOutputStream(file);
                        byte[] buf = new byte[1024];
                        int len;
                        while((len=attachement.read(buf))>0){
                            out.write(buf,0,len);
                        }
                        out.close();
                        attachement.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String from = p.getProperty( ConfigurationProvider.FEEDBACK_FROM );
        if(email != null && email.length() > 0){
            from = email;
        }
        String to = p.getProperty( ConfigurationProvider.FEEDBACK_TO ); 
        String host = p.getProperty( ConfigurationProvider.FEEDBACK_HOST );
        String port = p.getProperty( ConfigurationProvider.FEEDBACK_PORT );
        String user = p.getProperty( ConfigurationProvider.FEEDBACK_USER );
        String password = p.getProperty( ConfigurationProvider.FEEDBACK_PASSWORD );
        boolean ssl = new Boolean (p.getProperty( ConfigurationProvider.FEEDBACK_SSL ));
        String protocol = p.getProperty( ConfigurationProvider.FEEDBACK_PROTOCOL );
        
        boolean sendMail = Utils.sendEmail( from, subject, new String[] { to }, text, null, host, port, user, password, ssl, protocol, file );
        if(sendMail == false){
            return Response.ok( "{\"success\": true}" ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
}