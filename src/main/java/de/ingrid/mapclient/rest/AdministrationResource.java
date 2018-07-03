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

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Properties;

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

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.springframework.web.bind.annotation.RequestBody;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.utils.Utils;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/admin")
public class AdministrationResource {

    private static final Logger log = Logger.getLogger( AdministrationResource.class );
    
    /* Layers */
    @GET
    @Path("layers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLayersList(@QueryParam("currentPage") String currentPage, @QueryParam("layersPerPage") String layersPerPage, @QueryParam("searchText") String searchText) {
        String[] searchKeys = {"label", "id"};
        if(currentPage == null && layersPerPage == null) {
            // Get layer list compress
            JSONArray arr = getLayers(null, true);
            if(arr != null) {
                if(searchText != null) {
                    arr = getFilterArray(arr, searchText, searchKeys);
                }
                return Response.ok( arr ).build();
            }
        } else {
            // Get paging layer list compress
            JSONArray arr = getLayers(null);
            if(arr != null) {
                if(searchText != null) {
                    arr = getFilterArray(arr, searchText, searchKeys);
                }
                int tmpCurrentPage = Integer.parseInt(currentPage);
                int tmpLayersPerPage = Integer.parseInt(layersPerPage);
                int lastPage = (int) Math.ceil(arr.length() / (double) tmpLayersPerPage);
                int totalNumOfLayersPerPage = tmpCurrentPage * tmpLayersPerPage;
                int firstNumOfLayers = totalNumOfLayersPerPage - tmpLayersPerPage;
                if( lastPage < 1) {
                    lastPage= 1;
                } 
                if(lastPage < tmpCurrentPage) {
                    tmpCurrentPage = lastPage;
                    totalNumOfLayersPerPage = tmpCurrentPage * tmpLayersPerPage;
                    firstNumOfLayers = totalNumOfLayersPerPage - tmpLayersPerPage;
                }
                JSONObject obj = getPaginationArray(arr, tmpCurrentPage, lastPage, firstNumOfLayers, totalNumOfLayersPerPage);
                return Response.ok( obj ).build();
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("layers/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLayerById(@PathParam("id") String id) {
        JSONArray arr = getLayers(id);
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @POST
    @Path("layers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response addLayer(String content) {
        JSONArray layers;
        try {
            layers = new JSONArray(content);
            JSONArray arr = addLayer(layers);
            if(arr != null) {
                return Response.ok( arr ).build();
            }
        } catch (JSONException e) {
            log.error("Error POST '/layers'!");
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @PUT
    @Path("layers/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateLayerById(@RequestBody String content, @PathParam("id") String id) {
        try {
            JSONObject layer = new JSONObject(content);
            String newId = id;
            if(layer.has("id")) {
                newId = layer.getString("id");
            }
            if(!id.equals(newId)) {
                // Update catalogs reference 
                JSONArray categories = getCategories();
                for (int i = 0; i < categories.length(); i++) {
                    JSONObject category = categories.getJSONObject(i);
                    String catId = category.getString("id");
                    JSONArray cat = getCategoryTree(catId);
                    for (int j = 0; j < cat.length(); j++) {
                        JSONObject catItem = cat.getJSONObject(j);
                        updateCategoryLayersId(catItem, id, newId);
                    }
                    updateCategoryTree(catId, cat);
                }
            }
            JSONArray arr = updateLayer(id, layer);
            if(arr != null) {
                return Response.ok( arr ).build();
            }
        } catch (JSONException e) {
            log.error("Error POST '/layers/{id}'!");
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @DELETE
    @Path("layers/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteLayerById(@PathParam("id") String id) {
        String[] ids = id.split(",");
        JSONArray arr = deleteLayers(ids);
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @DELETE
    @Path("layers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteLayersByIds(@QueryParam("ids") String paramIds) {
        String[] ids = paramIds.split(",");
        JSONArray arr = deleteLayers(ids);
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @DELETE
    @Path("layers/all")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteLayersAll() {
        JSONArray arr = deleteLayers();
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    /* Categories */
    @GET
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoriesList() {
        JSONArray arr = getCategories();
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @GET
    @Path("categories/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoryById(@PathParam("id") String id) {
        JSONArray arr = getCategoryTree(id);
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @POST
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response addCategory(String content) {
        JSONObject category;
        try {
            category = new JSONObject(content);
            JSONArray arr = addCategory(category);
            if(arr != null) {
                return Response.ok( arr ).build();
            }
        } catch (JSONException e) {
            log.error("Error POST '/categories'!");
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @PUT
    @Path("categories/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateCategoryById(@RequestBody String content, @PathParam("id") String id) {
        try {
            JSONObject item = new JSONObject(content);
            JSONArray arr = updateCategory(id, item);
            if(arr != null) {
                return Response.ok( arr ).build();
            }
        } catch (JSONException e) {
            log.error("Error POST '/categories/{id}'!");
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @DELETE
    @Path("categories/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCategoryById(@PathParam("id") String id) {
        JSONArray arr = deleteCategory(id);
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @DELETE
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCategoriesByIds(@QueryParam("ids") String paramIds) {
        String[] ids = paramIds.split(",");
        JSONArray arr = deleteCategories(ids);
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @DELETE
    @Path("categories/all")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCategoriesAll() {
        JSONArray arr = deleteCategories();
        if(arr != null) {
            return Response.ok( arr ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    @PUT
    @Path("categorytree/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateCategoryTree(@RequestBody String content, @PathParam("id") String id) {
        try {
            JSONArray item = new JSONArray(content);
            JSONArray arr = updateCategoryTree(id, item);
            if(arr != null) {
                return Response.ok( arr ).build();
            }
        } catch (JSONException e) {
            log.error("Error POST '/categorytree/{id}'!");
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("setting")
    @Produces(MediaType.APPLICATION_JSON)
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
            return Response.ok( setting ).build();
        } catch (JSONException e) {
            log.error("Error getSettingRequest: " + e);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("setting")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateSetting(@RequestBody String content) {
        try {
            JSONObject setting = null;
            JSONObject settingProfile = null;
            String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            String fileSetting = classPath + "frontend/";
            String fileContent = Utils.getFileContent(fileSetting, "setting", ".json", "config/");
            if(fileContent != null) {
                setting = new JSONObject(fileContent);
            }
            
            if(setting != null) {
                settingProfile = new JSONObject(content);
                Iterator<?> keys = setting.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (settingProfile.has(key)) {
                        Object obj = setting.get(key);
                        Object objProfile = settingProfile.get(key);
                        if(obj instanceof String && objProfile instanceof String) {
                            if(setting.getString(key).equals(settingProfile.getString(key))) {
                                settingProfile.remove(key);
                            }
                        } else if(obj instanceof Boolean && objProfile instanceof Boolean) {
                            if(setting.getBoolean(key) == settingProfile.getBoolean(key)) {
                                settingProfile.remove(key);
                            }
                        } else if(obj instanceof Integer && objProfile instanceof Integer) {
                            if(setting.getInt(key) == settingProfile.getInt(key)) {
                                settingProfile.remove(key);
                            }
                        } else if(obj instanceof Double && objProfile instanceof Double) {
                            if(setting.getDouble(key) == settingProfile.getDouble(key)) {
                                settingProfile.remove(key);
                            }
                        } else if(obj instanceof Long && objProfile instanceof Long) {
                            if(setting.getLong(key) == settingProfile.getLong(key)) {
                                settingProfile.remove(key);
                            }
                        } else if (obj instanceof JSONArray) {
                            JSONArray settingArr = setting.getJSONArray(key);
                            JSONArray settingProfileArr = settingProfile.getJSONArray(key);
                            if(settingArr != null && settingProfileArr != null) {
                                boolean isSame = false;
                                if (settingArr.length() == settingProfileArr.length()) {
                                    isSame = true;
                                    for (int i = 0; i < settingArr.length(); i++) {
                                        Object arrayObj = settingArr.get(i);
                                        Object arrayProfileObj = settingProfileArr.get(i);
                                        if(arrayObj instanceof String && arrayProfileObj instanceof String) {
                                            if(!settingArr.getString(i).equals(settingProfileArr.getString(i))) {
                                                isSame = false;
                                                break;
                                            }
                                        } else if(arrayObj instanceof Boolean && arrayProfileObj instanceof Boolean) {
                                            if(settingArr.getBoolean(i) != settingProfileArr.getBoolean(i)) {
                                                isSame = false;
                                                break;
                                            }
                                        } else if(arrayObj instanceof Integer && arrayProfileObj instanceof Integer) {
                                            if(settingArr.getInt(i) != settingProfileArr.getInt(i)) {
                                                isSame = false;
                                                break;
                                            }
                                        } else if(arrayObj instanceof Double && arrayProfileObj instanceof Double) {
                                            if(settingArr.getDouble(i) != settingProfileArr.getDouble(i)) {
                                                isSame = false;
                                                break;
                                            }
                                        } else if(arrayObj instanceof Long && arrayProfileObj instanceof Long) {
                                            if(settingArr.getLong(i) != settingProfileArr.getLong(i)) {
                                                isSame = false;
                                                break;
                                            }
                                        } else if(arrayObj.getClass() != arrayProfileObj.getClass()) {
                                            isSame = false;
                                            break;
                                        }
                                    }
                                }
                                if(isSame) {
                                    settingProfile.remove(key);
                                }
                            }
                        }
                    }
                }
            } else {
                settingProfile = new JSONObject(content);
            }
            JSONObject obj = updateSetting(settingProfile);
            if(obj != null) {
                return Response.status( Response.Status.OK ).build();
            }
        } catch (JSONException e) {
            log.error("Error POST '/categories/{id}'!");
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("setting/reset")
    @Produces(MediaType.APPLICATION_JSON)
    public Response resetSetting(@RequestBody String content) {
        JSONObject obj = updateSetting(new JSONObject());
        if(obj != null) {
            return this.getSettingRequest();
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

    @PUT
    @Path("css")
    @Produces(MediaType.TEXT_PLAIN)
    public Response updateCssRequest(@RequestBody String content) {
        if(content != null) {
            String fileContent = updateCss(content);
            if(fileContent != null) {
                return Response.status(Response.Status.OK ).build();
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("help/{lang}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getHelpRequest(@PathParam("lang") String lang) {
        try {
            if(lang != null) {
                String filename = "help-" + lang;
                if(log.isDebugEnabled()){
                    log.debug( "Load file: " + filename );
                }
                
                JSONObject help = new JSONObject();
                JSONObject profileHelp = new JSONObject();
                
                if(log.isDebugEnabled()){
                    log.debug( "Load file: " + filename );
                }
                String classPath = "";
                classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
                String filePathHelp = classPath + "frontend/";
                String fileContent = Utils.getFileContent(filePathHelp, filename, ".json", "help/");
                if(fileContent != null) {
                    help = new JSONObject(fileContent);
                }
                
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                if(config_dir != null){
                    fileContent = Utils.getFileContent(config_dir, filename + ".profile", ".json", "help/");
                    if(fileContent != null){
                        profileHelp = new JSONObject(fileContent);
                    }
                }
                
                if(help != null && profileHelp != null) {
                    Iterator<?> keys = profileHelp.keys();
                    while( keys.hasNext() ) {
                        String key = (String)keys.next();
                        if (profileHelp.has(key)) {
                            help.put(key, profileHelp.get(key));
                        }
                    }
                }
                return Response.ok( help.toString() ).build();
            }
        } catch (JSONException e) {
            log.error("Error getHelpRequest: " + e);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("help/{lang}/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getHelpIdRequest(@PathParam("lang") String lang, @PathParam("id") String id) {
        if(lang != null) {
            String filename = "help-" + lang;
            if(filename != null && filename.length() > 0){
                if(log.isDebugEnabled()){
                    log.debug( "Load file: " + filename );
                }
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                if(config_dir != null){
                    Response helps = this.getHelpRequest(lang);
                    if(helps != null) {
                        if(helps.getEntity() != null) {
                            String fileContent = helps.getEntity().toString();
                            if(fileContent != null) {
                                try {
                                    JSONObject obj = new JSONObject(fileContent);
                                    JSONObject jsonObj = new JSONObject();
                                    JSONObject jsonObjId = obj.getJSONObject(id);
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
                                    return Response.ok( jsonObj ).build();
                                } catch (JSONException e) {
                                    log.error("Error get help with ID " + id);
                                }
                            }
                        }
                    }
                }
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("help/{lang}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response updateHelpRequest(@RequestBody String content, @PathParam("lang") String lang) {
        if(content != null) {
            String fileContent = updateHelp(lang, content);
            if(fileContent != null) {
                return Response.status( Response.Status.OK ).build();
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("help/reset/{lang}/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response resetHelpRequest(@PathParam("lang") String lang, @PathParam("id") String id) {
        if(lang != null && id != null) {
            String fileContent = resetHelp(lang, id);
            if(fileContent != null) {
                return this.getHelpRequest(lang);
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("locales/{lang}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateLocaleRequest(@RequestBody String content, @PathParam("lang") String lang) {
        try {
            updateLocale(lang, content);
            return Response.status( Response.Status.OK ).build();
        } catch (JSONException e) {
            log.error("Error PUT '/locales'!");
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    private void updateLocale(String lang, String content) throws JSONException {
        JSONObject locale = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = Utils.getFileContent(config_dir, lang + ".profile", ".json", "locales/");
        if(fileContent != null) {
            locale = new JSONObject(fileContent);
        }
        JSONObject item = new JSONObject(content);
        if(item != null && locale != null) {
            Iterator<?> keys = item.keys();
            while( keys.hasNext() ) {
                String key = (String)keys.next();
                if (item.has(key)) {
                    locale.put(key, item.get(key));
                }
            }
            updateFile("locales/" + lang + ".profile.json", locale);
        } else if(item != null) {
            updateFile("locales/" + lang + ".profile.json", item);
        }
    }

    private void deleteLocale(String lang, ArrayList<String> keys) throws JSONException {
        JSONObject locale = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = Utils.getFileContent(config_dir, lang, ".json", "locales/");
        if(fileContent != null) {
            locale = new JSONObject(fileContent);
        }
        if(locale != null) {
            for (String key : keys) {
                if(locale.has(key)) {
                    locale.remove(key);
                }
            }
            updateFile("locales/" + lang + ".profile.json", locale);
        }
    }

    private JSONArray updateCategoryTree(String id, JSONArray item) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "catalog-" + id, ".json", "data/");
        }
        JSONArray arr = null;
        try {
            JSONObject obj = new JSONObject(fileContent);
            arr = new JSONArray();
            JSONObject results = obj.getJSONObject("results");
            JSONObject root = results.getJSONObject("root");
            root.put("children", item);
            updateFile("data/catalog-" + id + ".json", obj);
            return item;
        } catch (Exception e) {
            log.error("Error 'updateCategoryTree'!");
        }
        return arr;
    }

    private JSONObject updateSetting(JSONObject item) {
        try {
            updateFile("config/setting.profile.json", item);
            return item;
        } catch (Exception e) {
            log.error("Error 'updateSetting'!");
        }
        return null;
    }
    
    private String updateCss(String content) {
        try {
            String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            if(classPath != null) {
                String filePathHelp = classPath + "frontend/";
                String fileContent = Utils.getFileContent(filePathHelp, "app.override", ".css", "css/");
                if(fileContent != null) {
                    if(!fileContent.equals(content)) {
                        updateFile("css/app.override.css", content);
                    }
                }
            }
            return content;
        } catch (Exception e) {
            log.error("Error 'updateCss'!");
        }
        return null;
    }
    
    private String updateHelp(String lang, String content) {
        JSONObject help = null;
        JSONObject profileHelp = null;
        try {
            String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            if(classPath != null) {
                String filePathHelp = classPath + "frontend/";
                String fileContent = Utils.getFileContent(filePathHelp, "help-" + lang, ".json", "help/");
                if(fileContent != null) {
                    help = new JSONObject(fileContent);
                }
            }
            if(content != null) {
                profileHelp = new JSONObject(content);
            }
            
            if(help != null && profileHelp != null) {
                Iterator<?> keys = help.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (profileHelp.has(key)) {
                        JSONObject helpItem = help.getJSONObject(key);
                        JSONObject helpProfileItem = profileHelp.getJSONObject(key);
                        if(helpItem.has("title") && helpProfileItem.has("title") && helpItem.getString("title").equals(helpProfileItem.getString("title")) 
                            && helpItem.has("text") && helpProfileItem.has("text") && helpItem.getString("text").equals(helpProfileItem.getString("text"))
                            && helpItem.has("image") && helpProfileItem.has("image") &&  helpItem.getString("image").equals(helpProfileItem.getString("image"))){
                            profileHelp.remove(key);
                        }
                    }
                }
            } else {
                profileHelp = new JSONObject();
            }
            updateFile("help/help-" + lang + ".profile.json", profileHelp.toString());
            return content;
        } catch (Exception e) {
            log.error("Error write profile help: " + e);
        }
        return null;
    }

    private String resetHelp(String lang, String id) {
        try {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(config_dir != null){
                String fileContent = Utils.getFileContent(config_dir, "help-" + lang + ".profile", ".json", "help/");
                if(fileContent != null) {
                    JSONObject profileHelp = new JSONObject(fileContent);
                    if(profileHelp != null) {
                        if(profileHelp.has(id)) {
                            profileHelp.remove(id);
                        }
                        updateFile("help/help-" + lang + ".profile.json", profileHelp.toString());
                        return profileHelp.toString();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error reset help: " + e);
        }
        
        return null;
    }
    
    private JSONArray getLayers(String id) {
       return getLayers(id, false);
    }
    
    private JSONArray getLayers(String id, boolean compress) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "layers", ".json", "data/");
        }
        JSONArray arr = null;
        try {
            JSONObject obj = new JSONObject(fileContent);
            arr = new JSONArray();
            if (id != null) {
                JSONObject tmpObj = new JSONObject();
                tmpObj.put("id", id);
                tmpObj.put("item", obj.get(id));
                arr.put(tmpObj);
            } else {
                Iterator<?> keys = obj.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if ( obj.get(key) instanceof JSONObject ) {
                        JSONObject tmpObj = new JSONObject();
                        tmpObj.put("id", key);
                        if(compress) {
                            JSONObject item = obj.getJSONObject(key);
                            JSONObject itemCompress = new JSONObject();
                            itemCompress.put("id", key);
                            if(item.has("label")) {
                                itemCompress.put("label", item.get("label"));
                            }
                            if(item.has("background")) {
                                itemCompress.put("background", item.get("background"));
                            }
                            tmpObj.put("item", itemCompress);
                        } else {
                            tmpObj.put("item", obj.get(key));
                        }
                        arr.put(tmpObj);
                    }
                };
            }
        } catch (JSONException e) {
            log.error("Error 'getLayers'!");
        }
        return arr;
    }
    
    private JSONArray addLayer(JSONArray layers) {
        if(layers != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            String fileContent = null;
            if(config_dir != null){
                fileContent = Utils.getFileContent(config_dir, "layers", ".json", "data/");
            }
            try {
                JSONObject newObj = new JSONObject();
                JSONObject obj = new JSONObject(fileContent);
                for (int i = 0; i < layers.length(); i++) {
                    JSONObject tmpObj = layers.getJSONObject(i);
                    String id = tmpObj.getString("id");
                    if(obj.has(id)) {
                        id = generateID(obj, id);
                    }
                    newObj.put(id, tmpObj.get("item"));
                }
                Iterator<?> keys = obj.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    newObj.put(key, obj.getJSONObject(key));
                }
                updateFile("data/layers.json", newObj);
            } catch (JSONException e) {
                log.error("Error 'updateLayer'!");
            }
        }
        return getLayers(null);
    }
    
    private String generateID(JSONObject obj, String id) throws JSONException {
        if(obj.has(id)){
            id = generateID(obj, id + "_");
        }
        return id.replace(".", "_");
    }

    private JSONObject getPaginationArray(JSONArray arr, int currentPage, int lastPage, int firstNumOfLayers, int totalNumOfLayersPerPage) {
        JSONObject obj = new JSONObject();
        JSONArray arrPagination = new JSONArray();
        try {
            obj.put("firstPage", currentPage);
            obj.put("lastPage", lastPage);
            obj.put("totalItemsNum", arr.length());
            for (int i = firstNumOfLayers; i < totalNumOfLayersPerPage; i++) {
                if(i <= arr.length() - 1) {
                    arrPagination.put(arr.get(i));
                }
            }
            obj.put("items", arrPagination);
        } catch (JSONException e) {
            log.error("Error on paging layers!");
        }
        return obj;
    }

    private JSONArray getFilterArray(JSONArray arr, String searchText, String[] keys) {
        JSONArray arrSearch = new JSONArray();
        for (int i = 0; i < arr.length(); i++) {
            if(i < arr.length() - 1) {
                JSONObject obj;
                try {
                    obj = arr.getJSONObject(i);
                    if(obj.has("item")) {
                        JSONObject item = obj.getJSONObject("item");
                        for (String key : keys) {
                            if(item.has(key)){
                                String value = item.getString(key);
                                if(value.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
                                   arrSearch.put(obj);
                                   break;
                                }
                            }
                        }
                    }
                } catch (JSONException e) {
                    log.error("Error on search layers!");
                }
            }
        }
        return arrSearch;
    }

    private JSONArray updateLayer(String id, JSONObject layer) {
        if(id != null && layer != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            String fileContent = null;
            if(config_dir != null){
                fileContent = Utils.getFileContent(config_dir, "layers", ".json", "data/");
            }
            try {
                JSONObject obj = new JSONObject(fileContent);
                JSONObject layerItem = (JSONObject) layer.get("item");
                String newId = layer.getString("id");
                if(newId != null  && id.equals(newId)) {
                    obj.put(id, layerItem);
                } else {
                    // TODO: Update catalog files.
                    String newObj = obj.toString();
                    newObj = newObj.replaceAll(id, newId);
                    obj = new JSONObject(newObj);
                    obj.put(newId, layerItem);
                }
                updateFile("data/layers.json", obj);
            } catch (JSONException e) {
                log.error("Error 'updateLayer'!");
            }
        }
        return getLayers(null, true);
    }
    
    private JSONArray deleteLayers() {
        return deleteLayers(null);
    }
    
    private JSONArray deleteLayers(String[] ids) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "layers", ".json", "data/");
        }
        try {
            JSONObject obj = new JSONObject(fileContent);
            if(ids != null) {
                for (String id : ids) {
                    if(id != null && id.length() > 0) {
                        obj.remove(id);
                    }
                }
            }else {
                obj = new JSONObject();
            }
            removeLayersFromCategories(ids);
            updateFile("data/layers.json", obj);
        } catch (JSONException e) {
            log.error("Error 'deleteLayer'!");
        }
        return getLayers(null, true);
    }
    
    private void removeLayersFromCategories(String[] ids) {
        JSONArray categories = getCategories();
        for (int i = 0; i < categories.length(); i++) {
            try {
                JSONObject category = categories.getJSONObject(i);
                String catId = category.getString("id");
                JSONArray cat = getCategoryTree(catId);
                JSONArray newCat = new JSONArray();
                for (int j = 0; j < cat.length(); j++) {
                    JSONObject catItem = cat.getJSONObject(j);
                    if(catItem != null) {
                        removeLayerFromCategory(ids, catItem, newCat);
                    }
                }
                updateCategoryTree(catId, newCat);
            } catch (JSONException e) {
                log.error("Error remove layers from category.");
            }
        }
    }

    private void removeLayerFromCategory(String[] ids, JSONObject item, JSONArray list) {
        JSONObject obj = null;
        try {
            boolean layerExist = false;
            if(item.has("layerBodId")) {
                String layerBodId = item.getString("layerBodId");
                if(layerBodId != null) {
                    if(ids != null) {
                        for (String id : ids) {
                            if(layerBodId.equals(id)) {
                                layerExist = true;
                            }
                        }
                    } else {
                        layerExist = true;
                    }
                }
            }
            if (!layerExist) {
                obj = item;
                if(item != null) {
                    if(item.has("children")) {
                        JSONArray children = item.getJSONArray("children");
                        if(children != null) {
                            JSONArray childList = new JSONArray();
                            for (int j = 0; j < children.length(); j++) {
                                JSONObject catItem = children.getJSONObject(j);
                                removeLayerFromCategory(ids, catItem, childList);
                            }
                            obj.put("children", childList);
                        }
                    }
                }
            }
        } catch (JSONException e) {
            log.error("Error remove layers from category: " + e);
        }
        if(obj != null) {
            list.put(obj);
        }
    }

    private JSONArray getCategories() {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "catalogs", ".json", "data/");
        }
        JSONArray arr = new JSONArray();
        try {
            JSONObject obj = new JSONObject(fileContent);
            return obj.getJSONArray("topics");
        } catch (JSONException e) {
            log.error("Error 'getCategories'!");
        }
        return arr;
    }
    
    private JSONArray addCategory(JSONObject catelog) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "catalogs", ".json", "data/");
        }
        try {
            JSONObject obj = new JSONObject(fileContent);
            JSONObject rootItem = new JSONObject();
            rootItem.put("category", "root");
            rootItem.put("staging", "prod");
            rootItem.put("id", 1);
            rootItem.put("children", new JSONArray());
            JSONObject root = new JSONObject();
            root.put("root", rootItem);
            JSONObject results = new JSONObject();
            results.put("results", root);
            createFile("data/catalog-" + catelog.getString("id") + ".json", results);
            obj.getJSONArray("topics").put(catelog);
            updateFile("data/catalogs.json", obj);
        } catch (JSONException e) {
            log.error("Error 'addCategory'!");
        }
        return getCategories();
    }
    
    private JSONArray updateCategory(String id, JSONObject item) {
        if(id != null && item != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            String fileContent = null;
            if(config_dir != null){
                fileContent = Utils.getFileContent(config_dir, "catalogs", ".json", "data/");
            }
            try {
                JSONObject obj = new JSONObject(fileContent);
                JSONArray topics = obj.getJSONArray("topics");
                for (int i = 0; i < topics.length(); i++) {
                    JSONObject tmpObj = topics.getJSONObject(i);
                    if(tmpObj.getString("id").equals(id)) {
                        topics.put(i, item);
                        break;
                    }
                }
                updateFile("data/catalogs.json", obj);
            } catch (JSONException e) {
                log.error("Error 'updateCategory'!");
            }
        }
        return getCategories();
    }

    private JSONArray deleteCategory(String id) {
        if(id != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            String fileContent = null;
            if(config_dir != null){
                fileContent = Utils.getFileContent(config_dir, "catalogs", ".json", "data/");
            }
            try {
                JSONObject obj = new JSONObject(fileContent);
                JSONArray topics = obj.getJSONArray("topics");
                JSONArray newTopics = new JSONArray();
                for (int i = 0; i < topics.length(); i++) {
                    JSONObject tmpObj = topics.getJSONObject(i);
                    if(!tmpObj.getString("id").equals(id)) {
                        newTopics.put(tmpObj);
                    }
                }
                obj.put("topics", newTopics);
                removeFile("data/catalog-" + id +".json");
                updateFile("data/catalogs.json", obj);
                deleteCategoriesLocales(id);
            } catch (JSONException e) {
                log.error("Error 'deleteCategory'!");
            }
        }
        return getCategories();
    }

    private void deleteCategoriesLocales(String id) throws JSONException {
        ArrayList<String> list = new ArrayList<String>();
        list.add(id);
        list.add("topic_" + id + "_tooltip");
        list.add(id + "_service_link_href");
        list.add(id + "_service_link_label");
        deleteLocale("de", list);
    }

    private JSONArray deleteCategories() {
       return deleteCategories(null); 
    }
    
    private JSONArray deleteCategories(String[] ids) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "catalogs", ".json", "data/");
        }
        try {
            JSONObject obj = new JSONObject(fileContent);
            JSONArray topics = obj.getJSONArray("topics");
            JSONArray newTopics = new JSONArray();
            for (int i = 0; i < topics.length(); i++) {
                JSONObject tmpObj = topics.getJSONObject(i);
                boolean toDelete = false;
                if(ids != null) {
                    for (String id : ids) {
                        if(id != null && id.length() > 0) {
                            if(tmpObj.getString("id").equals(id)) {
                                removeFile("data/catalog-" + id +".json");
                                deleteCategoriesLocales(id);
                                toDelete = true;
                                break;
                            }
                        }
                    }
                } else {
                    String id = tmpObj.getString("id");
                    removeFile("data/catalog-" + id +".json");
                    deleteCategoriesLocales(id);
                    toDelete = true;
                }
                if(!toDelete) {
                    newTopics.put(tmpObj);
                }
            }
            obj.put("topics", newTopics);
            updateFile("data/catalogs.json", obj);
        } catch (JSONException e) {
            log.error("Error 'deleteLayer'!");
        }
        return getCategories();
    }
    
    private JSONArray getCategoryTree(String id) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "catalog-" + id, ".json", "data/");
        }
        JSONArray arr = new JSONArray();
        try {
            JSONObject obj = new JSONObject(fileContent);
            JSONObject results = obj.getJSONObject("results");
            JSONObject root = results.getJSONObject("root");
            return root.getJSONArray("children");
        } catch (JSONException e) {
            log.error("Error 'getCategoryTree'!");
        }
        return arr;
    }
    
    private void updateCategoryLayersId(JSONObject catItem, String id, String newId) throws JSONException {
        String key = "layerBodId";
        if(!catItem.isNull(key)) {
            String layerBodId = catItem.getString(key);
            if(layerBodId != null && layerBodId.equals(id)) {
                catItem.put("layerBodId", newId);
            }
        }
        
        key = "children";
        if(!catItem.isNull(key)) {
            JSONArray children = catItem.getJSONArray(key);
            if(children != null) {
                for (int i = 0; i < children.length(); i++) {
                    JSONObject child = children.getJSONObject(i);
                    if(child != null) {
                        updateCategoryLayersId(child, id, newId);
                    }
                }
            }
        }
    }
    
    private void createFile(String filename, JSONObject item) throws JSONException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File file = new File(config_dir.concat(filename));
        if(!file.exists()){
            try(FileWriter fw = new FileWriter(file, true);
                BufferedWriter bw = new BufferedWriter(fw);
                PrintWriter out = new PrintWriter(bw)){
                out.println(item.toString());
            } catch (IOException e) {
                log.error( "Error write new json file!" );
            }
        }
    }
    
    private void updateFile(String filename, JSONObject item) throws JSONException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File cpFile = new File(config_dir.concat(filename + ".old"));
        if(!cpFile.delete()) {
            log.error("Error delete file: '" + cpFile.getName() + "'" );
        }
        File file = new File(config_dir.concat(filename));
        if(!file.renameTo( cpFile )) {
            log.error("Error rename file: '" + file.getName() + "'" );
        }
        file = new File(config_dir.concat(filename));
        Utils.cleanFileContent(file);
        log.info( "Update file :" + file.getAbsoluteFile() );
        if(file != null){
            try(FileWriter fw = new FileWriter(file, true);
                BufferedWriter bw = new BufferedWriter(fw);
                PrintWriter out = new PrintWriter(bw)){
                out.println(item.toString());
            } catch (IOException e) {
                log.error( "Error write new json file!" );
            }
        }
    }
    
    private void updateFile(String filename, String item) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File cpFile = new File(config_dir.concat(filename + ".old"));
        if(cpFile.exists()){
            if(!cpFile.delete()) {
                log.error("Error delete file: '" + cpFile.getName() + "'" );
            }
        }
        File file = new File(config_dir.concat(filename));
        if(!file.renameTo( cpFile )) {
            log.error("Error rename file: '" + file.getName() + "'" );
        }
        file = new File(config_dir.concat(filename));
        Utils.cleanFileContent(file);
        log.info( "Update file :" + file.getAbsoluteFile() );
        if(file != null){
            try(FileWriter fw = new FileWriter(file, true);
                BufferedWriter bw = new BufferedWriter(fw);
                PrintWriter out = new PrintWriter(bw)){
                out.println(item.toString());
            } catch (IOException e) {
                log.error( "Error write new json file!" );
            }
        }
    }
    
    private void removeFile(String filename) throws JSONException {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File file = new File(config_dir.concat(filename));
        if(file.exists()) {
            if(!file.delete()) {
                log.error("Error delete file: '" + file.getName() + "'" );
            }
        }
    }
}
