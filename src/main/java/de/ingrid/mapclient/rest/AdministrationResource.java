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
import java.util.Iterator;
import java.util.Properties;

import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
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
    public Response getLayerList() {
        JSONArray arr = getLayers(null);
        if(arr != null) {
            return Response.ok( arr ).build();
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
        JSONArray arr = deleteLayer(id);
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

    private JSONArray updateCategoryTree(String id, JSONArray item) {
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
            root.put("children", item);
            updateFile("data/catalog-" + id + ".json", obj);
            return item;
        } catch (Exception e) {
            log.error("Error 'updateCategoryTree'!");
        }
        return arr;
    }

    private JSONArray getLayers(String id) {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "layers", ".json", "data/");
        }
        JSONArray arr = new JSONArray();
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
                        tmpObj.put("item", obj.get(key));
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
                JSONObject obj = new JSONObject(fileContent);
                for (int i = 0; i < layers.length(); i++) {
                    JSONObject tmpObj = layers.getJSONObject(i);
                    String id = tmpObj.getString("id");
                    if(obj.has(id)) {
                        id = generateID(obj, id);
                    }
                    obj.put(id, tmpObj.get("item"));
                }
                updateFile("data/layers.json", obj);
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
        return id;
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
                String newId = layerItem.getString("id");
                if(newId != null  && id.equals(newId)) {
                    layerItem.remove("id");
                    obj.put(id, layerItem);
                } else {
                    // TODO: Update catalog files.
                    String newObj = obj.toString();
                    newObj = newObj.replaceAll(id, newId);
                    obj = new JSONObject(newObj);
                    layerItem.remove("id");
                    obj.put(newId, layerItem);
                }
                updateFile("data/layers.json", obj);
            } catch (JSONException e) {
                log.error("Error 'updateLayer'!");
            }
        }
        return getLayers(null);
    }
    
    private JSONArray deleteLayer(String id) {
        if(id != null) {
            Properties p = ConfigurationProvider.INSTANCE.getProperties();
            String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
            String fileContent = null;
            if(config_dir != null){
                fileContent = Utils.getFileContent(config_dir, "layers", ".json", "data/");
            }
            try {
                JSONObject obj = new JSONObject(fileContent);
                obj.remove(id);
                updateFile("data/layers.json", obj);
            } catch (JSONException e) {
                log.error("Error 'deleteLayer'!");
            }
        }
        return getLayers(null);
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
            } catch (JSONException e) {
                log.error("Error 'deleteCategory'!");
            }
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
        if(cpFile.exists()){
            cpFile.delete();
        }
        File file = new File(config_dir.concat(filename));
        file.renameTo( cpFile );
        file = new File(config_dir.concat(filename));
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
            file.delete();
        }
    }
}
