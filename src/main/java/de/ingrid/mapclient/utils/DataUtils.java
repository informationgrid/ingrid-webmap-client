package de.ingrid.mapclient.utils;

import java.util.Iterator;
import java.util.Properties;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import de.ingrid.mapclient.ConfigurationProvider;

public class DataUtils {

    public static final String FILEFORMAT_JSON         = ".json";
    
    public static final String CONFIG_PATH_HELP        = "help/";
    public static final String CONFIG_PATH_DATA        = "data/";
    public static final String CONFIG_PATH_LOCALES     = "locales/";
    
    public static final String FILE_PREFIX_CATALOG     = "catalog-";
    public static final String FILE_PREFIX_HELP        = "help-";
    public static final String FILE_PREFIX_PROFILE     = ".profile";
    public static final String FILE_NAME_CATALOGS      = "catalogs";
    public static final String FILE_NAME_LAYERS        = "layers";
    
    public static final String CATEGORY_KEY_TOPICS     = "topics";
    public static final String CATEGORY_KEY_CHILDREN   = "children";
    public static final String CATEGORY_KEY_LABEL      = "label";
    public static final String LAYER_KEY_LAYERBODID    = "layerBodId";
    public static final String LAYER_KEY_LABEL         = "label";
    public static final String LAYER_KEY_ID            = "label";
    public static final String LAYER_KEY_WMSURL        = "wmsUrl";
    public static final String LAYER_KEY_SERVICEURL    = "serviceUrl";
    
    public static final String LAYER_KEY_BACKGROUND    = "background";
    public static final String HELP_KEY_TITLE          = "title";
    public static final String HELP_KEY_TEXT           = "text";
    public static final String HELP_KEY_IMAGE          = "image";

    private static final Logger log = Logger.getLogger( DataUtils.class );

    
    public static JSONArray getLayers(String id) {
        return getLayers(id, false);
    }

