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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.Constants;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.model.GetCapabilitiesDocument;
import de.ingrid.mapclient.utils.DataUtils;
import de.ingrid.mapclient.utils.Utils;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.RequestBody;
import org.w3c.dom.Document;
import org.w3c.dom.Node;

import javax.imageio.ImageIO;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * WmsResource defines the interface for retrieving WMS data
 *
 * @author ingo@wemove.com
 */
@Path("/admin")
public class AdministrationResource {

    private static final Logger log = Logger.getLogger(AdministrationResource.class);

    private static final ObjectMapper mapper = new ObjectMapper();


    /* Layers */
    @GET
    @Path("layers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLayersList(@QueryParam("currentPage") String currentPage, @QueryParam("layersPerPage") String layersPerPage, @QueryParam("searchText") String searchText,
                                  @QueryParam("hasStatus") boolean hasStatus, @QueryParam("searchCategory") String searchCategory, @QueryParam("searchType") String searchType) {
        String[] searchTextKeys = {DataUtils.LAYER_KEY_LABEL, DataUtils.LAYER_KEY_ID, DataUtils.LAYER_KEY_WMSURL, DataUtils.LAYER_KEY_SERVICEURL};
        String[] searchTypeKeys = {"type"};
        String[] searchHasStatusKeys = {"status"};
        if (currentPage == null && layersPerPage == null) {
            // Get layer list compress
            ArrayNode arr = DataUtils.getLayers(null, true);
            // Check search text
            if (searchText != null && searchText.length() > 0) {
                arr = DataUtils.getFilterArrayString(arr, searchText, searchTextKeys);
            }
            // Check search type
            if (searchType != null && searchType.length() > 0) {
                arr = DataUtils.getFilterArrayString(arr, searchType, searchTypeKeys);
            }
            // Check has state
            if (hasStatus) {
                arr = DataUtils.getFilterArrayBoolean(arr, hasStatus, searchHasStatusKeys);
            }
            // Check has category
            if (searchCategory != null && searchCategory.length() > 0) {
                arr = DataUtils.getFilterCategory(arr, searchCategory);
            }
            return Response.ok(arr).build();
        } else {
            // Get paging layer list compress
            ArrayNode arr = DataUtils.getLayers(null);
            // Check search text
            if (searchText != null && searchText.length() > 0) {
                arr = DataUtils.getFilterArrayString(arr, searchText, searchTextKeys);
            }
            // Check search type
            if (searchType != null && searchType.length() > 0) {
                arr = DataUtils.getFilterArrayString(arr, searchType, searchTypeKeys);
            }
            // Check has state
            if (hasStatus) {
                arr = DataUtils.getFilterArrayBoolean(arr, hasStatus, searchHasStatusKeys);
            }
            // Check has category
            if (searchCategory != null && searchCategory.length() > 0) {
                arr = DataUtils.getFilterCategory(arr, searchCategory);
            }
            int tmpCurrentPage = Integer.parseInt(currentPage);
            int tmpLayersPerPage = Integer.parseInt(layersPerPage);
            int lastPage = (int) Math.ceil(arr.size() / (double) tmpLayersPerPage);
            int totalNumOfLayersPerPage = tmpCurrentPage * tmpLayersPerPage;
            int firstNumOfLayers = totalNumOfLayersPerPage - tmpLayersPerPage;
            if (lastPage < 1) {
                lastPage = 1;
            }
            if (lastPage < tmpCurrentPage) {
                tmpCurrentPage = lastPage;
                totalNumOfLayersPerPage = tmpCurrentPage * tmpLayersPerPage;
                firstNumOfLayers = totalNumOfLayersPerPage - tmpLayersPerPage;
            }
            JsonNode obj = DataUtils.getPaginationArray(arr, tmpCurrentPage, lastPage, firstNumOfLayers, totalNumOfLayersPerPage);
            return Response.ok(obj).build();
        }
    }

    @GET
    @Path("layers/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLayerById(@PathParam("id") String id) {
        ArrayNode arr = DataUtils.getLayers(id);
        return Response.ok(arr).build();
    }

