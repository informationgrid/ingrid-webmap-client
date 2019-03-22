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

import java.io.StringReader;
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
import javax.xml.parsers.DocumentBuilderFactory;
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
import org.xml.sax.InputSource;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.Constants;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.utils.Utils;;

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
        String[] searchTextKeys = {"label", "id", "wmsUrl", "serviceUrl"};
        String[] searchTypeKeys = {"type"};
        String[] searchHasStatusKeys = {"status"};
        if(currentPage == null && layersPerPage == null) {
            // Get layer list compress
            JSONArray arr = getLayers(null, true);
            if(arr != null) {
                // Check search text
                if(searchText != null && searchText.length() > 0) {
                    arr = getFilterArrayString(arr, searchText, searchTextKeys);
                }
                // Check search type
                if(searchType != null && searchType.length() > 0) {
                    arr = getFilterArrayString(arr, searchType, searchTypeKeys);
                }
                // Check has state
                if(hasStatus) {
                    arr = getFilterArrayBoolean(arr, hasStatus, searchHasStatusKeys);
                }
                // Check has category
                if(searchCategory != null && searchCategory.length() > 0) {
                    arr = getFilterCategory(arr, searchCategory);
                }
                return Response.ok( arr ).build();
            }
        } else {
            // Get paging layer list compress
            JSONArray arr = getLayers(null);
            if(arr != null) {
                // Check search text
                if(searchText != null && searchText.length() > 0) {
                    arr = getFilterArrayString(arr, searchText, searchTextKeys);
                }
                // Check search type
                if(searchType != null && searchType.length() > 0) {
                    arr = getFilterArrayString(arr, searchType, searchTypeKeys);
                }
                // Check has state
                if(hasStatus) {
                    arr = getFilterArrayBoolean(arr, hasStatus, searchHasStatusKeys);
                }
                // Check has category
                if(searchCategory != null && searchCategory.length() > 0) {
                    arr = getFilterCategory(arr, searchCategory);
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

    @GET
    @Path("categories/layer/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoryByLayerId(@PathParam("id") String id, @QueryParam("isExpanded") boolean isExpanded) {
        JSONArray categoriesWithLayerId = new JSONArray();
        JSONArray categories = getCategories();
        if(categories != null) {
            for (int i = 0; i < categories.length(); i++) {
                try {
                    JSONObject category = categories.getJSONObject(i);
                    if(category != null && category.has("id")) {
                        String categoryId = category.getString("id");
                        JSONArray categoryTree = getCategoryTree(categoryId);
                        if(categoryTree != null) {
                            JSONArray filterCategoryTree = new JSONArray();
                            filteredTreeLeafById(categoryTree, id, filterCategoryTree, isExpanded);
                            if(filterCategoryTree.length() > 0) {
                                JSONObject filterCategory = new JSONObject();
                                filterCategory.put("label", categoryId);
                                filterCategory.put("children", filterCategoryTree);
                                categoriesWithLayerId.put(filterCategory);
                            }
                        }
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }
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
            if(arr != null) {
                return Response.ok( arr ).build();
            }
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
                        String fileContent = Utils.getFileContent(configDir, "catalog-" + copyId, ".json", "data/");
                        if(StringUtils.isNotEmpty(fileContent)) {
                            Utils.createFile("data/catalog-" + categoryId + ".json", new JSONObject(fileContent));
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
            String fileContent = Utils.getFileContent(fileSetting, "setting", ".json", "config/");
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
                        Response localeResponse = cr.getLocales(lang+ ".json", false);
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
        ConfigResource cr = new ConfigResource();
        return cr.getCssRequest();
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
                if(StringUtils.isNotEmpty(fileContent)) {
                    help = new JSONObject(fileContent);
                }
                
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                if(StringUtils.isNotEmpty(configDir)) {
                    fileContent = Utils.getFileContent(configDir, filename + ".profile", ".json", "help/");
                    if(StringUtils.isEmpty(fileContent)) {
                        fileContent = Utils.getFileContent(filePathHelp, filename + ".profile", ".json", "help/");
                        if(StringUtils.isNotEmpty(fileContent)) {
                            Utils.updateFile("help/"+ filename + ".profile.json", fileContent);
                        }
                    }
                    if(StringUtils.isNotEmpty(fileContent)) {
                        profileHelp = new JSONObject(fileContent);
                        if(help != null && profileHelp != null) {
                            Iterator<?> keys = profileHelp.keys();
                            while( keys.hasNext() ) {
                                String key = (String)keys.next();
                                if (profileHelp.has(key)) {
                                    help.put(key, profileHelp.get(key));
                                }
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
    @Produces(MediaType.APPLICATION_JSON)
    public Response getHelpIdRequest(@PathParam("lang") String lang, @PathParam("id") String id) {
        if(lang != null) {
            String filename = "help-" + lang;
            if(filename != null && filename.length() > 0){
                if(log.isDebugEnabled()){
                    log.debug( "Load file: " + filename );
                }
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                if(StringUtils.isNotEmpty(configDir)) {
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
        return cr.getLocales(locale + ".json", false);
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
            if(obj != null) {
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

    private void updateLocale(String lang, String content) throws JSONException {
        JSONObject localeProfile = null;
        JSONObject localeDefault = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        JSONObject item = new JSONObject(content);
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, lang + ".profile", ".json", "locales/");
            if(StringUtils.isNotEmpty(fileContent)) {
                localeProfile = new JSONObject(fileContent);
                ConfigResource cr = new ConfigResource();
                Response localeResponse = cr.getLocales(lang+ ".json", true);
                if(localeResponse != null) {
                    localeDefault = new JSONObject(localeResponse.getEntity().toString());
                }
                
                if(item != null && localeProfile != null) {
                    Iterator<?> keys = item.keys();
                    while( keys.hasNext() ) {
                        String key = (String)keys.next();
                        if (item.has(key)) {
                            String value = item.getString(key);
                            String valueDefault = "";
                            if(localeDefault != null) {
                                if(localeDefault.has(key)) {
                                    valueDefault = localeDefault.getString(key);
                                }
                            }
                            if(value.trim().equals(valueDefault.trim())) {
                                localeProfile.remove(key);
                            } else {
                                localeProfile.put(key, item.get(key));
                            }
                        }
                    }
                    Utils.updateFile("locales/" + lang + ".profile.json", localeProfile);
                }
            } else if(item != null) {
                Utils.updateFile("locales/" + lang + ".profile.json", item);
            }
        }
    }

    private void deleteLocale(String lang, ArrayList<String> keys) throws JSONException {
        JSONObject locale = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, lang, ".profile.json", "locales/");
            if(StringUtils.isNotEmpty(fileContent)) {
                locale = new JSONObject(fileContent);
                if(locale != null) {
                    for (String key : keys) {
                        if(locale.has(key)) {
                            locale.remove(key);
                        }
                    }
                    Utils.updateFile("locales/" + lang + ".profile.json", locale);
                }
            }
        }
    }

    private JSONArray updateCategoryTree(String id, JSONArray item) {
        JSONArray arr = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "catalog-" + id, ".json", "data/");
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
                    arr = new JSONArray();
                    JSONObject results = obj.getJSONObject("results");
                    JSONObject root = results.getJSONObject("root");
                    root.put("children", item);
                    cleanupCategory(item);
                    Utils.updateFile("data/catalog-" + id + ".json", obj);
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
                if(item.has("children")) {
                    JSONArray children =  item.getJSONArray("children");
                    if(children.length() > 0) {
                        cleanupCategory(children);
                    } else {
                        item.remove("children");
                    }
                }
            } catch (JSONException e) {
                log.error("Error cleanup category items.");
            }
        }
    }

    private JSONObject updateSetting(JSONObject item) {
        try {
            Utils.updateFile("config/setting.profile.json", item);
            return item;
        } catch (Exception e) {
            log.error("Error 'updateSetting'!");
        }
        return new JSONObject();
    }
    
    private String updateCss(String content) {
        try {
            Utils.updateFile("css/app.profile.css", content);
        } catch (Exception e) {
            log.error("Error 'updateCss'!");
        }
        return content;
    }
    
    private String updateHelp(String lang, String content) {
        JSONObject help = null;
        JSONObject profileHelp = null;
        try {
            String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            if(classPath != null) {
                String filePathHelp = classPath + "frontend/";
                String fileContent = Utils.getFileContent(filePathHelp, "help-" + lang, ".json", "help/");
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
                        if(helpItem.has("title") && helpProfileItem.has("title") && helpItem.getString("title").equals(helpProfileItem.getString("title")) 
                            && helpItem.has("text") && helpProfileItem.has("text") && helpItem.getString("text").equals(helpProfileItem.getString("text"))
                            && helpItem.has("image") && helpProfileItem.has("image") &&  helpItem.getString("image").equals(helpProfileItem.getString("image"))){
                            profileHelp.remove(key);
                        }
                    }
                }
            }
            Utils.updateFile("help/help-" + lang + ".profile.json", profileHelp.toString());
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
                String fileContent = Utils.getFileContent(configDir, "help-" + lang + ".profile", ".json", "help/");
                if(StringUtils.isNotEmpty(fileContent)) {
                    JSONObject profileHelp = new JSONObject(fileContent);
                    if(profileHelp != null) {
                        if(profileHelp.has(id)) {
                            profileHelp.remove(id);
                        }
                        Utils.updateFile("help/help-" + lang + ".profile.json", profileHelp.toString());
                        return profileHelp.toString();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error reset help: " + e);
        }
        
        return "";
    }
    
    private JSONArray getLayers(String id) {
       return getLayers(id, false);
    }
    
    private JSONArray getLayers(String id, boolean compress) {
        JSONArray arr = new JSONArray();
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "layers", ".json", "data/");
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
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
            }
        }
        return arr;
    }
    
    private JSONArray addLayer(JSONArray layers) {
        if(layers != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, "layers", ".json", "data/");
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
                        Utils.updateFile("data/layers.json", newObj);
                    } catch (JSONException e) {
                        log.error("Error 'updateLayer'!");
                    }
                }
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

    private JSONArray getFilterArrayString(JSONArray arr, String searchText, String[] keys) {
        JSONArray arrSearch = new JSONArray();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject obj;
            try {
                obj = arr.getJSONObject(i);
                searchStringValue(obj, searchText, keys, arrSearch);
            } catch (JSONException e) {
                log.error("Error on search layers 'getFilterArrayString'!");
            }
        }
        return arrSearch;
    }

    private void searchStringValue(JSONObject item, String searchText, String[] keys, JSONArray arrSearch) throws JSONException {
        searchStringValue(item, searchText, keys, arrSearch, item);
    }

    private void searchStringValue(JSONObject obj, String searchText, String[] keys, JSONArray arrSearch, JSONObject parentObj) throws JSONException {
        boolean hasAdd = false;
        for (String key : keys) {
            if(obj.has(key)){
                String value = obj.getString(key);
                if(searchText != null && searchText.length() > 0) {
                    if(value.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
                        arrSearch.put(parentObj);
                        hasAdd = true;
                        break;
                    }
                }
            }
        }
        if(obj.has("item") && hasAdd == false) {
            JSONObject item = obj.getJSONObject("item");
            searchStringValue(item, searchText, keys, arrSearch, parentObj);
        }
    }

    private JSONArray getFilterArrayBoolean(JSONArray arr, boolean searchFlag, String[] keys) {
        JSONArray arrSearch = new JSONArray();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject obj;
            try {
                obj = arr.getJSONObject(i);
                searchBooleanValue(obj, searchFlag, keys, arrSearch);
            } catch (JSONException e) {
                log.error("Error on search layers 'getFilterArrayBoolean'!");
            }
        }
        return arrSearch;
    }

    private void searchBooleanValue(JSONObject item, boolean searchFlag, String[] keys, JSONArray arrSearch) throws JSONException {
        searchBooleanValue(item, searchFlag, keys, arrSearch, item, true);
    }

    private void searchBooleanValue(JSONObject obj, boolean searchFlag, String[] keys, JSONArray arrSearch, JSONObject parentObj, boolean checkHasContentOnly) throws JSONException {
        for (String key : keys) {
            if(obj.has(key)){
                if(checkHasContentOnly) {
                    arrSearch.put(parentObj);
                } else {
                    String value = obj.getString(key);
                    if(value == "true") {
                        arrSearch.put(parentObj);
                    }
                }
            }
        }
        if(obj.has("item")) {
            JSONObject item = obj.getJSONObject("item");
            searchBooleanValue(item, searchFlag, keys, arrSearch, parentObj, checkHasContentOnly);
        }
    }

    private JSONArray getFilterCategory (JSONArray arr, String searchCategory) {
        JSONArray categoryTree = getCategoryTree(searchCategory);
        JSONArray arrSearch = new JSONArray();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject obj;
            try {
                obj = arr.getJSONObject(i);
                if(obj.has("id")){
                    String id = obj.getString("id");
                    if(searchCategoryValue(id, categoryTree)) {
                        arrSearch.put(obj);
                    }
                }
            } catch (JSONException e) {
                log.error("Error on search layers 'getFilterCategory'!");
            }
        }
        return arrSearch;
    }

    private boolean searchCategoryValue(String searchId, JSONArray categoryTree) throws JSONException {
        boolean hasValue = false;
        for (int i = 0; i < categoryTree.length(); i++) {
            JSONObject obj = categoryTree.getJSONObject(i);
            if(obj.has("layerBodId")) {
                String layerBodId = obj.getString("layerBodId");
                if(layerBodId.equals(searchId)) {
                    hasValue = true;
                    break;
                }
            }
            if(obj.has("children")) {
                JSONArray children = obj.getJSONArray("children");
                if(searchCategoryValue(searchId, children)) {
                    hasValue = true;
                    break;
                }
            }
        }
        return hasValue;
    }
    private JSONObject updateLayer(String id, JSONObject layer) {
        if(id != null && layer != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, "layers", ".json", "data/");
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
                                if(url.toLowerCase().indexOf( "?" ) == -1){
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
                                    String getCapabilities = HttpProxy.doRequest( url );
                                    DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
                                    docFactory.setValidating(false);
                                    Document doc =  docFactory.newDocumentBuilder().parse(new InputSource(new StringReader(getCapabilities)));
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
                        Utils.updateFile("data/layers.json", obj);
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
            String fileContent = Utils.getFileContent(configDir, "layers", ".json", "data/");
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
                    Utils.updateFile("data/layers.json", obj);
                } catch (JSONException e) {
                    log.error("Error 'deleteLayer'!");
                }
            }
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
        JSONArray arr = new JSONArray();
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "catalogs", ".json", "data/");
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
                    return obj.getJSONArray("topics");
                } catch (JSONException e) {
                    log.error("Error 'getCategories'!");
                }
            }
        }
        return arr;
    }
    
    private JSONArray addCategory(JSONObject catelog) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "catalogs", ".json", "data/");
            if(StringUtils.isNotEmpty(fileContent)) {
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
                    Utils.createFile("data/catalog-" + catelog.getString("id") + ".json", results);
                    obj.getJSONArray("topics").put(catelog);
                    Utils.updateFile("data/catalogs.json", obj);
                } catch (JSONException e) {
                    log.error("Error 'addCategory'!");
                }
            }
        }
        return getCategories();
    }
    
    private JSONArray updateCategory(String id, JSONObject item) {
        if(id != null && item != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, "catalogs", ".json", "data/");
                if(StringUtils.isNotEmpty(fileContent)) {
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
                        Utils.updateFile("data/catalogs.json", obj);
                    } catch (JSONException e) {
                        log.error("Error 'updateCategory'!");
                    }
                }
            }
        }
        return getCategories();
    }

    private JSONArray deleteCategory(String id) {
        if(id != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            if(StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, "catalogs", ".json", "data/");
                if(StringUtils.isNotEmpty(fileContent)) {
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
                        Utils.removeFile("data/catalog-" + id +".json");
                        Utils.updateFile("data/catalogs.json", obj);
                        deleteCategoriesLocales(id);
                    } catch (JSONException e) {
                        log.error("Error 'deleteCategory'!");
                    }
                }
            }
        }
        return getCategories();
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
            String fileContent = Utils.getFileContent(configDir, "catalogs", ".json", "data/");
            if(StringUtils.isNotEmpty(fileContent)) {
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
                                        Utils.removeFile("data/catalog-" + id +".json");
                                        deleteCategoriesLocales(id);
                                        toDelete = true;
                                        break;
                                    }
                                }
                            }
                        } else {
                            String id = tmpObj.getString("id");
                            Utils.removeFile("data/catalog-" + id +".json");
                            deleteCategoriesLocales(id);
                            toDelete = true;
                        }
                        if(!toDelete) {
                            newTopics.put(tmpObj);
                        }
                    }
                    obj.put("topics", newTopics);
                    Utils.updateFile("data/catalogs.json", obj);
                } catch (JSONException e) {
                    log.error("Error 'deleteLayer'!");
                }
            }
        }
        return getCategories();
    }
    
    private JSONArray getCategoryTree(String id) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "catalog-" + id, ".json", "data/");
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
                    JSONObject results = obj.getJSONObject("results");
                    JSONObject root = results.getJSONObject("root");
                    return root.getJSONArray("children");
                } catch (JSONException e) {
                    log.error("Error 'getCategoryTree'!");
                }
            }
        }
        return new JSONArray();
    }

    private void filteredTreeLeafById(JSONArray categoryTree, String id, JSONArray filterCategoryTree, boolean isExpanded) {
        if(categoryTree != null) {
            try {
                for (int i = 0; i < categoryTree.length(); i++) {
                    JSONObject categoryTreeBranch = categoryTree.getJSONObject(i);
                    if(categoryTreeBranch.has("children")) {
                        JSONArray categoryTreeBranchChildren = categoryTreeBranch.getJSONArray("children");
                        JSONArray filterCategoryTreeChildren = new JSONArray();
                        if(categoryTreeBranchChildren != null) {
                            filteredTreeLeafById(categoryTreeBranchChildren, id, filterCategoryTreeChildren, isExpanded);
                            if(filterCategoryTreeChildren.length() > 0) {
                                categoryTreeBranch.put("children", filterCategoryTreeChildren);
                                if(isExpanded) {
                                    categoryTreeBranch.put("isExpanded", isExpanded);
                                }
                                filterCategoryTree.put(categoryTreeBranch);
                            }
                        }
                    }
                    if(categoryTreeBranch.has("layerBodId")) {
                        String layerBodId = categoryTreeBranch.getString("layerBodId");
                        if(layerBodId.equals(id)) {
                            filterCategoryTree.put(categoryTreeBranch);
                        }
                    }
                }
            } catch (JSONException e) {
                log.error("Error on filteredTreeLeafById: " + e);
            }
        }
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
}