    public static JSONArray getLayers(String id, boolean compress) {
        JSONArray arr = new JSONArray();
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_NAME_LAYERS, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
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
                                    if(item.has(DataUtils.LAYER_KEY_LABEL)) {
                                        itemCompress.put(DataUtils.LAYER_KEY_LABEL, item.get(DataUtils.LAYER_KEY_LABEL));
                                    }
                                    if(item.has(DataUtils.LAYER_KEY_BACKGROUND)) {
                                        itemCompress.put(DataUtils.LAYER_KEY_BACKGROUND, item.get(DataUtils.LAYER_KEY_BACKGROUND));
                                    }
                                    tmpObj.put("item", itemCompress);
                                } else {
                                    tmpObj.put("item", obj.get(key));
                                }
                                arr.put(tmpObj);
                            }
                        }
                    }
                } catch (JSONException e) {
                    log.error("Error 'getLayers'!");
                }
            }
        }
        return arr;
    }

    /*
     * CATEGORIES
     */
    public static JSONArray getCategories() {
        JSONArray arr = new JSONArray();
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, FILE_NAME_CATALOGS, FILEFORMAT_JSON, CONFIG_PATH_DATA);
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
                    return obj.getJSONArray(CATEGORY_KEY_TOPICS);
                } catch (JSONException e) {
                    log.error("Error 'getCategories'!");
                }
            }
        }
        return arr;
    }
    
    public static JSONArray getCategoryByLayerId(String id, boolean isExpanded) {
        JSONArray categories = DataUtils.getCategories();
        JSONArray categoriesWithLayerId = new JSONArray();
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
                                filterCategory.put(DataUtils.CATEGORY_KEY_LABEL, categoryId);
                                filterCategory.put(DataUtils.CATEGORY_KEY_CHILDREN, filterCategoryTree);
                                categoriesWithLayerId.put(filterCategory);
                            }
                        }
                    }
                } catch (JSONException e) {
                    log.error("Error on getCategoryByLayerId: " + e);
                }
            }
        }
        return categoriesWithLayerId;
    }

    public static JSONArray getCategoryTree(String id) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, DataUtils.FILE_PREFIX_CATALOG + id, DataUtils.FILEFORMAT_JSON, DataUtils.CONFIG_PATH_DATA);
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject obj = new JSONObject(fileContent);
                    JSONObject results = obj.getJSONObject("results");
                    JSONObject root = results.getJSONObject("root");
                    return root.getJSONArray(DataUtils.CATEGORY_KEY_CHILDREN);
                } catch (JSONException e) {
                    log.error("Error 'getCategoryTree'!");
                }
            }
        }
        return new JSONArray();
    }
    
    public static void filteredTreeLeafById(JSONArray categoryTree, String id, JSONArray filterCategoryTree, boolean isExpanded) {
        if(categoryTree != null) {
            try {
                for (int i = 0; i < categoryTree.length(); i++) {
                    JSONObject categoryTreeBranch = categoryTree.getJSONObject(i);
                    if(categoryTreeBranch.has(DataUtils.CATEGORY_KEY_CHILDREN)) {
                        JSONArray categoryTreeBranchChildren = categoryTreeBranch.getJSONArray(DataUtils.CATEGORY_KEY_CHILDREN);
                        JSONArray filterCategoryTreeChildren = new JSONArray();
                        if(categoryTreeBranchChildren != null) {
                            filteredTreeLeafById(categoryTreeBranchChildren, id, filterCategoryTreeChildren, isExpanded);
                            if(filterCategoryTreeChildren.length() > 0) {
                                categoryTreeBranch.put(DataUtils.CATEGORY_KEY_CHILDREN, filterCategoryTreeChildren);
                                if(isExpanded) {
                                    categoryTreeBranch.put("isExpanded", isExpanded);
                                }
                                filterCategoryTree.put(categoryTreeBranch);
                            }
                        }
                    }
                    if(categoryTreeBranch.has(DataUtils.LAYER_KEY_LAYERBODID)) {
                        String layerBodId = categoryTreeBranch.getString(DataUtils.LAYER_KEY_LAYERBODID);
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
    
    public static JSONObject getPaginationArray(JSONArray arr, int currentPage, int lastPage, int firstNumOfLayers, int totalNumOfLayersPerPage) {
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

    public static JSONArray getFilterArrayString(JSONArray arr, String searchText, String[] keys) {
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
    
    public static void searchStringValue(JSONObject item, String searchText, String[] keys, JSONArray arrSearch) throws JSONException {
        searchStringValue(item, searchText, keys, arrSearch, item);
    }

    public static void searchStringValue(JSONObject obj, String searchText, String[] keys, JSONArray arrSearch, JSONObject parentObj) throws JSONException {
        boolean hasAdd = false;
        for (String key : keys) {
            if(obj.has(key)){
                String value = obj.getString(key);
                if(searchText != null && searchText.length() > 0 && value.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
                    arrSearch.put(parentObj);
                    hasAdd = true;
                    break;
                }
            }
        }
        if(obj.has("item") && !hasAdd) {
            JSONObject item = obj.getJSONObject("item");
            searchStringValue(item, searchText, keys, arrSearch, parentObj);
        }
    }

    public static JSONArray getFilterArrayBoolean(JSONArray arr, boolean searchFlag, String[] keys) {
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

    public static void searchBooleanValue(JSONObject item, boolean searchFlag, String[] keys, JSONArray arrSearch) throws JSONException {
        searchBooleanValue(item, searchFlag, keys, arrSearch, item, true);
    }

    public static void searchBooleanValue(JSONObject obj, boolean searchFlag, String[] keys, JSONArray arrSearch, JSONObject parentObj, boolean checkHasContentOnly) throws JSONException {
        for (String key : keys) {
            if(obj.has(key)){
                if(checkHasContentOnly) {
                    arrSearch.put(parentObj);
                } else {
                    String value = obj.getString(key);
                    if(value.equals("true")) {
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

    public static JSONArray getFilterCategory (JSONArray arr, String searchCategory) {
        JSONArray categoryTree = DataUtils.getCategoryTree(searchCategory);
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

    public static boolean searchCategoryValue(String searchId, JSONArray categoryTree) throws JSONException {
        boolean hasValue = false;
        for (int i = 0; i < categoryTree.length(); i++) {
            JSONObject obj = categoryTree.getJSONObject(i);
            if(obj.has(DataUtils.LAYER_KEY_LAYERBODID)) {
                String layerBodId = obj.getString(DataUtils.LAYER_KEY_LAYERBODID);
                if(layerBodId.equals(searchId)) {
                    hasValue = true;
                    break;
                }
            }
            if(obj.has(DataUtils.CATEGORY_KEY_CHILDREN)) {
                JSONArray children = obj.getJSONArray(DataUtils.CATEGORY_KEY_CHILDREN);
                if(searchCategoryValue(searchId, children)) {
                    hasValue = true;
                    break;
                }
            }
        }
        return hasValue;
    }
}