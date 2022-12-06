/*-
 * **************************************************-
 * InGrid Map Client
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
package de.ingrid.mapclient.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.ingrid.mapclient.ConfigurationProvider;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.json.JSONException;

import java.util.Iterator;
import java.util.Map;
import java.util.Properties;

public class DataUtils {

    public static final String FILEFORMAT_JSON = ".json";

    public static final String CONFIG_PATH_HELP = "help/";
    public static final String CONFIG_PATH_DATA = "data/";
    public static final String CONFIG_PATH_LOCALES = "locales/";

    public static final String FILE_PREFIX_CATALOG = "catalog-";
    public static final String FILE_PREFIX_HELP = "help-";
    public static final String FILE_PREFIX_PROFILE = ".profile";
    public static final String FILE_NAME_CATALOGS = "catalogs";
    public static final String FILE_NAME_LAYERS = "layers";

    public static final String CATEGORY_KEY_TOPICS = "topics";
    public static final String CATEGORY_KEY_CHILDREN = "children";
    public static final String CATEGORY_KEY_LABEL = "label";
    public static final String LAYER_KEY_LAYERBODID = "layerBodId";
    public static final String LAYER_KEY_LABEL = "label";
    public static final String LAYER_KEY_ID = "label";
    public static final String LAYER_KEY_WMSURL = "wmsUrl";
    public static final String LAYER_KEY_SERVICEURL = "serviceUrl";

    public static final String LAYER_KEY_BACKGROUND = "background";
    public static final String HELP_KEY_TITLE = "title";
    public static final String HELP_KEY_TEXT = "text";
    public static final String HELP_KEY_IMAGE = "image";

    private static final Logger log = Logger.getLogger(DataUtils.class);

    private static final ObjectMapper mapper = new ObjectMapper();

    public static ArrayNode getLayers(String id) {
        return getLayers(id, false);
    }

    public static ArrayNode getLayers(String id, boolean compress) {
        ArrayNode arr = mapper.createArrayNode();
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_LAYERS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if (StringUtils.isNotEmpty(fileContent)) {
                try {
                    JsonNode obj = mapper.readTree(fileContent);
                    if (id != null) {
                        ObjectNode tmpObj = mapper.createObjectNode();
                        tmpObj.put("id", id);
                        tmpObj.put("item", obj.get(id));
                        arr.add(tmpObj);
                    } else {
                        Iterator<Map.Entry<String, JsonNode>> keys = obj.fields();
                        while (keys.hasNext()) {
                            Map.Entry<String, JsonNode> key = keys.next();
                            if (obj.get(key.getKey()) instanceof ObjectNode) {
                                ObjectNode tmpObj = mapper.createObjectNode();
                                tmpObj.put("id", key.getKey());
                                if (compress) {
                                    ObjectNode item = (ObjectNode) obj.get(key.getKey());
                                    ObjectNode itemCompress = mapper.createObjectNode();
                                    itemCompress.put("id", key.getKey());
                                    if (item.has(DataUtils.LAYER_KEY_LABEL)) {
                                        itemCompress.set(DataUtils.LAYER_KEY_LABEL, item.get(DataUtils.LAYER_KEY_LABEL));
                                    }
                                    if (item.has(DataUtils.LAYER_KEY_BACKGROUND)) {
                                        itemCompress.set(DataUtils.LAYER_KEY_BACKGROUND, item.get(DataUtils.LAYER_KEY_BACKGROUND));
                                    }
                                    tmpObj.set("item", itemCompress);
                                } else {
                                    tmpObj.set("item", obj.get(key.getKey()));
                                }
                                arr.add(tmpObj);
                            }
                        }
                    }
                } catch (JsonProcessingException e) {
                    log.error("Error 'getLayers'!");
                }
            }
        }
        return arr;
    }

    /*
     * CATEGORIES
     */
    public static ArrayNode getCategories() {
        ArrayNode arr = mapper.createArrayNode();
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, FILE_NAME_CATALOGS, FILEFORMAT_JSON, CONFIG_PATH_DATA);
            if (StringUtils.isNotEmpty(fileContent)) {
                try {
                    JsonNode obj = mapper.readTree(fileContent);
                    return (ArrayNode) obj.get(CATEGORY_KEY_TOPICS);
                } catch (JsonProcessingException e) {
                    log.error("Error 'getCategories'!");
                }
            }
        }
        return arr;
    }

    public static ArrayNode getCategoryByLayerId(String id, boolean isExpanded) {
        ArrayNode categories = DataUtils.getCategories();
        ArrayNode categoriesWithLayerId = mapper.createArrayNode();
        if (categories != null) {
            for (int i = 0; i < categories.size(); i++) {
                JsonNode category = categories.get(i);
                if (category != null && category.has("id")) {
                    String categoryId = category.get("id").textValue();
                    ArrayNode categoryTree = getCategoryTree(categoryId);
                    if (categoryTree != null) {
                        ArrayNode filterCategoryTree = mapper.createArrayNode();
                        filteredTreeLeafById(categoryTree, id, filterCategoryTree, isExpanded);
                        if (filterCategoryTree.size() > 0) {
                            ObjectNode filterCategory = mapper.createObjectNode();
                            filterCategory.put(DataUtils.CATEGORY_KEY_LABEL, categoryId);
                            filterCategory.set(DataUtils.CATEGORY_KEY_CHILDREN, filterCategoryTree);
                            categoriesWithLayerId.add(filterCategory);
                        }
                    }
                }
            }
        }
        return categoriesWithLayerId;
    }

    public static ArrayNode getCategoryTree(String id) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty(ConfigurationProvider.CONFIG_DIR);
        if (StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_PREFIX_CATALOG + id, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if (StringUtils.isNotEmpty(fileContent)) {
                try {
                    JsonNode obj = mapper.readTree(fileContent);
                    JsonNode results = obj.get("results");
                    JsonNode root = results.get("root");
                    return (ArrayNode) root.get(DataUtils.CATEGORY_KEY_CHILDREN);
                } catch (JsonProcessingException e) {
                    log.error("Error 'getCategoryTree'!");
                }
            }
        }
        return mapper.createArrayNode();
    }

    public static void filteredTreeLeafById(ArrayNode categoryTree, String id, ArrayNode filterCategoryTree, boolean isExpanded) {
        if (categoryTree != null) {
            for (int i = 0; i < categoryTree.size(); i++) {
                ObjectNode categoryTreeBranch = (ObjectNode) categoryTree.get(i);
                if (categoryTreeBranch.has(DataUtils.CATEGORY_KEY_CHILDREN)) {
                    ArrayNode categoryTreeBranchChildren = (ArrayNode) categoryTreeBranch.get(DataUtils.CATEGORY_KEY_CHILDREN);
                    ArrayNode filterCategoryTreeChildren = mapper.createArrayNode();
                    if (categoryTreeBranchChildren != null) {
                        filteredTreeLeafById(categoryTreeBranchChildren, id, filterCategoryTreeChildren, isExpanded);
                        if (filterCategoryTreeChildren.size() > 0) {
                            categoryTreeBranch.put(DataUtils.CATEGORY_KEY_CHILDREN, filterCategoryTreeChildren);
                            if (isExpanded) {
                                categoryTreeBranch.put("isExpanded", isExpanded);
                            }
                            filterCategoryTree.add(categoryTreeBranch);
                        }
                    }
                }
                if (categoryTreeBranch.has(DataUtils.LAYER_KEY_LAYERBODID)) {
                    String layerBodId = categoryTreeBranch.get(DataUtils.LAYER_KEY_LAYERBODID).textValue();
                    if (layerBodId.equals(id)) {
                        filterCategoryTree.add(categoryTreeBranch);
                    }
                }
            }
        }
    }

    public static ObjectNode getPaginationArray(ArrayNode arr, int currentPage, int lastPage, int firstNumOfLayers, int totalNumOfLayersPerPage) {
        ObjectNode obj = mapper.createObjectNode();
        ArrayNode arrPagination = mapper.createArrayNode();
        obj.put("firstPage", currentPage);
        obj.put("lastPage", lastPage);
        obj.put("totalItemsNum", arr.size());
        for (int i = firstNumOfLayers; i < totalNumOfLayersPerPage; i++) {
            if (i <= arr.size() - 1) {
                arrPagination.add(arr.get(i));
            }
        }
        obj.put("items", arrPagination);
        return obj;
    }

    public static ArrayNode getFilterArrayString(ArrayNode arr, String searchText, String[] keys) {
        ArrayNode arrSearch = mapper.createArrayNode();
        for (int i = 0; i < arr.size(); i++) {
            JsonNode obj;
            try {
                obj = arr.get(i);
                searchStringValue(obj, searchText, keys, arrSearch);
            } catch (JSONException e) {
                log.error("Error on search layers 'getFilterArrayString'!");
            }
        }
        return arrSearch;
    }

    public static void searchStringValue(JsonNode item, String searchText, String[] keys, ArrayNode arrSearch) throws JSONException {
        searchStringValue(item, searchText, keys, arrSearch, item);
    }

    public static void searchStringValue(JsonNode obj, String searchText, String[] keys, ArrayNode arrSearch, JsonNode parentObj) {
        boolean hasAdd = false;
        for (String key : keys) {
            if (obj.has(key)) {
                String value = obj.get(key).textValue();
                if (searchText != null && searchText.length() > 0 && value.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
                    arrSearch.add(parentObj);
                    hasAdd = true;
                    break;
                }
            }
        }
        if (obj.has("item") && !hasAdd) {
            JsonNode item = obj.get("item");
            searchStringValue(item, searchText, keys, arrSearch, parentObj);
        }
    }

    public static ArrayNode getFilterArrayBoolean(ArrayNode arr, boolean searchFlag, String[] keys) {
        ArrayNode arrSearch = mapper.createArrayNode();
        for (int i = 0; i < arr.size(); i++) {
            JsonNode obj;
            try {
                obj = arr.get(i);
                searchBooleanValue(obj, searchFlag, keys, arrSearch);
            } catch (JSONException e) {
                log.error("Error on search layers 'getFilterArrayBoolean'!");
            }
        }
        return arrSearch;
    }

    public static void searchBooleanValue(JsonNode item, boolean searchFlag, String[] keys, ArrayNode arrSearch) throws JSONException {
        searchBooleanValue(item, searchFlag, keys, arrSearch, item, true);
    }

    public static void searchBooleanValue(JsonNode obj, boolean searchFlag, String[] keys, ArrayNode arrSearch, JsonNode parentObj, boolean checkHasContentOnly) {
        for (String key : keys) {
            if (obj.has(key)) {
                if (checkHasContentOnly) {
                    arrSearch.add(parentObj);
                } else {
                    String value = obj.get(key).textValue();
                    if (value.equals("true")) {
                        arrSearch.add(parentObj);
                    }
                }
            }
        }
        if (obj.has("item")) {
            JsonNode item = obj.get("item");
            searchBooleanValue(item, searchFlag, keys, arrSearch, parentObj, checkHasContentOnly);
        }
    }

    public static ArrayNode getFilterCategory(ArrayNode arr, String searchCategory) {
        ArrayNode categoryTree = DataUtils.getCategoryTree(searchCategory);
        ArrayNode arrSearch = mapper.createArrayNode();
        for (int i = 0; i < arr.size(); i++) {
            JsonNode obj;
            try {
                obj = arr.get(i);
                if (obj.has("id")) {
                    String id = obj.get("id").textValue();
                    if (searchCategoryValue(id, categoryTree)) {
                        arrSearch.add(obj);
                    }
                }
            } catch (JSONException e) {
                log.error("Error on search layers 'getFilterCategory'!");
            }
        }
        return arrSearch;
    }

    public static boolean searchCategoryValue(String searchId, ArrayNode categoryTree) throws JSONException {
        boolean hasValue = false;
        for (int i = 0; i < categoryTree.size(); i++) {
            JsonNode obj = categoryTree.get(i);
            if (obj.has(DataUtils.LAYER_KEY_LAYERBODID)) {
                String layerBodId = obj.get(DataUtils.LAYER_KEY_LAYERBODID).textValue();
                if (layerBodId.equals(searchId)) {
                    hasValue = true;
                    break;
                }
            }
            if (obj.has(DataUtils.CATEGORY_KEY_CHILDREN)) {
                ArrayNode children = (ArrayNode) obj.get(DataUtils.CATEGORY_KEY_CHILDREN);
                if (searchCategoryValue(searchId, children)) {
                    hasValue = true;
                    break;
                }
            }
        }
        return hasValue;
    }
}
