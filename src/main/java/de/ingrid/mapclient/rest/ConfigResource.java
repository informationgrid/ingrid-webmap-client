/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2019 wemove digital solutions GmbH
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

import java.util.Iterator;
import java.util.Properties;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

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
    @Produces(MediaType.TEXT_PLAIN)
    public Response getSettingRequest() {
        String filename = "setting";
        try {
            JSONObject setting = null;
            JSONObject profileSetting = null;
            
            if(log.isDebugEnabled()){
                log.debug( "Load file: " + filename );
            }
            String classPath = "";
            classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            String fileSetting = classPath + "frontend/";
            String fileContent = Utils.getFileContent(fileSetting, filename, ".json", "config/");
            if(fileContent != null) {
                setting = new JSONObject(fileContent);
            }
            
            filename = "setting.profile";
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(config_dir != null){
                fileContent = Utils.getFileContent(config_dir, filename, ".json", "config/");
            }
            
            if(fileContent != null){
                profileSetting = new JSONObject(fileContent);
            }
            if(setting != null && profileSetting != null) {
                Iterator<?> keys = profileSetting.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (profileSetting.has(key)) {
                        setting.put(key, profileSetting.get(key));
                    }
                }
            }
            return Response.ok( "var settings = " + setting ).build();
        } catch (JSONException e) {
            log.error("Error getSettingRequest: " + e);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @GET
    @Path("css")
    @Produces("text/css")
    public Response getCssRequest() {
        String filename = "app.override";
        if(log.isDebugEnabled()){
            log.debug( "Load file: " + filename );
        }
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(config_dir != null){
            String fileContent = Utils.getFileContent(config_dir, filename, ".css", "css/");
            if(fileContent != null) {
                return Response.ok( fileContent ).build();
            }
        }
        
        String classPath = "";
        classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
        String filePathHelp = classPath + "frontend/";
        String fileContent = Utils.getFileContent(filePathHelp, filename, ".css", "css/");
        if(fileContent != null) {
            return Response.ok( fileContent ).build();
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
    
    @GET
    @Path("locales/{locale}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLocales(@PathParam("locale") String locale) throws JSONException {
        String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
        JSONObject locales = new JSONObject();
        String fileLocalePath = null;
        String fileContent = null;
        // Get frontend locale
        fileLocalePath = classPath + "frontend/prd/";
        fileContent = Utils.getFileContent(fileLocalePath, locale, "", "locales/");
        if(fileContent != null) {
            JSONObject frontendLocale = new JSONObject(fileContent);
            if(frontendLocale != null) {
                Iterator<?> keys = frontendLocale.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (frontendLocale.has(key)) {
                        locales.put(key, frontendLocale.get(key));
                    }
                }
            }
        }
        // Get admin locale
        fileLocalePath = classPath + "admin/assets/";
        fileContent = Utils.getFileContent(fileLocalePath, locale, "", "i18n/");
        if(fileContent != null) {
            JSONObject frontendLocale = new JSONObject(fileContent);
            if(frontendLocale != null) {
                Iterator<?> keys = frontendLocale.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (frontendLocale.has(key)) {
                        locales.put(key, frontendLocale.get(key));
                    }
                }
            }
        }
        // Get frontend override locale
        fileLocalePath = classPath + "frontend/";
        fileContent = Utils.getFileContent(fileLocalePath, locale, "", "locales/");
        if(fileContent != null) {
            JSONObject frontendLocale = new JSONObject(fileContent);
            if(frontendLocale != null) {
                Iterator<?> keys = frontendLocale.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (frontendLocale.has(key)) {
                        locales.put(key, frontendLocale.get(key));
                    }
                }
            }
        }
        // Get frontend override portal locale
        fileLocalePath = classPath + "frontend/";
        fileContent = Utils.getFileContent(fileLocalePath, "override." + locale, "", "locales/");
        if(fileContent != null) {
            JSONObject frontendLocale = new JSONObject(fileContent);
            if(frontendLocale != null) {
                Iterator<?> keys = frontendLocale.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (frontendLocale.has(key)) {
                        locales.put(key, frontendLocale.get(key));
                    }
                }
            }
        }
        // Get profile locale
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        fileLocalePath = config_dir;
        fileContent = Utils.getFileContent(fileLocalePath, locale.replace(".", ".profile."), "", "locales/");
        if(fileContent != null){
            JSONObject profileLocale = new JSONObject(fileContent);
            if(profileLocale != null) {
                Iterator<?> keys = profileLocale.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (profileLocale.has(key)) {
                        locales.put(key, profileLocale.get(key));
                    }
                }
            }
        }
        return Response.ok( locales ).build();
    }
}
