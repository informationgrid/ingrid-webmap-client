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

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.EnumMap;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.springframework.web.bind.annotation.RequestBody;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.sun.jersey.core.header.FormDataContentDisposition;
import com.sun.jersey.multipart.FormDataParam;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.HttpProxy;
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
    public Response fileRequest(String content, @QueryParam("adminId") String mapUserId, @QueryParam("maxDaysOfDeleteFile") String maxDaysOfDeleteFile) throws IOException {
        String id = createKMLFile( content, mapUserId);
        if(id != null && id.length() > 0){
            String adminId = "";
            if(mapUserId != null){
                adminId += mapUserId + "/";
            }
            adminId += id;
           
            String json = "{\"adminId\":\"" + adminId + "\", \"fileId\":\"" + adminId + "\"}";
            return Response.ok( json ).build();
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @POST
    @Path("files/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response updateFileRequest(@PathParam("id") String id, String content, @QueryParam("adminId") String mapUserId) throws IOException {
        // New file
        String fileId = createKMLFile( content, mapUserId);
        if(StringUtils.isNotEmpty(fileId)){
            String adminId = "";
            if(StringUtils.isNotEmpty(mapUserId)){
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
        String path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./kml/" ).trim();
        String fileId = id;
        if(!path.endsWith( "/")){
            path += "/";
        }
        
        if(mapUserId != null && mapUserId.length() > 0){
            String filepath = path + "" + mapUserId;
            if (fileId != null && fileId.length() > 0) {
                if(mapUserId.equals(user)){
                    // Update file
                    File file = new File( filepath, fileId );
                    Utils.writeFileContent(file, content);
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
    public Response deleteFileRequest(@PathParam("id") String id, @QueryParam("adminId") String mapUserId) {
        return Response.status(Response.Status.NOT_MODIFIED ).build();
    }
    
    @DELETE
    @Path("files/{user}/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response deleteFileRequest(@PathParam("id") String id, @PathParam("user") String user, @QueryParam("adminId") String mapUserId) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./kml/" ).trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }
        
        if(mapUserId != null && mapUserId.length() > 0){
            String filePath = path + "" + mapUserId;
            if (id != null && id.length() > 0) {
                if(mapUserId.equals(user)){
                    // Update file
                    File file = new File( filePath, id );
                    if(file.exists()){
                        if(file.delete()) {
                            log.debug("Delete file: " + file.getName());
                        }
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
        String path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./kml/").trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }
        
        String content = null;
        if (id != null && id.length() > 0) {
            path += "" + id;
            try {
                content = new String( Files.readAllBytes( Paths.get( path ) ) );
                File file = new File( path );
                Utils.writeFileContent(file, content);
            } catch (IOException e) {
                log.error("Error getFileRequest: " + e);
            }
        }
        return content;
    }
    
    @GET
    @Path("{user}/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public String getFileRequest(@PathParam("id") String id, @PathParam("user") String user, @QueryParam("adminId") String mapUserId) throws IOException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./kml/").trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }
        
        String content = null;
        if (id != null && id.length() > 0) {
            try {
                content = new String( Files.readAllBytes( Paths.get( path + "" + user + "/" + id ) ) );
            } catch (IOException e) {
                try {
                    // Try to get kml from portal tmp kml service folder.
                    content = new String( Files.readAllBytes( Paths.get( "./data/" + user + "/" + id ) ) );
                } catch (IOException e1) {
                    log.error("Error getFileRequest: " + e);
                }
            }
        }
        return content;
    }

    @GET
    @Path("images")
    @Produces("image/png")
    public Response getFileImageRequest(@QueryParam("url") String url, @QueryParam("login") String login, @QueryParam("blankImage") boolean getBlankImageOnError){
        if (url != null && url.length() > 0) {
            try {
                URL tmpUrl = new URL( url );
                URLConnection conn = tmpUrl.openConnection();
                if(StringUtils.isNotEmpty(login)) {
                    String password = Utils.getServiceLogin( url, login);
                    if(StringUtils.isNotEmpty(password)) {
                        Utils.urlConnectionAuth(conn, login, password);
                    }
                }
                if (conn != null) {
                    BufferedImage image = ImageIO.read(conn.getInputStream());
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    if(image == null && getBlankImageOnError) {
                        String classPath = "";
                        classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
                        String imgPath = classPath + "frontend/src/img";
                        File blankImage = new File(imgPath + "/blank_image.png");
                        if(blankImage.exists()){
                            image = ImageIO.read(blankImage);
                        }
                    }
                    ImageIO.write(image, "png", baos);
                    byte[] imageData = baos.toByteArray();
                    return Response.ok(new ByteArrayInputStream(imageData)).build();
                }
            } catch (MalformedURLException e) {
                return Response.status(Response.Status.NOT_FOUND ).build();
            } catch (IOException e) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
            } catch (JSONException e) {
                log.error("Error get JSON auth: " + login);
            } catch (Exception e) {
                log.error("Error getMap for: " + url);
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @GET
    @Path("qrcodegenerator")
    @Produces("image/png")
    public Response getQRCodeRequest(@QueryParam("url") String url){
        try {
            Map<EncodeHintType, Object> hintMap = new EnumMap<>(EncodeHintType.class);
            hintMap.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            
            // Now with zxing version 3.2.1 you could change border size (white border size to just 1)
            hintMap.put(EncodeHintType.MARGIN, 1); /* default = 4 */
            hintMap.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.L);
    
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix byteMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, 250,
                    250, hintMap);
            int crunchifyWidth = byteMatrix.getWidth();
            BufferedImage image = new BufferedImage(crunchifyWidth, crunchifyWidth,
                    BufferedImage.TYPE_INT_RGB);
            image.createGraphics();
    
            Graphics2D graphics = (Graphics2D) image.getGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, crunchifyWidth, crunchifyWidth);
            graphics.setColor(Color.BLACK);
    
            for (int i = 0; i < crunchifyWidth; i++) {
                for (int j = 0; j < crunchifyWidth; j++) {
                    if (byteMatrix.get(i, j)) {
                        graphics.fillRect(i, j, 1, 1);
                    }
                }
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            byte[] imageData = baos.toByteArray();
            return Response.ok(new ByteArrayInputStream(imageData)).build();
        } catch(WriterException | IOException e){
            Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    
    @POST
    @Path("feedback")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFeedbackRequest(@FormDataParam("email") String email, @FormDataParam("feedback") String feedback, 
            @FormDataParam("ua") String ua, @FormDataParam("permalink") String permalink, @FormDataParam("attachement") InputStream attachement, 
            @FormDataParam("attachement") FormDataContentDisposition attachementContentDisposition, @FormDataParam("kml") String kml, @FormDataParam("version") String version,
            @FormDataParam("subject") String subject, @FormDataParam("shortURLService") String shortURLService) throws IOException{
        
        String text = "";
        URL permalinkUrl = null;
        if(email != null && !email.isEmpty()){
            text += "E-Mail:\n" + email;
            text += "\n\n";
        }
        if(feedback != null && !feedback.isEmpty()){
            text += "Feedback:\n" + feedback;
            text += "\n\n";
        }
        if(ua != null && !ua.isEmpty()){
            text += "User-Interface:\n" + ua;
            text += "\n\n";
        }

        String layersParam = "";
        String layersParamValue = "";
        String layersParamContent = "";
        boolean hasLayersParam = false;
        
        // Get existing layers params
        if(permalink != null && !permalink.isEmpty()){
            permalinkUrl = new URL(permalink);
            Pattern pattern = Pattern.compile("layers=([^&]+)");
            Matcher matcher = pattern.matcher(permalink);
            if(matcher.find()) {
                hasLayersParam = true;
                layersParam = matcher.group();
                String[] keyValue = layersParam.split("layers=");
                if(keyValue.length > 1) {
                    String layersParamUrlContent = getHost(permalinkUrl);
                    layersParamValue = keyValue[1];
                    layersParamUrlContent += "/ingrid-webmap-client/rest/data/short?key=layers&value=" + layersParamValue;
                    try {
                        layersParamContent = HttpProxy.doRequest(layersParamUrlContent);
                    } catch (Exception e) {
                        log.error("Error get layers param content: " + e);
                    }
                }
            }
        }

        // Get attachment file
        File file = null;
        if(attachement != null && attachementContentDisposition != null && attachementContentDisposition.getFileName() != null){
            file = new File(attachementContentDisposition.getFileName());
            try (
                OutputStream out = new FileOutputStream(file);
            ){
                byte[] buf = new byte[1024];
                int len;
                while((len=attachement.read(buf))>0){
                    out.write(buf,0,len);
                }
            } catch (Exception e) {
                log.error("Error getFeedbackRequest: " + e);
            } finally {
                if(attachement != null) {
                    attachement.close();
                }
            }
        }

        // Copy KML attachment and set to permalink 
        if(file != null && file.getName().endsWith(".kml")) {
            if(permalink != null && !permalink.isEmpty()){
                String kmlFileContent = Utils.readFileAsString(file);
                if(kmlFileContent != null) {
                    String id = createKMLFile( kmlFileContent, null);
                    if(!layersParamContent.isEmpty()) {
                        layersParamContent += ",";
                    } 
                    layersParamContent += "KML||";
                    layersParamContent += getHost(permalinkUrl);
                    layersParamContent += "/ingrid-webmap-client/rest/data/" + id;
                }
            }
        }

        // Create kml draw file
        if(kml != null && !kml.isEmpty()){
            if(permalink != null && !permalink.isEmpty()) {
                String id = createKMLFile( kml, null);
                if(!layersParamContent.isEmpty()) {
                    layersParamContent += ",";
                } 
                layersParamContent += "KML||";
                layersParamContent += getHost(permalinkUrl);
                layersParamContent += "/ingrid-webmap-client/rest/data/" + id;
            }
        }

        // Create permalink
        if(permalink != null && !permalink.isEmpty()){
            if(!layersParamContent.isEmpty()) {
                String newLayersValue = createShortFile("layers", layersParamContent.replace("\n", ""));
                if(hasLayersParam) {
                    if(!layersParamValue.isEmpty()) {
                        permalink = permalink.replace(layersParamValue, newLayersValue);
                        permalink = permalink.replace("&&", "&");
                    }
                } else {
                    if(permalink.indexOf('?') == -1) {
                        permalink += "?";
                    } else {
                        if(!permalink.endsWith("&")) {
                            permalink += "&";
                        }
                    }
                    permalink += "layers=" + newLayersValue;
                }
            }
            if(shortURLService != null && !shortURLService.isEmpty()) {
                if(shortURLService.indexOf('?') == -1) {
                    shortURLService += "?url=" + URLEncoder.encode(permalink);
                } else {
                    shortURLService += "&url=" + URLEncoder.encode(permalink);
                }
                try {
                    String shortenUrlContent = HttpProxy.doRequest(shortURLService);
                    if(shortenUrlContent != null) {
                        JSONObject shortenURLJSON = new JSONObject(shortenUrlContent);
                        if(shortenURLJSON.has("shorturl")) {
                            permalink = shortenURLJSON.getString("shorturl");
                        }
                    }
                } catch (Exception e) {
                    log.error("Error shorten URL: " + e);
                }
            }
            text += "Permalink:\n" + permalink;
            text += "\n\n";
        }

        /*
        if(kml != null && !kml.isEmpty()){
            text += "KML:\n" + kml;
            text += "\n\n";
        }
        */
        if(version != null && !version.isEmpty()){
            text += "Version:\n" + version;
            text += "\n\n";
        }

        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String from = p.getProperty( ConfigurationProvider.FEEDBACK_FROM );
        String[] replyTo = null;
        if(email != null && email.length() > 0 && !email.equals( "undefined" )){
            replyTo = new String[] { email };
        }
        String to = p.getProperty( ConfigurationProvider.FEEDBACK_TO ); 
        String host = p.getProperty( ConfigurationProvider.FEEDBACK_HOST );
        String port = p.getProperty( ConfigurationProvider.FEEDBACK_PORT );
        String user = p.getProperty( ConfigurationProvider.FEEDBACK_USER );
        String password = p.getProperty( ConfigurationProvider.FEEDBACK_PW );
        boolean ssl = Boolean.parseBoolean(p.getProperty( ConfigurationProvider.FEEDBACK_SSL ));
        String protocol = p.getProperty( ConfigurationProvider.FEEDBACK_PROTOCOL );

        boolean sendMail = Utils.sendEmail( from, subject, new String[] { to }, text, null, host, port, user, password, ssl, protocol, file, replyTo);
        if(sendMail){
            return Response.ok( "{\"success\": true}" ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    private String getHost(URL permalinkUrl) {
        String host = permalinkUrl.getProtocol() + "://";
        host += permalinkUrl.getHost();
        if(permalinkUrl.getPort() > -1) {
            host += ":" + permalinkUrl.getPort();
        }
        return host;
    }

    @GET
    @Path("color/{color}/{icon}")
    @Produces("image/png")
    public Response getImageRequest(@PathParam("color") String color, @PathParam("icon") String icon) throws IOException{
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.CONFIG_DIR, "./kml/" ).trim();
        String apiGeo = p.getProperty( ConfigurationProvider.API_URL, "https://api3.geo.admin.ch" ).trim();
        
        if(!path.endsWith( "/" )){
           path = path.concat( "/" ); 
        }
        File imageDir = new File(path + "img");
        if(!imageDir.exists()){
            imageDir.mkdirs();
        }
        path = imageDir.getAbsolutePath();
        if(!path.endsWith( "/" )){
            path = path.concat( "/" ); 
         }
        File colorsDir = new File(path + "maki");
        if(!colorsDir.exists()){
            colorsDir.mkdirs();
        }
        path = colorsDir.getAbsolutePath();
        if(!path.endsWith( "/" )){
            path = path.concat( "/" ); 
        }
        File colorDir = new File(path + color);
        if(!colorDir.exists()){
            colorDir.mkdirs();
        }
        path = colorDir.getAbsolutePath();
        if(!path.endsWith( "/" )){
            path = path.concat( "/" ); 
        }
        File imageFile = new File(path + icon);
        if(imageFile.exists()){
            return Response.ok(imageFile).build();
        }else{
            if(color != null && icon != null){
                String url = apiGeo + "/color/" + color + "/" + icon;
                if (url != null && url.length() > 0) {
                    URL tmpUrl;
                    try {
                        tmpUrl = new URL(url);
                        BufferedImage image = ImageIO.read(tmpUrl);
                        ImageIO.write(image, "png", imageFile);
                        return Response.ok(imageFile).build();
                    } catch (MalformedURLException e) {
                        log.error( e );
                        return Response.status(Response.Status.NOT_FOUND ).build();
                    } catch (IOException e) {
                        log.error( e );
                        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
                    }
                }
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @GET
    @Path("images/{category}/{icon}")
    @Produces("image/png")
    public Response getImageCategoryRequest(@PathParam("category") String category, @PathParam("icon") String icon) throws IOException{
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.CONFIG_DIR, "./kml/" ).trim();
        String apiGeo = p.getProperty( ConfigurationProvider.API_URL, "https://api3.geo.admin.ch" ).trim();
        
        if(!path.endsWith( "/" )){
           path = path.concat( "/" ); 
        }
        File imageDir = new File(path + "img");
        if(!imageDir.exists()){
            imageDir.mkdirs();
        }
        path = imageDir.getAbsolutePath();
        if(!path.endsWith( "/" )){
            path = path.concat( "/" ); 
         }
        File categoryDir = new File(path + category);
        if(!categoryDir.exists()){
            categoryDir.mkdirs();
        }
        path = categoryDir.getAbsolutePath();
        if(!path.endsWith( "/" )){
            path = path.concat( "/" ); 
        }
        File imageFile = new File(path + icon);
        if(imageFile.exists()){
            return Response.ok(imageFile).build();
        }else{
            if(icon != null){
                if(icon.indexOf('.') == -1 && (category.equals("category") || category.equals("background"))) {
                    File imageSubDir = new File(path);
                    File[] files = imageSubDir.listFiles();
                    for(File file:files) {
                        if(file.getName().startsWith(icon +".")){
                            return Response.ok(file).build();
                        }
                    }
                } else {
                    String url = apiGeo + "/images/" + category + "/" + icon;
                    if (!url.isEmpty()) {
                        URL tmpUrl;
                        try {
                            tmpUrl = new URL(url);
                            BufferedImage image = ImageIO.read(tmpUrl);
                            ImageIO.write(image, "png", imageFile);
                            return Response.ok(imageFile).build();
                        } catch (MalformedURLException e) {
                            log.error( e );
                            return Response.status(Response.Status.NOT_FOUND ).build();
                        } catch (IOException e) {
                            log.error( e );
                            return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
                        }
                    }
                }
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("short")
    @Produces(MediaType.TEXT_PLAIN)
    public String getAndPutShortKey(@RequestBody String requestContent) throws  JSONException {
        JSONObject obj = new JSONObject(requestContent);
        String key = null;
        String value = null;
        if(obj.has("key")) {
            key = obj.getString("key");
        }
        if(obj.has("value")) {
            value = obj.getString("value");
        }
        if(key != null && value != null) {
            return createShortFile(key, value);
        }
        if(value != null) {
            return value;
        }
        return "";
    }

    
    private String createShortFile(String key, String value) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.CONFIG_DIR, "./").trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }
        
        File shortenDir = new File (path + "shorten");
        if(!shortenDir.exists()) {
            shortenDir.mkdir();
        }
        
        File shortenDirKey = new File (shortenDir.getAbsolutePath(), key);
        if(!shortenDirKey.exists()) {
            shortenDirKey.mkdir();
        }
        String valueToMd5 = DigestUtils.md5Hex(value);
        
        String shortenDirSubPath = shortenDirKey.getAbsolutePath();
        
        if(!shortenDirSubPath.endsWith( "/")){
            shortenDirSubPath += "/";
        }
        
        shortenDirSubPath += valueToMd5.substring(0, 2);
        
        File shortenDirSub = new File(shortenDirSubPath);
        if(!shortenDirSub.exists()) {
            shortenDirSub.mkdir();
        }
        
        String shortenFilename = shortenDirSub.getAbsolutePath();
       
        if(!shortenFilename.endsWith( "/")){
            shortenFilename += "/";
        }
        
        shortenFilename += valueToMd5;
       
        File shortenFile = new File(shortenFilename);
        if(!shortenFile.exists()) {
            Utils.updateFile("shorten/" + key + "/" + shortenDirSub.getName() + "/" + valueToMd5, value);
        }
        return valueToMd5;
    }

    @GET
    @Path("short")
    @Produces(MediaType.TEXT_PLAIN)
    public String getShortKey(@QueryParam("key") String key, @QueryParam("value") String valueToMd5) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String path = p.getProperty( ConfigurationProvider.CONFIG_DIR, "./").trim();
        
        if(!path.endsWith( "/")){
            path += "/";
        }

        File shortenFile = new File(path + "shorten/" + key + "/" + valueToMd5.substring(0, 2), valueToMd5);
        if(shortenFile.exists()) {
            String fileContent = Utils.getFileContent(path, valueToMd5 , "", "shorten/" + key + "/" + valueToMd5.substring(0, 2) + "/");
            if(StringUtils.isNotEmpty(fileContent)) {
                Utils.updateFile("shorten/" + key + "/" + valueToMd5.substring(0, 2) + "/" + valueToMd5, fileContent, false);
                return fileContent.trim();
            }
        }
        return valueToMd5;
    }

    private String createKMLFile(String content, String mapUserId) throws IOException{
        String filename = "";
        String fileId = "";
        String path = "";
        
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        path = p.getProperty( ConfigurationProvider.KML_DIRECTORY, "./kml/").trim();
        
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
        
        if (content != null && content.length() > 0) {
            fileId += DigestUtils.md5Hex(content);
            filename += fileId;
            File file = new File( filename);
            Utils.writeFileContent(file, content);
        }
       return fileId;
    }
}
