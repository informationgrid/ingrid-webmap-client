/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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

import java.awt.Color;
import java.awt.Graphics2D;
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
import java.util.Date;
import java.util.EnumMap;
import java.util.Map;
import java.util.Properties;

import javax.imageio.ImageIO;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
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
    
    @POST
    @Path("files")
    @Produces(MediaType.TEXT_PLAIN)
    public Response fileRequest(String content, @QueryParam("adminId") String mapUserId, @QueryParam("maxDaysOfDeleteFile") String maxDaysOfDeleteFile) {
        String fileId = createKMLFile( content, mapUserId);
        if(fileId != null && fileId.length() > 0){
            String adminId = "";
            if(mapUserId != null){
                adminId += mapUserId + "/";
            }
            adminId += fileId;
           
            String json = "{\"adminId\":\"" + adminId + "\", \"fileId\":\"" + adminId + "\"}";
            return Response.ok( json ).build();
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @POST
    @Path("files/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response updateFileRequest(@PathParam("id") String id, String content, @QueryParam("adminId") String mapUserId) throws IOException {
        String fileId = id;
        // New file
        fileId = createKMLFile( content, mapUserId);

        if(fileId != null && fileId.length() > 0){
            String adminId = "";
            if(mapUserId != null){
                adminId += mapUserId + "/";
            }
            adminId += fileId;
           
            String json = "{\"adminId\":\"" + adminId + "\", \"fileId\":\"" + adminId + "\"}";
            return Response.ok( json ).build();
        }

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @POST
    @Path("files/{user}/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response updateFileRequest(@PathParam("id") String id, @PathParam("user") String user, String content, @QueryParam("adminId") String mapUserId) throws IOException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./data/" ).trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }
        
        String fileId = id;
        if(mapUserId != null && mapUserId.length() > 0){
            String filename = path + "" + mapUserId + "/" + fileId;
            if (fileId != null && fileId.length() > 0) {
                if(mapUserId.equals(user)){
                    // Update file
                    File file = new File( filename );
                    try {
                        FileWriter fileWriter = new FileWriter( file );
                        fileWriter.write( content );
                        fileWriter.flush();
                        fileWriter.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }else{
                    // New file
                    fileId = createKMLFile( content, mapUserId);
                }
            }
        }else{
            // New file
            fileId = createKMLFile( content, mapUserId);
        }
        if(fileId != null && fileId.length() > 0){
            String adminId = "";
            if(mapUserId != null){
                adminId += mapUserId + "/";
            }
            adminId += fileId;
            
            String json = "{\"adminId\":\"" + adminId + "\", \"fileId\":\"" + adminId + "\"}";
            return Response.ok( json ).build();
        }

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @DELETE
    @Path("files/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response deleteFileRequest(@PathParam("id") String id, @QueryParam("adminId") String mapUserId) throws IOException {
        return Response.status(Response.Status.NOT_MODIFIED ).build();
    }
    
    @DELETE
    @Path("files/{user}/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response deleteFileRequest(@PathParam("id") String id, @PathParam("user") String user, @QueryParam("adminId") String mapUserId) throws IOException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./data/" ).trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }
        
        String fileId = id;
        if(mapUserId != null && mapUserId.length() > 0){
            String filename = path + "" + mapUserId + "/" + fileId;
            if (fileId != null && fileId.length() > 0) {
                if(mapUserId.equals(user)){
                    // Update file
                    File file = new File( filename );
                    if(file.exists()){
                        file.delete();
                        return Response.status(Response.Status.OK ).build();
                    }
                }else{
                    return Response.status(Response.Status.NOT_MODIFIED ).build();
                }
            }
        }
        return Response.status(Response.Status.NOT_MODIFIED ).build();
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public String getFileRequest(@PathParam("id") String id, @QueryParam("adminId") String mapUserId) throws IOException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./data/").trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }
        
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
    @Path("{user}/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public String getFileRequest(@PathParam("id") String id, @PathParam("user") String user, @QueryParam("adminId") String mapUserId) throws IOException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./data/").trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }
        
        String content = null;
        if (id != null && id.length() > 0) {
            try {
                content = new String( Files.readAllBytes( Paths.get( path + "" + user + "/" + id ) ) );
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
    
    @GET
    @Path("qrcodegenerator")
    @Produces("image/png")
    public Response getQRCodeRequest(@QueryParam("url") String url){
        try {
            Map<EncodeHintType, Object> hintMap = new EnumMap<EncodeHintType, Object>(EncodeHintType.class);
            hintMap.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            
            // Now with zxing version 3.2.1 you could change border size (white border size to just 1)
            hintMap.put(EncodeHintType.MARGIN, 1); /* default = 4 */
            hintMap.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.L);
    
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix byteMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, 250,
                    250, hintMap);
            int CrunchifyWidth = byteMatrix.getWidth();
            BufferedImage image = new BufferedImage(CrunchifyWidth, CrunchifyWidth,
                    BufferedImage.TYPE_INT_RGB);
            image.createGraphics();
    
            Graphics2D graphics = (Graphics2D) image.getGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, CrunchifyWidth, CrunchifyWidth);
            graphics.setColor(Color.BLACK);
    
            for (int i = 0; i < CrunchifyWidth; i++) {
                for (int j = 0; j < CrunchifyWidth; j++) {
                    if (byteMatrix.get(i, j)) {
                        graphics.fillRect(i, j, 1, 1);
                    }
                }
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            byte[] imageData = baos.toByteArray();
            return Response.ok(new ByteArrayInputStream(imageData)).build();
        } catch(WriterException e){
            
        } catch (IOException e) {
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
        if(email != null && email.length() > 0){
            text += "E-Mail:\n" + email;
            text += "\n\n";
        }
        if(feedback != null && feedback.length() > 0){
            text += "Feedback:\n" + feedback;
            text += "\n\n";
        }
        if(ua != null && ua.length() > 0){
            text += "User-Interface:\n" + ua;
            text += "\n\n";
        }
        if(permalink != null && permalink.length() > 0){
            text += "Permalink:\n" + permalink;
            text += "\n\n";
        }
        if(kml != null && kml.length() > 0){
            text += "KML:\n" + kml;
            text += "\n\n";
        }
        if(version != null && version.length() > 0){
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
        if(sendMail){
            return Response.ok( "{\"success\": true}" ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    private String createKMLFile(String content, String mapUserId){
        String filename = "";
        String fileId = "";
        String path = "";
        
        Properties p;
        try {
            p = ConfigurationProvider.INSTANCE.getProperties();
            int maxDaysOfFileExist = Integer.parseInt(p.getProperty( ConfigurationProvider.KML_MAX_DAYS_FILE_EXIST, "365"));
            int maxDirectoryFiles = Integer.parseInt(p.getProperty( ConfigurationProvider.KML_MAX_DIRECTORY_FILES, "1000"));
            path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./data/").trim();
            
            if(!path.endsWith( "/")){
                path += "/";
            }
            
            filename += path;
            
            File pathFolder = new File(path);
            if(!pathFolder.exists()){
                pathFolder.mkdir();
            }
            
            if(mapUserId != null && mapUserId.length() > 0){
                File userFolder = new File( path + mapUserId);
                if(!userFolder.exists()){
                    userFolder.mkdir();
                }
                filename += mapUserId + "/";
            }
            
            File folder = new File(filename);
            File[] listOfFiles = folder.listFiles();
            if(listOfFiles.length > maxDirectoryFiles){
                for (File file : listOfFiles) {
                    if (file.isFile()) {
                        long diff = new Date().getTime() - file.lastModified();
                        if (diff > maxDaysOfFileExist * 24 * 60 * 60 * 1000) {
                            file.delete();
                        }
                    }
                }
            }
        } catch (IOException e) {
            log.error( "Count files in directory " + path +" failed: " + e);
        }
        
        if (content != null && content.length() > 0) {
            fileId += content.hashCode();
            filename += fileId;
            File file = new File( filename);
            try {
                FileWriter fileWriter = new FileWriter( file );
                fileWriter.write( content );
                fileWriter.flush();
                fileWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
       return fileId;
    }
}