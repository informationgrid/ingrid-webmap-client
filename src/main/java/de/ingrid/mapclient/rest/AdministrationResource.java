/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2022 wemove digital solutions GmbH
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

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;
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
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.springframework.web.bind.annotation.RequestBody;
import org.w3c.dom.Document;
import org.w3c.dom.Node;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.Constants;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.model.GetCapabilitiesDocument;
import de.ingrid.mapclient.utils.DataUtils;
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
    public Response getLayersList(@QueryParam("currentPage") String currentPage, @QueryParam("layersPerPage") String layersPerPage, @QueryParam("searchText") String searchText,
            @QueryParam("hasStatus") boolean hasStatus, @QueryParam("searchCategory") String searchCategory, @QueryParam("searchType") String searchType) {
        String[] searchTextKeys = {DataUtils.LAYER_KEY_LABEL, DataUtils.LAYER_KEY_ID, DataUtils.LAYER_KEY_WMSURL, DataUtils.LAYER_KEY_SERVICEURL};
        String[] searchTypeKeys = {"type"};
        String[] searchHasStatusKeys = {"status"};
        if(currentPage == null && layersPerPage == null) {
            // Get layer list compress
            JSONArray arr = DataUtils.getLayers(null, true);
            // Check search text
            if(searchText != null && searchText.length() > 0) {
                arr = DataUtils.getFilterArrayString(arr, searchText, searchTextKeys);
            }
            // Check search type
            if(searchType != null && searchType.length() > 0) {
                arr = DataUtils.getFilterArrayString(arr, searchType, searchTypeKeys);
            }
            // Check has state
            if(hasStatus) {
                arr = DataUtils.getFilterArrayBoolean(arr, hasStatus, searchHasStatusKeys);
            }
            // Check has category
            if(searchCategory != null && searchCategory.length() > 0) {
                arr = DataUtils.getFilterCategory(arr, searchCategory);
            }
            return Response.ok( arr ).build();
        } else {
            // Get paging layer list compress
            JSONArray arr = DataUtils.getLayers(null);
            // Check search text
            if(searchText != null && searchText.length() > 0) {
                arr = DataUtils.getFilterArrayString(arr, searchText, searchTextKeys);
            }
            // Check search type
            if(searchType != null && searchType.length() > 0) {
                arr = DataUtils.getFilterArrayString(arr, searchType, searchTypeKeys);
            }
            // Check has state
            if(hasStatus) {
                arr = DataUtils.getFilterArrayBoolean(arr, hasStatus, searchHasStatusKeys);
            }
            // Check has category
            if(searchCategory != null && searchCategory.length() > 0) {
                arr = DataUtils.getFilterCategory(arr, searchCategory);
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
            JSONObject obj = DataUtils.getPaginationArray(arr, tmpCurrentPage, lastPage, firstNumOfLayers, totalNumOfLayersPerPage);
            return Response.ok( obj ).build();
        }
    }

    @GET
    @Path("layers/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLayerById(@PathParam("id") String id) {
        JSONArray arr = DataUtils.getLayers(id);
        return Response.ok( arr ).build();
    }
    
    @POST
    @Path("layers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response addLayer(String content) {
        JSONArray layers;
        try {
            layers = new JSONArray(content);
            JSONArray arr = addLayer(layers);
            return Response.ok( arr ).build();
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
                JSONArray categories = DataUtils.getCategories();
                for (int i = 0; i < categories.length(); i++) {
                    JSONObject category = categories.getJSONObject(i);
                    String catId = category.getString("id");
                    JSONArray cat = DataUtils.getCategoryTree(catId);
                    for (int j = 0; j < cat.length(); j++) {
                        JSONObject catItem = cat.getJSONObject(j);
                        updateCategoryLayersId(catItem, id, newId);
                    }
                    updateCategoryTree(catId, cat);
                }
            }
            JSONObject obj = updateLayer(id, layer);
            if(obj != null) {
                return Response.ok( obj ).build();
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
        return Response.ok( arr ).build();
    }
    
    @DELETE
    @Path("layers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteLayersByIds(@QueryParam("ids") String paramIds) {
        String[] ids = paramIds.split(",");
        JSONArray arr = deleteLayers(ids);
        return Response.ok( arr ).build();
    }
    
    @DELETE
    @Path("layers/all")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteLayersAll() {
        JSONArray arr = deleteLayers();
        return Response.ok( arr ).build();
    }

    /* Categories */
    @GET
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoriesList() {
        JSONArray arr = DataUtils.getCategories();
        return Response.ok( arr ).build();
    }
    

    @GET
    @Path("categories/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoryById(@PathParam("id") String id) {
        JSONArray arr = DataUtils.getCategoryTree(id);
        return Response.ok( arr ).build();
    }

    @GET
    @Path("categories/layer/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoryByLayerId(@PathParam("id") String id, @QueryParam("isExpanded") boolean isExpanded) {
        JSONArray categoriesWithLayerId = DataUtils.getCategoryByLayerId(id, isExpanded);
        return Response.ok( categoriesWithLayerId ).build();
    }

    @POST
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response addCategory(String content) {
        JSONObject category;
        try {
            category = new JSONObject(content);
            JSONArray arr = addCategory(category);
            return Response.ok( arr ).build();
        } catch (JSONException e) {
            log.error("Error POST '/categories'!");
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @POST
    @Path("categories/{copyId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response copyCategory(String content, @PathParam("copyId") String copyId) {
        if(copyId != null) {
            JSONObject category;
            try {
                category = new JSONObject(content);
                String categoryId = category.getString("id");
                if(categoryId != null) {
                    Properties p = ConfigurationProvider.INSTANCE.getProperties();
                    String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                    if(StringUtils.isNotEmpty(configDir)) {
                        String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_PREFIX_CATALOG + copyId, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                        if(StringUtils.isNotEmpty(fileContent)) {
                            Utils.createFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + categoryId + DataUtils.FILEFORMAT_JSON, new JSONObject(fileContent));
                        }
                    }
                }
            } catch (JSONException e) {
                log.error("Error POST '/categories'!");
            }
            return this.addCategory(content);
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
            return Response.ok( arr ).build();
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
        return Response.ok( arr ).build();
    }
    
    @DELETE
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCategoriesByIds(@QueryParam("ids") String paramIds) {
        String[] ids = paramIds.split(",");
        JSONArray arr = deleteCategories(ids);
        return Response.ok( arr ).build();
    }

    @DELETE
    @Path("categories/all")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCategoriesAll() {
        JSONArray arr = deleteCategories();
        return Response.ok( arr ).build();
    }
    
    @PUT
    @Path("categorytree/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateCategoryTree(@RequestBody String content, @PathParam("id") String id) {
        try {
            JSONArray item = new JSONArray(content);
            JSONArray arr = updateCategoryTree(id, item);
            return Response.ok( arr ).build();
        } catch (JSONException e) {
            log.error("Error POST '/categorytree/{id}'!");
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("setting")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSettingRequest() {
        ConfigResource cr = new ConfigResource();
        Response localeResponse = cr.getSettingRequest(true);
        if(localeResponse != null) {
            return localeResponse;
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("setting")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateSetting(@RequestBody String content) {
        try {
            JSONObject setting = null;
            JSONObject settingProfile = new JSONObject(content);
            String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            String fileSetting = classPath + "frontend/";
            String fileContent = Utils.getFileContent(fileSetting, "setting", DataUtils.FILEFORMAT_JSON, "config/");
            if(StringUtils.isNotEmpty(fileContent)) {
                setting = new JSONObject(fileContent);
                if(setting != null) {
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
                }
            }
            updateSetting(settingProfile);
            if(settingProfile.has("settingLanguages")) {
                JSONArray settingLanguages = settingProfile.getJSONArray("settingLanguages");
                for (int i = 0; i < settingLanguages.length(); i++) {
                    String lang = settingLanguages.getString(i);
                    if(lang != null) {
                        Response langResponse = this.getHelpRequest(lang);
                        if(langResponse.getEntity().toString().equals("{}")) {
                            this.updateHelp(lang, this.getHelpRequest("de").getEntity().toString());
                        }
                        ConfigResource cr = new ConfigResource();
                        Response localeResponse = cr.getLocales(lang+ DataUtils.FILEFORMAT_JSON, false);
                        if(localeResponse.getEntity().toString().equals("{}")) {
                            this.updateLocale(lang, cr.getLocales("de.json", false).getEntity().toString());
                        }
                    }
                }
            } 
            return getSettingRequest();
        } catch (JSONException e) {
            log.error("Error PUT '/setting'!");
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("setting/reset")
    @Produces(MediaType.APPLICATION_JSON)
    public Response resetSetting(@RequestBody String content) {
        updateSetting(new JSONObject());
        return this.getSettingRequest();
    }

    @GET
    @Path("css")
    @Produces("text/css")
    public Response getCssRequest() {
        ConfigResource cr = new ConfigResource();
        return cr.getCssRequest();
    }

    @PUT
    @Path("css")
    @Produces(MediaType.TEXT_PLAIN)
    public Response updateCssRequest(@RequestBody String content) {
        if(content != null) {
            updateCss(content);
            return Response.status(Response.Status.OK ).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("help/{lang}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getHelpRequest(@PathParam("lang") String lang) {
        try {
            if(lang != null) {
                String filename = DataUtils.FILE_PREFIX_HELP + lang;
                if(log.isDebugEnabled()){
                    log.debug( "Load file: " + filename );
                }
                
                JSONObject help = new JSONObject();
                if(log.isDebugEnabled()){
                    log.debug( "Load file: " + filename );
                }
                String classPath = "";
                classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
                String filePathHelp = classPath + "frontend/";
                String fileContent = Utils.getFileContent(filePathHelp, filename, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                if(StringUtils.isNotEmpty(fileContent)) {
                    help = new JSONObject(fileContent);
                }
                
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                if(StringUtils.isNotEmpty(configDir)) {
                    fileContent = Utils.getFileContent(configDir, filename + DataUtils.FILE_PREFIX_PROFILE, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                    if(StringUtils.isEmpty(fileContent)) {
                        fileContent = Utils.getFileContent(filePathHelp, filename + DataUtils.FILE_PREFIX_PROFILE, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                        if(StringUtils.isNotEmpty(fileContent)) {
                            Utils.updateFile(DataUtils.CONFIG_PATH_HELP+ filename + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, fileContent);
                        }
                    }
                    if(StringUtils.isNotEmpty(fileContent)) {
                        JSONObject profileHelp = new JSONObject(fileContent);
                        Iterator<?> keys = profileHelp.keys();
                        while( keys.hasNext() ) {
                            String key = (String)keys.next();
                            if (profileHelp.has(key)) {
                                help.put(key, profileHelp.get(key));
                            }
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
    @Produces(MediaType.TEXT_HTML)
    public Response getHelpIdRequest(@PathParam("lang") String lang, @PathParam("id") String id) {
        if(lang != null) {
            String filename = DataUtils.FILE_PREFIX_HELP + lang;
            if(StringUtils.isNotEmpty(filename)){
                if(log.isDebugEnabled()){
                    log.debug( "Load file: " + filename );
                }
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                String urlPathPrefix = p.getProperty( ConfigurationProvider.URL_PATH_PREFIX, "").trim();
                if(StringUtils.isNotEmpty(configDir)) {
                    Response helps = this.getHelpRequest(lang);
                    if(helps != null && helps.getEntity() != null) {
                        String fileContent = helps.getEntity().toString();
                        if(fileContent != null) {
                            try {
                                JSONObject obj = new JSONObject(fileContent);
                                String[] ids = id.split(",");
                                String innerHtml = "";
                                innerHtml += "<html lang=\"de\">";
                                innerHtml += "<head>";
                                innerHtml += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"/>";
                                innerHtml += "<link rel=\"stylesheet\" href=\""+ urlPathPrefix + "/ingrid-webmap-client/frontend/prd/style/app.css?v=\">";
                                innerHtml += "<link rel=\"stylesheet\" href=\""+ urlPathPrefix + "/ingrid-webmap-client/frontend/css/app.override.css\">";
                                innerHtml += "<link rel=\"stylesheet\" href=\""+ urlPathPrefix + "/ingrid-webmap-client/frontend/css/app.layout.override.css\">";
                                innerHtml += "<link href=\""+ urlPathPrefix + "/ingrid-webmap-client/rest/config/css\" rel=\"stylesheet\">";
                                innerHtml += "</head>";
                                innerHtml += "<body style=\"overflow: auto;\"><div id=\"app\" class=\"view\"><div id=\"content\" class=\"popover-content ga-popup-content\">";
                                for (String tmpId : ids) {
                                    JSONObject jsonObjId = obj.getJSONObject(tmpId);
                                    if(jsonObjId != null){
                                        String title = jsonObjId.getString( DataUtils.HELP_KEY_TITLE );
                                        String text = jsonObjId.getString( DataUtils.HELP_KEY_TEXT );
                                        String image = jsonObjId.getString( DataUtils.HELP_KEY_IMAGE );
                                        
                                        if(title != null) {
                                            innerHtml += "<h2>" + title + "</h2>";
                                        }
                                        if(text != null) {
                                            innerHtml += "<div>" + text + "</div>";
                                        }
                                        if(image != null) {
                                            innerHtml += "<br>";
                                            innerHtml += "<img src=\"" + image +"\" draggable=\"false\"/>";
                                        }
                                    }
                                }
                                innerHtml += "</div></div></body></html>";
                                return Response.ok( innerHtml ).build();
                            } catch (JSONException e) {
                                log.error("Error get help with ID " + id);
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
            if(StringUtils.isNotEmpty(fileContent)) {
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
            if(StringUtils.isNotEmpty(fileContent)) {
                return this.getHelpRequest(lang);
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("locales/{locale}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLocales(@PathParam("locale") String locale) throws JSONException {
        ConfigResource cr = new ConfigResource();
        return cr.getLocales(locale + DataUtils.FILEFORMAT_JSON, false);
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

    @POST
    @Path("auth")
    @Produces(MediaType.TEXT_PLAIN)
    public Response addServiceAuth(String content) {
        String login = null; 
        String password = null;
        String url = null;
        boolean overrideLogin = false;
        try {
            JSONObject obj = new JSONObject(content);
            if(obj.has("url")) {
                url = obj.getString("url");
            }
            if(obj.has("login")) {
                login = obj.getString("login");
            }
            if(obj.has("password")) {
                password = obj.getString("password");
            }
            if(obj.has("overrideLogin")) {
                overrideLogin = obj.getBoolean("overrideLogin");
            }
            if(StringUtils.isNotEmpty(login) && StringUtils.isNotEmpty(password)) {
                try {
                    String existPassword = Utils.getServiceLogin(url, login);
                    if(StringUtils.isEmpty(existPassword) || overrideLogin) {
                        Utils.setServiceLogin(url, login, password);
                    }
                } catch (Exception e) {
                    log.error("Error 'service.auth.json'!");
                }
                return Response.status( Response.Status.OK ).build();
            }
        } catch (Exception e) {
            log.error( "Error sending WMS request: " + url, e );
        }
        return Response.status( Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @GET
    @Path("image/{path}/{id}")
    @Produces("image/png")
    public Response getImageRequest(@PathParam("path") String path, @PathParam("id") String id) {
        
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configPath = p.getProperty( ConfigurationProvider.CONFIG_DIR, "./" ).trim();
        
        if(!configPath.endsWith( "/" )){
            configPath = configPath.concat( "/" ); 
        }
        File imageDir = new File(configPath + "img");
        if(!imageDir.exists()){
            imageDir.mkdirs();
        }
        
        File imageSubDir = new File(imageDir, path);
        if(!imageSubDir.exists()){
            imageSubDir.mkdirs();
        }
        File[] files = imageSubDir.listFiles();
        for(File file:files) {
            if(file.getName().startsWith(id +".")){
                return Response.ok(file).build();
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }

    @PUT
    @Path("image")
    public Response addImageRequest(@RequestBody String content) {
        try {
            JSONObject imageJSON = new JSONObject(content);
            if(imageJSON.has("data") && imageJSON.has("path") && imageJSON.has("name")) {
                String data = imageJSON.getString("data");
                String name = imageJSON.getString("name");
                String path = imageJSON.getString("path");
                
                String[] parts = data.split(",");
                String imageString = parts[1];

                // create a buffered image
                BufferedImage image = null;
                byte[] imageByte;

                imageByte = Base64.getDecoder().decode(imageString);
                ByteArrayInputStream bis = new ByteArrayInputStream(imageByte);
                image = ImageIO.read(bis);
                bis.close();

                // write the image to a file
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR, "./" ).trim();
                String urlPathPrefix = p.getProperty( ConfigurationProvider.URL_PATH_PREFIX, "").trim();
                
                if(!configDir.endsWith( "/" )){
                    configDir = configDir.concat( "/" ); 
                }
                File imageDir = new File(configDir + "img");
                if(!imageDir.exists()){
                    imageDir.mkdirs();
                }
                
                File imageSubDir = new File(imageDir, path);
                if(!imageSubDir.exists()){
                    imageSubDir.mkdirs();
                }
                File[] files = imageSubDir.listFiles();
                for(File file:files) {
                    if(file.getName().startsWith(name+".") && file.delete()) {
                       log.debug("Delete file: " + file.getName());
                    }
                }
                String fileFormat = "png";
                String fileFormatData = parts[0];
                if (fileFormatData != null) {
                    Pattern pattern = Pattern.compile("image\\/(.*);");
                    Matcher matcher = pattern.matcher(fileFormatData);
                    if (matcher.find()) {
                        fileFormat = matcher.group(1);
                    }
                }
                File outputfile = new File(imageSubDir, name + "." + fileFormat);
                ImageIO.write(image, fileFormat, outputfile);
                // Update css
                if(path.equals("category")) {
                    String css = Utils.getFileContent(configDir, "app.profile", ".css", "css/");
                    if(css.indexOf(".ga-topics-sprite-" + name) == -1) {
                        css = css + "\n[ga-topic] .ga-topics-sprite-" + name + " {\n" + 
                                "  background: url(\""+ urlPathPrefix + "/ingrid-webmap-client/rest/data/images/" + path + "/" + name + "\");\n" + 
                                "  width: 140px;\n" + 
                                "}";
                        this.updateCss(css);
                    }
                } else if(path.equals("background")) {
                    String css = Utils.getFileContent(configDir, "app.profile", ".css", "css/");
                    if(css.indexOf("[ga-background-selector] .ga-" + name) == -1) {
                        css = css + "\n@media (max-width: 768px) {\n" + 
                                "[ga-background-selector] .ga-" + name + " {\n" + 
                                "  background: url(\""+ urlPathPrefix + "/ingrid-webmap-client/rest/data/images/" + path + "/" + name + "\");\n" + 
                                "  background-size: 38px 38px;\n" + 
                                "}\n" +
                                "}";
                        css = css + "\n@media (min-width: 769px) {\n" + 
                                "[ga-background-selector] .ga-" + name + " {\n" + 
                                "  background: url(\""+ urlPathPrefix + "/ingrid-webmap-client/rest/data/images/" + path + "/" + name + "\");\n" + 
                                "  background-size: 90px 58px;\n" + 
                                "}\n" +
                                "}";
                        this.updateCss(css);
                    }
                }
            }
            return Response.status( Response.Status.OK ).build();
        } catch (JSONException | IOException e) {
            log.error("Error PUT '/image'!", e);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR ).build();
    }
    
    private void updateLocale(String lang, String content) throws JSONException {
        JSONObject localeProfile = null;
        JSONObject localeDefault = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        JSONObject item = new JSONObject(content);
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, lang + DataUtils.FILE_PREFIX_PROFILE, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_LOCALES);
            if(StringUtils.isNotEmpty(fileContent)) {
                localeProfile = new JSONObject(fileContent);
                ConfigResource cr = new ConfigResource();
                Response localeResponse = cr.getLocales(lang+ DataUtils.FILEFORMAT_JSON, true);
                if(localeResponse != null) {
                    localeDefault = new JSONObject(localeResponse.getEntity().toString());
                }
                
                Iterator<?> keys = item.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    if (item.has(key)) {
                        String value = item.getString(key);
                        String valueDefault = "";
                        if(localeDefault != null && localeDefault.has(key)) {
                            valueDefault = localeDefault.getString(key);
                        }
                        if(value.trim().equals(valueDefault.trim())) {
                            localeProfile.remove(key);
                        } else {
                            localeProfile.put(key, item.get(key));
                        }
                    }
                }
                Utils.updateFile(DataUtils.CONFIG_PATH_LOCALES + lang + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, localeProfile);
            } else {
                Utils.updateFile(DataUtils.CONFIG_PATH_LOCALES + lang + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, item);
            }
        }
    }

    private void deleteLocale(String lang, ArrayList<String> keys) throws JSONException {
        JSONObject locale = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, lang, DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_LOCALES);
            if(StringUtils.isNotEmpty(fileContent)) {
                locale = new JSONObject(fileContent);
                for (String key : keys) {
                    if(locale.has(key)) {
                        locale.remove(key);
                    }
                }
                Utils.updateFile(DataUtils.CONFIG_PATH_LOCALES + lang + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, locale);
            }
        }
    }

    private JSONArray updateCategoryTree(String id, JSONArray item) {
        JSONArray arr = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_PREFIX_CATALOG + id, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
                    arr = new JSONArray();
                    JSONObject results = obj.getJSONObject("results");
                    JSONObject root = results.getJSONObject("root");
                    root.put(DataUtils.CATEGORY_KEY_CHILDREN, item);
                    cleanupCategory(item);
                    Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + id + DataUtils.FILEFORMAT_JSON, obj);
                    return item;
                } catch (Exception e) {
                    log.error("Error 'updateCategoryTree'!");
                }
            }
        }
        return arr;
    }

    private void cleanupCategory(JSONArray items) {
        for (int i = 0; i < items.length(); i++) {
            try {
                JSONObject item = items.getJSONObject(i);
                if(item.has(DataUtils.CATEGORY_KEY_CHILDREN)) {
                    JSONArray children =  item.getJSONArray(DataUtils.CATEGORY_KEY_CHILDREN);
                    if(children.length() > 0) {
                        cleanupCategory(children);
                    } else {
                        item.remove(DataUtils.CATEGORY_KEY_CHILDREN);
                    }
                }
            } catch (JSONException e) {
                log.error("Error cleanup category items.");
            }
        }
    }

    private void updateSetting(JSONObject item) {
        try {
            Utils.updateFile("config/setting.profile.json", item);
        } catch (Exception e) {
            log.error("Error 'updateSetting'!");
        }
    }
    
    private void updateCss(String content) {
        try {
            Utils.updateFile("css/app.profile.css", content);
        } catch (Exception e) {
            log.error("Error 'updateCss'!");
        }
    }
    
    private String updateHelp(String lang, String content) {
        JSONObject help = null;
        JSONObject profileHelp = null;
        try {
            String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            if(classPath != null) {
                String filePathHelp = classPath + "frontend/";
                String fileContent = Utils.getFileContent(filePathHelp, DataUtils.FILE_PREFIX_HELP + lang, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                if(StringUtils.isNotEmpty(fileContent)) {
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
                        if(helpItem.has(DataUtils.HELP_KEY_TITLE) && helpProfileItem.has(DataUtils.HELP_KEY_TITLE) && helpItem.getString(DataUtils.HELP_KEY_TITLE).equals(helpProfileItem.getString(DataUtils.HELP_KEY_TITLE)) 
                            && helpItem.has(DataUtils.HELP_KEY_TEXT) && helpProfileItem.has(DataUtils.HELP_KEY_TEXT) && helpItem.getString(DataUtils.HELP_KEY_TEXT).equals(helpProfileItem.getString(DataUtils.HELP_KEY_TEXT))
                            && helpItem.has(DataUtils.HELP_KEY_IMAGE) && helpProfileItem.has(DataUtils.HELP_KEY_IMAGE) &&  helpItem.getString(DataUtils.HELP_KEY_IMAGE).equals(helpProfileItem.getString(DataUtils.HELP_KEY_IMAGE))){
                            profileHelp.remove(key);
                        }
                    }
                }
                Utils.updateFile(DataUtils.CONFIG_PATH_HELP + DataUtils.FILE_PREFIX_HELP + lang + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, profileHelp.toString());
            }
            return content;
        } catch (Exception e) {
            log.error("Error write profile help: " + e);
        }
        return "";
    }

    private String resetHelp(String lang, String id) {
        try {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_PREFIX_HELP + lang + DataUtils.FILE_PREFIX_PROFILE, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                if(StringUtils.isNotEmpty(fileContent)) {
                    JSONObject profileHelp = new JSONObject(fileContent);
                    if(profileHelp.has(id)) {
                        profileHelp.remove(id);
                    }
                    Utils.updateFile(DataUtils.CONFIG_PATH_HELP + DataUtils.FILE_PREFIX_HELP + lang + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, profileHelp.toString());
                    return profileHelp.toString();
                }
            }
        } catch (Exception e) {
            log.error("Error reset help: " + e);
        }
        
        return "";
    }
    

    private JSONArray addLayer(JSONArray layers) {
        if(layers != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_LAYERS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                if(StringUtils.isNotEmpty(fileContent)) {
                    try {
                        JSONObject newObj = new JSONObject();
                        JSONObject obj = new JSONObject(fileContent);
                        for (int i = 0; i < layers.length(); i++) {
                            JSONObject tmpObj = layers.getJSONObject(i);
                            String id = tmpObj.getString("id");
                            if(obj.has(id)) {
                                id = generateID(obj, id);
                            }
                            JSONObject tmpItem = tmpObj.getJSONObject("item");
                            if(tmpItem.has("wmsLayers") || tmpItem.has("serverLayerName")) {
                                newObj.put(id, tmpItem);
                            }
                        }
                        Iterator<?> keys = obj.keys();
                        while( keys.hasNext() ) {
                            String key = (String)keys.next();
                            newObj.put(key, obj.getJSONObject(key));
                        }
                        Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_LAYERS + DataUtils.FILEFORMAT_JSON, newObj);
                    } catch (JSONException e) {
                        log.error("Error 'updateLayer'!");
                    }
                }
            }
        }
        return DataUtils.getLayers(null);
    }
    
    private String generateID(JSONObject obj, String id) throws JSONException {
        if(obj.has(id)){
            id = generateID(obj, id + "_");
        }
        return id.replace(".", "_");
    }

    private JSONObject updateLayer(String id, JSONObject layer) {
        if(id != null && layer != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_LAYERS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                if(StringUtils.isNotEmpty(fileContent)) {
                    try {
                        JSONObject obj = new JSONObject(fileContent);
                        JSONObject layerItem = layer.getJSONObject("item");
                        if(layerItem.has(Constants.LAYER_STATUS)) {
                            String status = layerItem.getString(Constants.LAYER_STATUS);
                            String version = null;
                            if(layerItem.has(Constants.LAYER_VERSION)) {
                                version = layerItem.getString(Constants.LAYER_VERSION);
                            }
                            String layername = null;
                            if(layerItem.has(Constants.WMS_LAYERNAME)) {
                                layername = layerItem.getString(Constants.WMS_LAYERNAME);
                            }
                            if(layerItem.has(Constants.WMTS_LAYERNAME)) {
                                layername = layerItem.getString(Constants.WMTS_LAYERNAME);
                            }
                            String url = null;
                            if(layerItem.has(Constants.WMS_URL)) {
                                url = layerItem.getString(Constants.WMS_URL);
                                if(url.indexOf( '?' ) == -1){
                                    url += "?";
                                }
                                if(url.toLowerCase().indexOf( "service=" )  == -1){
                                    url += "&SERVICE=WMS";
                                }
                                if(url.toLowerCase().indexOf( "request=" )  == -1){
                                    url += "&REQUEST=GetCapabilities";
                                }
                                if(url.toLowerCase().indexOf( "version=" )  == -1){
                                    if(version == null) {
                                        url += "&VERSION=1.3.0";
                                    } else {
                                        url += "&VERSION=" + version;
                                    }
                                }
                            }
                            if(layerItem.has(Constants.WMTS_URL)) {
                                url = layerItem.getString(Constants.WMTS_URL);
                            }
                            if(status != null && layername != null && url != null) {
                                try {
                                    GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest( url );
                                    if(getCapabilities != null) {
                                        Document doc =  (Document) getCapabilities.getDoc();
                                        XPath xpath = XPathFactory.newInstance().newXPath();
                                        Node layerNode = (Node) xpath.evaluate("//Layer/Name[text()=\""+layername+"\"]/..", doc, XPathConstants.NODE);
                                        if(layerNode == null) {
                                            layerNode = (Node) xpath.evaluate("//Layer/Identifier[text()=\""+layername+"\"]/..", doc, XPathConstants.NODE);
                                        }
                                        switch (status) {
                                        case Constants.STATUS_LAYER_NOT_EXIST:
                                            if(layerNode != null) {
                                                layerItem.remove(Constants.LAYER_STATUS);
                                            }
                                            break;
                                        case Constants.STATUS_SERVICE_NOT_EXIST:
                                            if(layerNode != null) {
                                                layerItem.remove(Constants.LAYER_STATUS);
                                            }
                                            break;
                                        default:
                                            break;
                                        }
                                    }
                                } catch (Exception e) {
                                   layerItem.put(Constants.LAYER_STATUS, Constants.STATUS_SERVICE_NOT_EXIST);
                                }
                            }
                        }
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
                        Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_LAYERS + DataUtils.FILEFORMAT_JSON, obj);
                    } catch (JSONException e) {
                        log.error("Error 'updateLayer'!");
                    }
                }
            }
        }
        return layer;
    }
    
    private JSONArray deleteLayers() {
        return deleteLayers(null);
    }
    
    private JSONArray deleteLayers(String[] ids) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_LAYERS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if(StringUtils.isNotEmpty(fileContent)) {
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
                    Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_LAYERS + DataUtils.FILEFORMAT_JSON, obj);
                } catch (JSONException e) {
                    log.error("Error 'deleteLayer'!");
                }
            }
        }
        return DataUtils.getLayers(null, true);
    }
    
    private void removeLayersFromCategories(String[] ids) {
        JSONArray categories = DataUtils.getCategories();
        for (int i = 0; i < categories.length(); i++) {
            try {
                JSONObject category = categories.getJSONObject(i);
                String catId = category.getString("id");
                JSONArray cat = DataUtils.getCategoryTree(catId);
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
            if(item.has(DataUtils.LAYER_KEY_LAYERBODID)) {
                String layerBodId = item.getString(DataUtils.LAYER_KEY_LAYERBODID);
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
                if(item.has(DataUtils.CATEGORY_KEY_CHILDREN)) {
                    JSONArray children = item.getJSONArray(DataUtils.CATEGORY_KEY_CHILDREN);
                    if(children != null) {
                        JSONArray childList = new JSONArray();
                        for (int j = 0; j < children.length(); j++) {
                            JSONObject catItem = children.getJSONObject(j);
                            removeLayerFromCategory(ids, catItem, childList);
                        }
                        obj.put(DataUtils.CATEGORY_KEY_CHILDREN, childList);
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

    private JSONArray addCategory(JSONObject catelog) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_CATALOGS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
                    JSONObject rootItem = new JSONObject();
                    rootItem.put("category", "root");
                    rootItem.put("staging", "prod");
                    rootItem.put("id", 1);
                    rootItem.put(DataUtils.CATEGORY_KEY_CHILDREN, new JSONArray());
                    JSONObject root = new JSONObject();
                    root.put("root", rootItem);
                    JSONObject results = new JSONObject();
                    results.put("results", root);
                    Utils.createFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + catelog.getString("id") + DataUtils.FILEFORMAT_JSON, results);
                    obj.getJSONArray(DataUtils.CATEGORY_KEY_TOPICS).put(catelog);
                    Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_CATALOGS + DataUtils.FILEFORMAT_JSON, obj);
                } catch (JSONException e) {
                    log.error("Error 'addCategory'!");
                }
            }
        }
        return DataUtils.getCategories();
    }
    
    private JSONArray updateCategory(String id, JSONObject item) {
        if(id != null && item != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_CATALOGS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                if(StringUtils.isNotEmpty(fileContent)) {
                    try {
                        JSONObject obj = new JSONObject(fileContent);
                        JSONArray topics = obj.getJSONArray(DataUtils.CATEGORY_KEY_TOPICS);
                        for (int i = 0; i < topics.length(); i++) {
                            JSONObject tmpObj = topics.getJSONObject(i);
                            if(tmpObj.getString("id").equals(id)) {
                                topics.put(i, item);
                                break;
                            }
                        }
                        Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_CATALOGS + DataUtils.FILEFORMAT_JSON, obj);
                    } catch (JSONException e) {
                        log.error("Error 'updateCategory'!");
                    }
                }
            }
        }
        return DataUtils.getCategories();
    }

    private JSONArray deleteCategory(String id) {
        if(id != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_CATALOGS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                if(StringUtils.isNotEmpty(fileContent)) {
                    try {
                        JSONObject obj = new JSONObject(fileContent);
                        JSONArray topics = obj.getJSONArray(DataUtils.CATEGORY_KEY_TOPICS);
                        JSONArray newTopics = new JSONArray();
                        for (int i = 0; i < topics.length(); i++) {
                            JSONObject tmpObj = topics.getJSONObject(i);
                            if(!tmpObj.getString("id").equals(id)) {
                                newTopics.put(tmpObj);
                            }
                        }
                        obj.put(DataUtils.CATEGORY_KEY_TOPICS, newTopics);
                        Utils.removeFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + id +DataUtils.FILEFORMAT_JSON);
                        Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_CATALOGS + DataUtils.FILEFORMAT_JSON, obj);
                        deleteCategoriesLocales(id);
                    } catch (JSONException e) {
                        log.error("Error 'deleteCategory'!");
                    }
                }
            }
        }
        return DataUtils.getCategories();
    }

    private void deleteCategoriesLocales(String id) throws JSONException {
        ArrayList<String> list = new ArrayList<>();
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
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_CATALOGS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
                    JSONArray topics = obj.getJSONArray(DataUtils.CATEGORY_KEY_TOPICS);
                    JSONArray newTopics = new JSONArray();
                    for (int i = 0; i < topics.length(); i++) {
                        JSONObject tmpObj = topics.getJSONObject(i);
                        boolean toDelete = false;
                        if(ids != null) {
                            for (String id : ids) {
                                if(id != null && id.length() > 0 && tmpObj.getString("id").equals(id)) {
                                    Utils.removeFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + id +DataUtils.FILEFORMAT_JSON);
                                    deleteCategoriesLocales(id);
                                    toDelete = true;
                                    break;
                                }
                            }
                        } else {
                            String id = tmpObj.getString("id");
                            Utils.removeFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + id +DataUtils.FILEFORMAT_JSON);
                            deleteCategoriesLocales(id);
                            toDelete = true;
                        }
                        if(!toDelete) {
                            newTopics.put(tmpObj);
                        }
                    }
                    obj.put(DataUtils.CATEGORY_KEY_TOPICS, newTopics);
                    Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_CATALOGS + DataUtils.FILEFORMAT_JSON, obj);
                } catch (JSONException e) {
                    log.error("Error 'deleteLayer'!");
                }
            }
        }
        return DataUtils.getCategories();
    }

    private void updateCategoryLayersId(JSONObject catItem, String id, String newId) throws JSONException {
        String key = DataUtils.LAYER_KEY_LAYERBODID;
        if(!catItem.isNull(key)) {
            String layerBodId = catItem.getString(key);
            if(layerBodId != null && layerBodId.equals(id)) {
                catItem.put(DataUtils.LAYER_KEY_LAYERBODID, newId);
            }
        }
        
        key = DataUtils.CATEGORY_KEY_CHILDREN;
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
}