    @POST
    @Path("layers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response addLayer(String content) {
        ArrayNode layers;
        try {
            layers = (ArrayNode) mapper.readTree(content);
            ArrayNode arr = addLayer(layers);
            return Response.ok(arr).build();
        } catch (JsonProcessingException e) {
            log.error("Error POST '/layers'!");
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @PUT
    @Path("layers/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateLayerById(@RequestBody String content, @PathParam("id") String id) {
        try {
            JsonNode layer = mapper.readTree(content);
            String newId = id;
            if (layer.hasNonNull("id")) {
                newId = layer.get("id").textValue();
            }
            if (!id.equals(newId)) {
                // Update catalogs reference 
                ArrayNode categories = DataUtils.getCategories();
                for (int i = 0; i < categories.size(); i++) {
                    JsonNode category = categories.get(i);
                    String catId = category.get("id").textValue();
                    ArrayNode cat = DataUtils.getCategoryTree(catId);
                    for (int j = 0; j < cat.size(); j++) {
                        ObjectNode catItem = (ObjectNode) cat.get(j);
                        updateCategoryLayersId(catItem, id, newId);
                    }
                    updateCategoryTree(catId, cat);
                }
            }
            JsonNode obj = updateLayer(id, layer);
            if (obj != null) {
                return Response.ok(obj).build();
            }
        } catch (JsonProcessingException e) {
            log.error("Error POST '/layers/{id}'!");
        }

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @DELETE
    @Path("layers/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteLayerById(@PathParam("id") String id) {
        String[] ids = id.split(",");
        ArrayNode arr = deleteLayers(ids);
        return Response.ok(arr).build();
    }

    @DELETE
    @Path("layers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteLayersByIds(@QueryParam("ids") String paramIds) {
        String[] ids = paramIds.split(",");
        ArrayNode arr = deleteLayers(ids);
        return Response.ok(arr).build();
    }

    @DELETE
    @Path("layers/all")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteLayersAll() {
        ArrayNode arr = deleteLayers();
        return Response.ok(arr).build();
    }

    /* Categories */
    @GET
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoriesList() {
        ArrayNode arr = DataUtils.getCategories();
        return Response.ok(arr).build();
    }


    @GET
    @Path("categories/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoryById(@PathParam("id") String id) {
        ArrayNode arr = DataUtils.getCategoryTree(id);
        return Response.ok(arr).build();
    }

    @GET
    @Path("categories/layer/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCategoryByLayerId(@PathParam("id") String id, @QueryParam("isExpanded") boolean isExpanded) {
        ArrayNode categoriesWithLayerId = DataUtils.getCategoryByLayerId(id, isExpanded);
        return Response.ok(categoriesWithLayerId).build();
    }

    @POST
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response addCategory(String content) {
        JsonNode category;
        try {
            category = mapper.readTree(content);
            ArrayNode arr = addCategory(category);
            return Response.ok(arr).build();
        } catch (JsonProcessingException e) {
            log.error("Error POST '/categories'!");
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @POST
    @Path("categories/{copyId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response copyCategory(String content, @PathParam("copyId") String copyId) {
        if (copyId != null) {
            JsonNode category;
            try {
                category = mapper.readTree(content);
                String categoryId = category.get("id").textValue();
                if (categoryId != null) {
                    Properties p = ConfigurationProvider.INSTANCE.getProperties();
                    String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
                    if (StringUtils.isNotEmpty(configDir)) {
                        String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_PREFIX_CATALOG + copyId, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                        if (StringUtils.isNotEmpty(fileContent)) {
                            Utils.createFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + categoryId + DataUtils.FILEFORMAT_JSON, mapper.readTree(fileContent));
                        }
                    }
                }
            } catch (JsonProcessingException e) {
                log.error("Error POST '/categories'!");
            }
            return this.addCategory(content);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @PUT
    @Path("categories/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateCategoryById(@RequestBody String content, @PathParam("id") String id) {
        try {
            JsonNode item = mapper.readTree(content);
            ArrayNode arr = updateCategory(id, item);
            return Response.ok(arr).build();
        } catch (JsonProcessingException e) {
            log.error("Error POST '/categories/{id}'!");
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @DELETE
    @Path("categories/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCategoryById(@PathParam("id") String id) {
        ArrayNode arr = deleteCategory(id);
        return Response.ok(arr).build();
    }

    @DELETE
    @Path("categories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCategoriesByIds(@QueryParam("ids") String paramIds) {
        String[] ids = paramIds.split(",");
        ArrayNode arr = deleteCategories(ids);
        return Response.ok(arr).build();
    }

    @DELETE
    @Path("categories/all")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCategoriesAll() {
        ArrayNode arr = deleteCategories();
        return Response.ok(arr).build();
    }

    @PUT
    @Path("categorytree/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateCategoryTree(@RequestBody String content, @PathParam("id") String id) {
        try {
            ArrayNode item = (ArrayNode) mapper.readTree(content);
            ArrayNode arr = updateCategoryTree(id, item);
            return Response.ok(arr).build();
        } catch (JsonProcessingException e) {
            log.error("Error POST '/categorytree/{id}'!");
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @GET
    @Path("setting")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSettingRequest() {
        ConfigResource cr = new ConfigResource();
        Response localeResponse = cr.getSettingRequest(true);
        if (localeResponse != null) {
            return localeResponse;
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @PUT
    @Path("setting")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateSetting(@RequestBody String content) {
        try {
            JsonNode setting = null;
            ObjectNode settingProfile = (ObjectNode) mapper.readTree(content);
            String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            String fileSetting = classPath + "frontend/";
            String fileContent = Utils.getFileContent(fileSetting, "setting", DataUtils.FILEFORMAT_JSON, "config/");
            if (StringUtils.isNotEmpty(fileContent)) {
                setting = mapper.readTree(fileContent);
                if (setting != null) {
                    Iterator<Map.Entry<String, JsonNode>> keys = setting.fields();
                    while (keys.hasNext()) {
                        Map.Entry<String, JsonNode> key = keys.next();
                        if (settingProfile.hasNonNull(key.getKey())) {
                            Object obj = key.getValue();
                            Object objProfile = settingProfile.get(key.getKey());
                            if (obj instanceof String && objProfile instanceof String) {
                                if (setting.get(key.getKey()).textValue().equals(settingProfile.get(key.getKey()).textValue())) {
                                    settingProfile.remove(key.getKey());
                                }
                            } else if (obj instanceof Boolean && objProfile instanceof Boolean) {
                                if (setting.get(key.getKey()).booleanValue() == settingProfile.get(key.getKey()).booleanValue()) {
                                    settingProfile.remove(key.getKey());
                                }
                            } else if (obj instanceof Integer && objProfile instanceof Integer) {
                                if (setting.get(key.getKey()).intValue() == settingProfile.get(key.getKey()).intValue()) {
                                    settingProfile.remove(key.getKey());
                                }
                            } else if (obj instanceof Double && objProfile instanceof Double) {
                                if (setting.get(key.getKey()).doubleValue() == settingProfile.get(key.getKey()).doubleValue()) {
                                    settingProfile.remove(key.getKey());
                                }
                            } else if (obj instanceof Long && objProfile instanceof Long) {
                                if (setting.get(key.getKey()).longValue() == settingProfile.get(key.getKey()).longValue()) {
                                    settingProfile.remove(key.getKey());
                                }
                            } else if (obj instanceof ArrayNode) {
                                ArrayNode settingArr = (ArrayNode) setting.get(key.getKey());
                                ArrayNode settingProfileArr = (ArrayNode) settingProfile.get(key.getKey());
                                if (settingArr != null && settingProfileArr != null) {
                                    boolean isSame = false;
                                    if (settingArr.size() == settingProfileArr.size()) {
                                        isSame = true;
                                        for (int i = 0; i < settingArr.size(); i++) {
                                            Object arrayObj = settingArr.get(i);
                                            Object arrayProfileObj = settingProfileArr.get(i);
                                            if (arrayObj instanceof String && arrayProfileObj instanceof String) {
                                                if (!settingArr.get(i).equals(settingProfileArr.get(i))) {
                                                    isSame = false;
                                                    break;
                                                }
                                            } else if (arrayObj instanceof Boolean && arrayProfileObj instanceof Boolean) {
                                                if (settingArr.get(i).booleanValue() != settingProfileArr.get(i).booleanValue()) {
                                                    isSame = false;
                                                    break;
                                                }
                                            } else if (arrayObj instanceof Integer && arrayProfileObj instanceof Integer) {
                                                if (settingArr.get(i).intValue() != settingProfileArr.get(i).intValue()) {
                                                    isSame = false;
                                                    break;
                                                }
                                            } else if (arrayObj instanceof Double && arrayProfileObj instanceof Double) {
                                                if (settingArr.get(i).doubleValue() != settingProfileArr.get(i).doubleValue()) {
                                                    isSame = false;
                                                    break;
                                                }
                                            } else if (arrayObj instanceof Long && arrayProfileObj instanceof Long) {
                                                if (settingArr.get(i).longValue() != settingProfileArr.get(i).longValue()) {
                                                    isSame = false;
                                                    break;
                                                }
                                            } else if (arrayObj.getClass() != arrayProfileObj.getClass()) {
                                                isSame = false;
                                                break;
                                            }
                                        }
                                    }
                                    if (isSame) {
                                        settingProfile.remove(key.getKey());
                                    }
                                }
                            }
                        }
                    }
                }
            }
            updateSetting(settingProfile);
            if (settingProfile.hasNonNull("settingLanguages")) {
                ArrayNode settingLanguages = (ArrayNode) settingProfile.get("settingLanguages");
                for (int i = 0; i < settingLanguages.size(); i++) {
                    String lang = settingLanguages.get(i).textValue();
                    if (lang != null) {
                        Response langResponse = this.getHelpRequest(lang);
                        if (langResponse.getEntity().toString().equals("{}")) {
                            this.updateHelp(lang, this.getHelpRequest("de").getEntity().toString());
                        }
                        ConfigResource cr = new ConfigResource();
                        Response localeResponse = cr.getLocales(lang + DataUtils.FILEFORMAT_JSON, false);
                        if (localeResponse.getEntity().toString().equals("{}")) {
                            this.updateLocale(lang, cr.getLocales("de.json", false).getEntity().toString());
                        }
                    }
                }
            }
            return getSettingRequest();
        } catch (JsonProcessingException e) {
            log.error("Error PUT '/setting'!");
        }

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @PUT
    @Path("setting/reset")
    @Produces(MediaType.APPLICATION_JSON)
    public Response resetSetting(@RequestBody String content) {
        updateSetting(mapper.createObjectNode());
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
        if (content != null) {
            updateCss(content);
            return Response.status(Response.Status.OK).build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @GET
    @Path("help/{lang}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getHelpRequest(@PathParam("lang") String lang) {
        try {
            if (lang != null) {
                String filename = DataUtils.FILE_PREFIX_HELP + lang;
                if (log.isDebugEnabled()) {
                    log.debug("Load file: " + filename);
                }

                ObjectNode help = mapper.createObjectNode();
                if (log.isDebugEnabled()) {
                    log.debug("Load file: " + filename);
                }
                String classPath = "";
                classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
                String filePathHelp = classPath + "frontend/";
                String fileContent = Utils.getFileContent(filePathHelp, filename, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                if (StringUtils.isNotEmpty(fileContent)) {
                    help = (ObjectNode) mapper.readTree(fileContent);
                }

                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
                if (StringUtils.isNotEmpty(configDir)) {
                    fileContent = Utils.getFileContent(configDir, filename + DataUtils.FILE_PREFIX_PROFILE, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                    if (StringUtils.isEmpty(fileContent)) {
                        fileContent = Utils.getFileContent(filePathHelp, filename + DataUtils.FILE_PREFIX_PROFILE, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                        if (StringUtils.isNotEmpty(fileContent)) {
                            Utils.updateFile(DataUtils.CONFIG_PATH_HELP + filename + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, fileContent);
                        }
                    }
                    if (StringUtils.isNotEmpty(fileContent)) {
                        JsonNode profileHelp = mapper.readTree(fileContent);
                        Iterator<Map.Entry<String, JsonNode>> keys = profileHelp.fields();
                        while (keys.hasNext()) {
                            Map.Entry<String, JsonNode> key = keys.next();
                            if (profileHelp.hasNonNull(key.getKey())) {
                                help.set(key.getKey(), key.getValue());
                            }
                        }
                    }
                }
                return Response.ok(help.toString()).build();
            }
        } catch (JsonProcessingException e) {
            log.error("Error getHelpRequest: " + e);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @GET
    @Path("help/{lang}/{id}")
    @Produces(MediaType.TEXT_HTML)
    public Response getHelpIdRequest(@PathParam("lang") String lang, @PathParam("id") String id) {
        if (lang != null) {
            String filename = DataUtils.FILE_PREFIX_HELP + lang;
            if (StringUtils.isNotEmpty(filename)) {
                if (log.isDebugEnabled()) {
                    log.debug("Load file: " + filename);
                }
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
                String urlPathPrefix = p.getProperty(ConfigurationProvider.URL_PATH_PREFIX, "").trim();
                if (StringUtils.isNotEmpty(configDir)) {
                    Response helps = this.getHelpRequest(lang);
                    if (helps != null && helps.getEntity() != null) {
                        String fileContent = helps.getEntity().toString();
                        if (fileContent != null) {
                            try {
                                JsonNode obj = mapper.readTree(fileContent);
                                String[] ids = id.split(",");
                                String innerHtml = "";
                                innerHtml += "<html lang=\"de\">";
                                innerHtml += "<head>";
                                innerHtml += "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"/>";
                                innerHtml += "<link rel=\"stylesheet\" href=\"" + urlPathPrefix + "/ingrid-webmap-client/frontend/prd/style/app.css?v=\">";
                                innerHtml += "<link rel=\"stylesheet\" href=\"" + urlPathPrefix + "/ingrid-webmap-client/frontend/css/app.override.css\">";
                                innerHtml += "<link rel=\"stylesheet\" href=\"" + urlPathPrefix + "/ingrid-webmap-client/frontend/css/app.layout.override.css\">";
                                innerHtml += "<link href=\"" + urlPathPrefix + "/ingrid-webmap-client/rest/config/css\" rel=\"stylesheet\">";
                                innerHtml += "</head>";
                                innerHtml += "<body style=\"overflow: auto;\"><div id=\"app\" class=\"view\"><div id=\"content\" class=\"popover-content ga-popup-content\">";
                                for (String tmpId : ids) {
                                    JsonNode jsonObjId = obj.get(tmpId);
                                    if (jsonObjId != null) {
                                        String title = jsonObjId.get(DataUtils.HELP_KEY_TITLE).textValue();
                                        String text = jsonObjId.get(DataUtils.HELP_KEY_TEXT).textValue();
                                        String image = jsonObjId.get(DataUtils.HELP_KEY_IMAGE).textValue();

                                        if (title != null) {
                                            innerHtml += "<h2>" + title + "</h2>";
                                        }
                                        if (text != null) {
                                            innerHtml += "<div>" + text + "</div>";
                                        }
                                        if (image != null) {
                                            innerHtml += "<br>";
                                            innerHtml += "<img src=\"" + image + "\" draggable=\"false\"/>";
                                        }
                                    }
                                }
                                innerHtml += "</div></div></body></html>";
                                return Response.ok(innerHtml).build();
                            } catch (JsonProcessingException e) {
                                log.error("Error get help with ID " + id);
                            }
                        }
                    }
                }
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @PUT
    @Path("help/{lang}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response updateHelpRequest(@RequestBody String content, @PathParam("lang") String lang) {
        if (content != null) {
            String fileContent = updateHelp(lang, content);
            if (StringUtils.isNotEmpty(fileContent)) {
                return Response.status(Response.Status.OK).build();
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @PUT
    @Path("help/reset/{lang}/{id}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response resetHelpRequest(@PathParam("lang") String lang, @PathParam("id") String id) {
        if (lang != null && id != null) {
            String fileContent = resetHelp(lang, id);
            if (StringUtils.isNotEmpty(fileContent)) {
                return this.getHelpRequest(lang);
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @GET
    @Path("locales/{locale}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLocales(@PathParam("locale") String locale) throws JsonProcessingException {
        ConfigResource cr = new ConfigResource();
        return cr.getLocales(locale + DataUtils.FILEFORMAT_JSON, false);
    }

    @PUT
    @Path("locales/{lang}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateLocaleRequest(@RequestBody String content, @PathParam("lang") String lang) {
        try {
            updateLocale(lang, content);
            return Response.status(Response.Status.OK).build();
        } catch (JsonProcessingException e) {
            log.error("Error PUT '/locales'!");
        }

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
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
            JsonNode obj = mapper.readTree(content);
            if (obj.hasNonNull("url")) {
                url = obj.get("url").textValue();
            }
            if (obj.hasNonNull("login")) {
                login = obj.get("login").textValue();
            }
            if (obj.hasNonNull("password")) {
                password = obj.get("password").textValue();
            }
            if (obj.hasNonNull("overrideLogin")) {
                overrideLogin = obj.get("overrideLogin").booleanValue();
            }
            if (StringUtils.isNotEmpty(login) && StringUtils.isNotEmpty(password)) {
                try {
                    String existPassword = Utils.getServiceLogin(url, login);
                    if (StringUtils.isEmpty(existPassword) || overrideLogin) {
                        Utils.setServiceLogin(url, login, password);
                    }
                } catch (Exception e) {
                    log.error("Error 'service.auth.json'!");
                }
                return Response.status(Response.Status.OK).build();
            }
        } catch (Exception e) {
            log.error("Error sending WMS request: " + url, e);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @GET
    @Path("image/{path}/{id}")
    @Produces("image/png")
    public Response getImageRequest(@PathParam("path") String path, @PathParam("id") String id) {

        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configPath = p.getProperty(ConfigurationProvider.CONFIG_DIR, "./").trim();

        if (!configPath.endsWith("/")) {
            configPath = configPath.concat("/");
        }
        File imageDir = new File(configPath + "img");
        if (!imageDir.exists()) {
            imageDir.mkdirs();
        }

        File imageSubDir = new File(imageDir, path);
        if (!imageSubDir.exists()) {
            imageSubDir.mkdirs();
        }
        File[] files = imageSubDir.listFiles();
        for (File file : files) {
            if (file.getName().startsWith(id + ".")) {
                return Response.ok(file).build();
            }
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    @PUT
    @Path("image")
    public Response addImageRequest(@RequestBody String content) {
        try {
            JsonNode imageJSON = mapper.readTree(content);
            if (imageJSON.hasNonNull("data") && imageJSON.hasNonNull("path") && imageJSON.hasNonNull("name")) {
                String data = imageJSON.get("data").textValue();
                String name = imageJSON.get("name").textValue();
                String path = imageJSON.get("path").textValue();

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
                String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR, "./").trim();
                String urlPathPrefix = p.getProperty(ConfigurationProvider.URL_PATH_PREFIX, "").trim();

                if (!configDir.endsWith("/")) {
                    configDir = configDir.concat("/");
                }
                File imageDir = new File(configDir + "img");
                if (!imageDir.exists()) {
                    imageDir.mkdirs();
                }

                File imageSubDir = new File(imageDir, path);
                if (!imageSubDir.exists()) {
                    imageSubDir.mkdirs();
                }
                File[] files = imageSubDir.listFiles();
                for (File file : files) {
                    if (file.getName().startsWith(name + ".") && file.delete()) {
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
                if (path.equals("category")) {
                    String css = Utils.getFileContent(configDir, "app.profile", ".css", "css/");
                    if (css.indexOf(".ga-topics-sprite-" + name) == -1) {
                        css = css + "\n[ga-topic] .ga-topics-sprite-" + name + " {\n" +
                                "  background: url(\"" + urlPathPrefix + "/ingrid-webmap-client/rest/data/images/" + path + "/" + name + "\");\n" +
                                "  width: 140px;\n" +
                                "}";
                        this.updateCss(css);
                    }
                } else if (path.equals("background")) {
                    String css = Utils.getFileContent(configDir, "app.profile", ".css", "css/");
                    if (css.indexOf("[ga-background-selector] .ga-" + name) == -1) {
                        css = css + "\n@media (max-width: 768px) {\n" +
                                "[ga-background-selector] .ga-" + name + " {\n" +
                                "  background: url(\"" + urlPathPrefix + "/ingrid-webmap-client/rest/data/images/" + path + "/" + name + "\");\n" +
                                "  background-size: 38px 38px;\n" +
                                "}\n" +
                                "}";
                        css = css + "\n@media (min-width: 769px) {\n" +
                                "[ga-background-selector] .ga-" + name + " {\n" +
                                "  background: url(\"" + urlPathPrefix + "/ingrid-webmap-client/rest/data/images/" + path + "/" + name + "\");\n" +
                                "  background-size: 90px 58px;\n" +
                                "}\n" +
                                "}";
                        this.updateCss(css);
                    }
                }
            }
            return Response.status(Response.Status.OK).build();
        } catch (IOException e) {
            log.error("Error PUT '/image'!", e);
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }

    private void updateLocale(String lang, String content) throws JsonProcessingException {
        ObjectNode localeProfile = null;
        JsonNode localeDefault = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        JsonNode item = mapper.readTree(content);
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, lang + DataUtils.FILE_PREFIX_PROFILE, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_LOCALES);
            if (StringUtils.isNotEmpty(fileContent)) {
                localeProfile = (ObjectNode) mapper.readTree(fileContent);
                ConfigResource cr = new ConfigResource();
                Response localeResponse = cr.getLocales(lang + DataUtils.FILEFORMAT_JSON, true);
                if (localeResponse != null) {
                    localeDefault = mapper.readTree(localeResponse.getEntity().toString());
                }

                Iterator<Map.Entry<String, JsonNode>> keys = item.fields();
                while (keys.hasNext()) {
                    Map.Entry<String, JsonNode> key = keys.next();
                    if (item.hasNonNull(key.getKey())) {
                        String value = key.getValue().textValue();
                        String valueDefault = "";
                        if (localeDefault != null && localeDefault.hasNonNull(key.getKey())) {
                            valueDefault = localeDefault.get(key.getKey()).textValue();
                        }
                        if (value.trim().equals(valueDefault.trim())) {
                            localeProfile.remove(key.getKey());
                        } else {
                            localeProfile.set(key.getKey(), key.getValue());
                        }
                    }
                }
                Utils.updateFile(DataUtils.CONFIG_PATH_LOCALES + lang + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, localeProfile);
            } else {
                Utils.updateFile(DataUtils.CONFIG_PATH_LOCALES + lang + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, item);
            }
        }
    }

    private void deleteLocale(String lang, ArrayList<String> keys) throws JsonProcessingException {
        ObjectNode locale = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, lang, DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_LOCALES);
            if (StringUtils.isNotEmpty(fileContent)) {
                locale = (ObjectNode) mapper.readTree(fileContent);
                for (String key : keys) {
                    if (locale.hasNonNull(key)) {
                        locale.remove(key);
                    }
                }
                Utils.updateFile(DataUtils.CONFIG_PATH_LOCALES + lang + DataUtils.FILE_PREFIX_PROFILE + DataUtils.FILEFORMAT_JSON, locale);
            }
        }
    }

    private ArrayNode updateCategoryTree(String id, ArrayNode item) {
        ArrayNode arr = null;
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_PREFIX_CATALOG + id, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if (StringUtils.isNotEmpty(fileContent)) {
                try {
                    JsonNode obj = mapper.readTree(fileContent);
                    arr = mapper.createArrayNode();
                    JsonNode results = obj.get("results");
                    ObjectNode root = (ObjectNode) results.get("root");
                    root.set(DataUtils.CATEGORY_KEY_CHILDREN, item);
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

    private void cleanupCategory(ArrayNode items) {
        for (int i = 0; i < items.size(); i++) {
//            try {
            ObjectNode item = (ObjectNode) items.get(i);
            if (item.hasNonNull(DataUtils.CATEGORY_KEY_CHILDREN)) {
                ArrayNode children = (ArrayNode) item.get(DataUtils.CATEGORY_KEY_CHILDREN);
                if (children.size() > 0) {
                    cleanupCategory(children);
                } else {
                    item.remove(DataUtils.CATEGORY_KEY_CHILDREN);
                }
            }
//                log.error("Error cleanup category items.");
        }
    }

    private void updateSetting(JsonNode item) {
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
        JsonNode help = null;
        ObjectNode profileHelp = null;
        try {
            String classPath = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
            if (classPath != null) {
                String filePathHelp = classPath + "frontend/";
                String fileContent = Utils.getFileContent(filePathHelp, DataUtils.FILE_PREFIX_HELP + lang, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                if (StringUtils.isNotEmpty(fileContent)) {
                    help = mapper.readTree(fileContent);
                }
            }
            if (content != null) {
                profileHelp = (ObjectNode) mapper.readTree(content);
            }

            if (help != null && profileHelp != null) {
                Iterator<Map.Entry<String, JsonNode>> keys = help.fields();
                while (keys.hasNext()) {
                    String key = String.valueOf(keys.next());
                    if (profileHelp.hasNonNull(key)) {
                        JsonNode helpItem = help.get(key);
                        JsonNode helpProfileItem = profileHelp.get(key);
                        if (helpItem.hasNonNull(DataUtils.HELP_KEY_TITLE) && helpProfileItem.hasNonNull(DataUtils.HELP_KEY_TITLE) && helpItem.get(DataUtils.HELP_KEY_TITLE).equals(helpProfileItem.get(DataUtils.HELP_KEY_TITLE))
                                && helpItem.hasNonNull(DataUtils.HELP_KEY_TEXT) && helpProfileItem.hasNonNull(DataUtils.HELP_KEY_TEXT) && helpItem.get(DataUtils.HELP_KEY_TEXT).equals(helpProfileItem.get(DataUtils.HELP_KEY_TEXT))
                                && helpItem.hasNonNull(DataUtils.HELP_KEY_IMAGE) && helpProfileItem.hasNonNull(DataUtils.HELP_KEY_IMAGE) && helpItem.get(DataUtils.HELP_KEY_IMAGE).equals(helpProfileItem.get(DataUtils.HELP_KEY_IMAGE))) {
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
            String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
            if (StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_PREFIX_HELP + lang + DataUtils.FILE_PREFIX_PROFILE, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_HELP);
                if (StringUtils.isNotEmpty(fileContent)) {
                    ObjectNode profileHelp = (ObjectNode) mapper.readTree(fileContent);
                    if (profileHelp.hasNonNull(id)) {
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


    private ArrayNode addLayer(ArrayNode layers) {
        if (layers != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
            if (StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_LAYERS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                if (StringUtils.isNotEmpty(fileContent)) {
                    try {
                        ObjectNode newObj = mapper.createObjectNode();
                        JsonNode obj = mapper.readTree(fileContent);
                        for (int i = 0; i < layers.size(); i++) {
                            JsonNode tmpObj = layers.get(i);
                            String id = tmpObj.get("id").textValue();
                            if (obj.hasNonNull(id)) {
                                id = generateID(obj, id);
                            }
                            JsonNode tmpItem = tmpObj.get("item");
                            if (tmpItem.hasNonNull("wmsLayers") || tmpItem.hasNonNull("serverLayerName")) {
                                newObj.set(id, tmpItem);
                            }
                        }
                        Iterator<Map.Entry<String, JsonNode>> keys = obj.fields();
                        while (keys.hasNext()) {
                            Map.Entry<String, JsonNode> key = keys.next();
                            newObj.set(key.getKey(), key.getValue());
                        }
                        Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_LAYERS + DataUtils.FILEFORMAT_JSON, newObj);
                    } catch (JsonProcessingException e) {
                        log.error("Error 'updateLayer'!");
                    }
                }
            }
        }
        return DataUtils.getLayers(null);
    }

    private String generateID(JsonNode obj, String id) {
        if (obj.hasNonNull(id)) {
            id = generateID(obj, id + "_");
        }
        return id.replace(".", "_");
    }

    private JsonNode updateLayer(String id, JsonNode layer) {
        if (id != null && layer != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
            if (StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_LAYERS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                if (StringUtils.isNotEmpty(fileContent)) {
                    try {
                        ObjectNode obj = (ObjectNode) mapper.readTree(fileContent);
                        ObjectNode layerItem = (ObjectNode) layer.get("item");
                        if (layerItem.hasNonNull(Constants.LAYER_STATUS)) {
                            String status = layerItem.get(Constants.LAYER_STATUS).textValue();
                            String version = null;
                            if (layerItem.hasNonNull(Constants.LAYER_VERSION)) {
                                version = layerItem.get(Constants.LAYER_VERSION).textValue();
                            }
                            String layername = null;
                            if (layerItem.hasNonNull(Constants.WMS_LAYERNAME)) {
                                layername = layerItem.get(Constants.WMS_LAYERNAME).textValue();
                            }
                            if (layerItem.hasNonNull(Constants.WMTS_LAYERNAME)) {
                                layername = layerItem.get(Constants.WMTS_LAYERNAME).textValue();
                            }
                            String url = null;
                            if (layerItem.hasNonNull(Constants.WMS_URL)) {
                                url = layerItem.get(Constants.WMS_URL).textValue();
                                if (url.indexOf('?') == -1) {
                                    url += "?";
                                }
                                if (url.toLowerCase().indexOf("service=") == -1) {
                                    url += "&SERVICE=WMS";
                                }
                                if (url.toLowerCase().indexOf("request=") == -1) {
                                    url += "&REQUEST=GetCapabilities";
                                }
                                if (url.toLowerCase().indexOf("version=") == -1) {
                                    if (version == null) {
                                        url += "&VERSION=1.3.0";
                                    } else {
                                        url += "&VERSION=" + version;
                                    }
                                }
                            }
                            if (layerItem.hasNonNull(Constants.WMTS_URL)) {
                                url = layerItem.get(Constants.WMTS_URL).textValue();
                            }
                            if (status != null && layername != null && url != null) {
                                try {
                                    GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest(url);
                                    if (getCapabilities != null) {
                                        Document doc = (Document) getCapabilities.getDoc();
                                        XPath xpath = XPathFactory.newInstance().newXPath();
                                        Node layerNode = (Node) xpath.evaluate("//Layer/Name[text()=\"" + layername + "\"]/..", doc, XPathConstants.NODE);
                                        if (layerNode == null) {
                                            layerNode = (Node) xpath.evaluate("//Layer/Identifier[text()=\"" + layername + "\"]/..", doc, XPathConstants.NODE);
                                        }
                                        switch (status) {
                                            case Constants.STATUS_LAYER_NOT_EXIST:
                                                if (layerNode != null) {
                                                    layerItem.remove(Constants.LAYER_STATUS);
                                                }
                                                break;
                                            case Constants.STATUS_SERVICE_NOT_EXIST:
                                                if (layerNode != null) {
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
                        String newId = layer.get("id").textValue();
                        if (newId != null && id.equals(newId)) {
                            obj.put(id, layerItem);
                        } else {
                            // TODO: Update catalog files.
                            String newObj = obj.toString();
                            newObj = newObj.replaceAll(id, newId);
                            obj = (ObjectNode) mapper.readTree(newObj);
                            obj.set(newId, layerItem);
                        }
                        Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_LAYERS + DataUtils.FILEFORMAT_JSON, obj);
                    } catch (JsonProcessingException e) {
                        log.error("Error 'updateLayer'!");
                    }
                }
            }
        }
        return layer;
    }

    private ArrayNode deleteLayers() {
        return deleteLayers(null);
    }

    private ArrayNode deleteLayers(String[] ids) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_LAYERS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if (StringUtils.isNotEmpty(fileContent)) {
                try {
                    ObjectNode obj = (ObjectNode) mapper.readTree(fileContent);
                    if (ids != null) {
                        for (String id : ids) {
                            if (id != null && id.length() > 0) {
                                obj.remove(id);
                            }
                        }
                    } else {
                        obj = mapper.createObjectNode();
                    }
                    removeLayersFromCategories(ids);
                    Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_LAYERS + DataUtils.FILEFORMAT_JSON, obj);
                } catch (JsonProcessingException e) {
                    log.error("Error 'deleteLayer'!");
                }
            }
        }
        return DataUtils.getLayers(null, true);
    }

    private void removeLayersFromCategories(String[] ids) {
        ArrayNode categories = DataUtils.getCategories();
        for (int i = 0; i < categories.size(); i++) {
//            try {
            JsonNode category = categories.get(i);
            String catId = category.get("id").textValue();
            ArrayNode cat = DataUtils.getCategoryTree(catId);
            ArrayNode newCat = mapper.createArrayNode();
            for (int j = 0; j < cat.size(); j++) {
                JsonNode catItem = cat.get(j);
                if (catItem != null) {
                    removeLayerFromCategory(ids, catItem, newCat);
                }
            }
            updateCategoryTree(catId, newCat);
//                log.error("Error remove layers from category.");
        }
    }

    private void removeLayerFromCategory(String[] ids, JsonNode item, ArrayNode list) {
        ObjectNode obj = null;
//        try {
        boolean layerExist = false;
        if (item.hasNonNull(DataUtils.LAYER_KEY_LAYERBODID)) {
            String layerBodId = item.get(DataUtils.LAYER_KEY_LAYERBODID).textValue();
            if (layerBodId != null) {
                if (ids != null) {
                    for (String id : ids) {
                        if (layerBodId.equals(id)) {
                            layerExist = true;
                        }
                    }
                } else {
                    layerExist = true;
                }
            }
        }
        if (!layerExist) {
            obj = (ObjectNode) item;
            if (item.hasNonNull(DataUtils.CATEGORY_KEY_CHILDREN)) {
                ArrayNode children = (ArrayNode) item.get(DataUtils.CATEGORY_KEY_CHILDREN);
                if (children != null) {
                    ArrayNode childList = mapper.createArrayNode();
                    for (int j = 0; j < children.size(); j++) {
                        JsonNode catItem = children.get(j);
                        removeLayerFromCategory(ids, catItem, childList);
                    }
                    obj.put(DataUtils.CATEGORY_KEY_CHILDREN, childList);
                }
            }
        }
//            log.error("Error remove layers from category: " + e);
        if (obj != null) {
            list.add(obj);
        }
    }

    private ArrayNode addCategory(JsonNode catelog) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_CATALOGS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if (StringUtils.isNotEmpty(fileContent)) {
                try {
                    JsonNode obj = mapper.readTree(fileContent);
                    ObjectNode rootItem = mapper.createObjectNode();
                    rootItem.put("category", "root");
                    rootItem.put("staging", "prod");
                    rootItem.put("id", 1);
                    rootItem.put(DataUtils.CATEGORY_KEY_CHILDREN, mapper.createArrayNode());
                    ObjectNode root = mapper.createObjectNode();
                    root.put("root", rootItem);
                    ObjectNode results = mapper.createObjectNode();
                    results.put("results", root);
                    Utils.createFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + catelog.get("id") + DataUtils.FILEFORMAT_JSON, results);
                    ((ArrayNode) obj.get(DataUtils.CATEGORY_KEY_TOPICS)).add(catelog);
                    Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_CATALOGS + DataUtils.FILEFORMAT_JSON, obj);
                } catch (JsonProcessingException e) {
                    log.error("Error 'addCategory'!");
                }
            }
        }
        return DataUtils.getCategories();
    }

    private ArrayNode updateCategory(String id, JsonNode item) {
        if (id != null && item != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
            if (StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_CATALOGS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                if (StringUtils.isNotEmpty(fileContent)) {
                    try {
                        JsonNode obj = mapper.readTree(fileContent);
                        ArrayNode topics = (ArrayNode) obj.get(DataUtils.CATEGORY_KEY_TOPICS);
                        for (int i = 0; i < topics.size(); i++) {
                            JsonNode tmpObj = topics.get(i);
                            if (tmpObj.get("id").equals(id)) {
//                                topics.add(i, item); // TODO: !!!
                                topics.add(item);
                                break;
                            }
                        }
                        Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_CATALOGS + DataUtils.FILEFORMAT_JSON, obj);
                    } catch (JsonProcessingException e) {
                        log.error("Error 'updateCategory'!");
                    }
                }
            }
        }
        return DataUtils.getCategories();
    }

    private ArrayNode deleteCategory(String id) {
        if (id != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
            if (StringUtils.isNotEmpty(configDir)) {
                String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_CATALOGS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
                if (StringUtils.isNotEmpty(fileContent)) {
                    try {
                        ObjectNode obj = (ObjectNode) mapper.readTree(fileContent);
                        ArrayNode topics = (ArrayNode) obj.get(DataUtils.CATEGORY_KEY_TOPICS);
                        ArrayNode newTopics = mapper.createArrayNode();
                        for (int i = 0; i < topics.size(); i++) {
                            JsonNode tmpObj = topics.get(i);
                            if (!tmpObj.get("id").equals(id)) {
                                newTopics.add(tmpObj);
                            }
                        }
                        obj.put(DataUtils.CATEGORY_KEY_TOPICS, newTopics);
                        Utils.removeFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + id + DataUtils.FILEFORMAT_JSON);
                        Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_CATALOGS + DataUtils.FILEFORMAT_JSON, obj);
                        deleteCategoriesLocales(id);
                    } catch (JsonProcessingException e) {
                        log.error("Error 'deleteCategory'!");
                    }
                }
            }
        }
        return DataUtils.getCategories();
    }

    private void deleteCategoriesLocales(String id) throws JsonProcessingException {
        ArrayList<String> list = new ArrayList<>();
        list.add(id);
        list.add("topic_" + id + "_tooltip");
        list.add(id + "_service_link_href");
        list.add(id + "_service_link_label");
        deleteLocale("de", list);
    }

    private ArrayNode deleteCategories() {
        return deleteCategories(null);
    }

    private ArrayNode deleteCategories(String[] ids) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_CATALOGS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if (StringUtils.isNotEmpty(fileContent)) {
                try {
                    ObjectNode obj = (ObjectNode) mapper.readTree(fileContent);
                    ArrayNode topics = (ArrayNode) obj.get(DataUtils.CATEGORY_KEY_TOPICS);
                    ArrayNode newTopics = mapper.createArrayNode();
                    for (int i = 0; i < topics.size(); i++) {
                        JsonNode tmpObj = topics.get(i);
                        boolean toDelete = false;
                        if (ids != null) {
                            for (String id : ids) {
                                if (id != null && id.length() > 0 && tmpObj.get("id").equals(id)) {
                                    Utils.removeFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + id + DataUtils.FILEFORMAT_JSON);
                                    deleteCategoriesLocales(id);
                                    toDelete = true;
                                    break;
                                }
                            }
                        } else {
                            String id = tmpObj.get("id").textValue();
                            Utils.removeFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_PREFIX_CATALOG + id + DataUtils.FILEFORMAT_JSON);
                            deleteCategoriesLocales(id);
                            toDelete = true;
                        }
                        if (!toDelete) {
                            newTopics.add(tmpObj);
                        }
                    }
                    obj.put(DataUtils.CATEGORY_KEY_TOPICS, newTopics);
                    Utils.updateFile(DataUtils.CONFIG_PATH_DATA + DataUtils.FILE_NAME_CATALOGS + DataUtils.FILEFORMAT_JSON, obj);
                } catch (JsonProcessingException e) {
                    log.error("Error 'deleteLayer'!");
                }
            }
        }
        return DataUtils.getCategories();
    }

    private void updateCategoryLayersId(ObjectNode catItem, String id, String newId) {
        String key = DataUtils.LAYER_KEY_LAYERBODID;
        if (!catItem.get(key).isNull()) {
            String layerBodId = catItem.get(key).textValue();
            if (layerBodId != null && layerBodId.equals(id)) {
                catItem.put(DataUtils.LAYER_KEY_LAYERBODID, newId);
            }
        }

        key = DataUtils.CATEGORY_KEY_CHILDREN;
        if (!catItem.get(key).isNull()) {
            ArrayNode children = (ArrayNode) catItem.get(key);
            if (children != null) {
                for (int i = 0; i < children.size(); i++) {
                    JsonNode child = children.get(i);
                    if (child != null) {
                        updateCategoryLayersId((ObjectNode) child, id, newId);
                    }
                }
            }
        }
    }
}
