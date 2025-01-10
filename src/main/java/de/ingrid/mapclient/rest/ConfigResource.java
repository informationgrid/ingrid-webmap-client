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

import java.util.*;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.scheduler.tasks.CapabilitiesUpdateTask;
import de.ingrid.mapclient.utils.Utils;

import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/config")
public class ConfigResource {

    private static final Logger log = Logger.getLogger( ConfigResource.class );

    private static final ObjectMapper mapper = new ObjectMapper();
    
    @GET
    @Path("setting")
    @Produces("application/javascript")
    public Response getSettingRequest(@QueryParam("asJson") boolean asJson) {
        String filename = "setting";
        try {
            ObjectNode setting = null;
            JsonNode profileSetting = null;
            
            if(log.isDebugEnabled()){
                log.debug( "Load file: " + filename );
            }
            String classPath = "";
            classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            String fileSetting = classPath + "frontend/";
            String fileContent = Utils.getFileContent(fileSetting, filename, ".json", "config/");
            if(StringUtils.isNotEmpty(fileContent)) {
                setting = (ObjectNode) mapper.readTree(fileContent);
            }
            
            filename = "setting.profile";
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                fileContent = Utils.getFileContent(configDir, filename, ".json", "config/");
                if(StringUtils.isNotEmpty(fileContent)) {
                    profileSetting = mapper.readTree(fileContent);
                    if(setting != null) {
                        Iterator<Map.Entry<String, JsonNode>> keys = profileSetting.fields();
                        while( keys.hasNext() ) {
                            Map.Entry<String, JsonNode> key = keys.next();
                            if (profileSetting.hasNonNull(key.getKey())) {
                                setting.set(key.getKey(), key.getValue());
                            }
                        }
                    }
                }
            }
            if(asJson) {
                return Response.ok( setting ).build();
            } else {
                return Response.ok( "var settings = " + setting ).build();
            }
        } catch (JsonMappingException e) {
            log.error("Error getSettingRequest: " + e);
        } catch (JsonProcessingException e) {
            log.error("Error getSettingRequest: " + e);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @GET
    @Path("css")
    @Produces("text/css")
    public Response getCssRequest() {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "app.profile", ".css", "css/");
            if(StringUtils.isEmpty(fileContent) && !configDir.equals("./webapps/ingrid-webmap-client/frontend/")) {
                fileContent = Utils.getFileContent(configDir, "app.override", ".css", "css/");
                if(fileContent != null) {
                    Utils.updateFile("css/app.profile.css", fileContent);
                }
            }
            if(StringUtils.isEmpty(fileContent)) {
                String classPath = "";
                classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
                String fileSetting = classPath + "frontend/";
                fileContent = Utils.getFileContent(fileSetting, "app.profile", ".css", "css/");
                if(StringUtils.isNotEmpty(fileContent)) {
                    Utils.updateFile("css/app.profile.css", fileContent);
                }
            }
            if(StringUtils.isNotEmpty(fileContent)) {
                return Response.ok( fileContent ).build();
            }
        }
        return Response.ok( "" ).build();
    }
    
    @GET
    @Path("data")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response dataRequest(@QueryParam("filename") String filename) {
        if(filename != null && filename.length() > 0){
            if(log.isDebugEnabled()){
                log.debug( "Load file: " + filename );
            }
            
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, filename, ".json", "data/");
                if(StringUtils.isNotEmpty(fileContent)) {
                    return Response.ok( fileContent ).build();
                }
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
    public Response getLocales(@PathParam("locale") String locale, @QueryParam("excludeProfile") boolean excludeProfile) throws JsonProcessingException {
        String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
        ObjectNode locales = mapper.createObjectNode();
        String fileLocalePath = null;
        String fileContent = null;
        // Get frontend locale
        fileLocalePath = classPath + "frontend/prd/";
        fileContent = Utils.getFileContent(fileLocalePath, locale, "", "locales/");
        if(StringUtils.isNotEmpty(fileContent)) {
            JsonNode frontendLocale = mapper.readTree(fileContent);
            if(frontendLocale != null) {
                Iterator<Map.Entry<String, JsonNode>> keys = frontendLocale.fields();
                while( keys.hasNext() ) {
                    Map.Entry<String, JsonNode> key = keys.next();
                    if (frontendLocale.hasNonNull(key.getKey())) {
                        locales.set(key.getKey(), frontendLocale.get(key.getKey()));
                    }
                }
            }
        }
        // Get admin locale
        fileLocalePath = classPath + "admin/assets/";
        fileContent = Utils.getFileContent(fileLocalePath, locale, "", "i18n/");
        if(StringUtils.isNotEmpty(fileContent)) {
            JsonNode frontendLocale = mapper.readTree(fileContent);
            if(frontendLocale != null) {
                Iterator<Map.Entry<String, JsonNode>> keys = frontendLocale.fields();
                while( keys.hasNext() ) {
                    Map.Entry<String, JsonNode> key = keys.next();
                    if (frontendLocale.hasNonNull(key.getKey())) {
                        locales.set(key.getKey(), frontendLocale.get(key.getKey()));
                    }
                }
            }
        }
        // Get frontend override locale
        fileLocalePath = classPath + "frontend/";
        fileContent = Utils.getFileContent(fileLocalePath, locale, "", "locales/");
        if(StringUtils.isNotEmpty(fileContent)) {
            JsonNode frontendLocale = mapper.readTree(fileContent);
            if(frontendLocale != null) {
                Iterator<Map.Entry<String, JsonNode>> keys = frontendLocale.fields();
                while( keys.hasNext() ) {
                    Map.Entry<String, JsonNode> key = keys.next();
                    if (frontendLocale.hasNonNull(key.getKey())) {
                        String value = frontendLocale.get(key.getKey()).textValue();
                        if(value.equals("#ignore#")) {
                            if(locales.hasNonNull(key.getKey())) {
                                locales.remove(key.getKey());
                            }
                        } else {
                            locales.put(key.getKey(), value);
                        }
                    }
                }
            }
        }
        // Get frontend override portal locale
        fileLocalePath = classPath + "frontend/";
        fileContent = Utils.getFileContent(fileLocalePath, "override." + locale, "", "locales/");
        if(StringUtils.isNotEmpty(fileContent)) {
            JsonNode frontendLocale = mapper.readTree(fileContent);
            if(frontendLocale != null) {
                Iterator<Map.Entry<String, JsonNode>> keys = frontendLocale.fields();
                while( keys.hasNext() ) {
                    Map.Entry<String, JsonNode> key = keys.next();
                    if (frontendLocale.hasNonNull(key.getKey())) {
                        locales.set(key.getKey(), frontendLocale.get(key.getKey()));
                    }
                }
            }
        }
        if(!excludeProfile) {
            // Get profile locale
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            fileLocalePath = configDir;
            fileContent = Utils.getFileContent(fileLocalePath, locale.replace(".", ".profile."), "", "locales/");
            if(StringUtils.isNotEmpty(fileContent)) {
                JsonNode profileLocale = mapper.readTree(fileContent);
                if(profileLocale != null) {
                    Iterator<Map.Entry<String, JsonNode>> keys = profileLocale.fields();
                    while( keys.hasNext() ) {
                        Map.Entry<String, JsonNode> key = keys.next();
                        if (profileLocale.hasNonNull(key.getKey())) {
                            locales.set(key.getKey(), profileLocale.get(key.getKey()));
                        }
                    }
                }
            }
        }
        Iterator<Map.Entry<String, JsonNode>> keysItr = locales.fields();
        ArrayList<String> sortKey = new ArrayList<>();
        ObjectNode sortLocales = mapper.createObjectNode();
        while(keysItr.hasNext()) {
            Map.Entry<String, JsonNode> key = keysItr.next();
            sortKey.add(key.getKey());
        }
        Collections.sort(sortKey);
        for (Iterator iterator = sortKey.iterator(); iterator.hasNext();) {
            String key = (String) iterator.next();
            sortLocales.set(key, locales.get(key));
        }
        return Response.ok( sortLocales ).build();
    }

    @GET
    @Path("help/{lang}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getHelpRequest(@PathParam("lang") String lang) {
        AdministrationResource adminRes = new AdministrationResource();
        return adminRes.getHelpRequest(lang);
    }
    @GET
    @Path("help/{lang}/{id}")
    @Produces(MediaType.TEXT_HTML)
    public Response getHelpIdRequest(@PathParam("lang") String lang, @PathParam("id") String id) {
        AdministrationResource adminRes = new AdministrationResource();
        return adminRes.getHelpIdRequest(lang, id);
    }

}
