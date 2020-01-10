/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2020 wemove digital solutions GmbH
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
package de.ingrid.mapclient.scheduler.tasks;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Properties;

import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.operation.TransformException;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import de.ingrid.geo.utils.transformation.CoordTransformUtil;
import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.Constants;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.model.GetCapabilitiesDocument;
import de.ingrid.mapclient.utils.Utils;

public class CapabilitiesUpdateTask implements Runnable{
    
    private static final Logger log = Logger.getLogger(CapabilitiesUpdateTask.class);
    private static final String[] FIELD_XY = {"./@minx", "./@miny", "./@maxx", "./@maxy"};
    private static final String[] FIELD_BOUND = {"./westBoundLongitude", "./southBoundLatitude", "./eastBoundLongitude", "./northBoundLatitude"};
    
    private String defaultEpsg = "EPSG:3857";
    private String defaultExtent = "[0,0,0,0]";
    
    public void run() {
        log.info("Update WebMapClient capabilitities ...");
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        boolean hasChanges = false;
        
        try {
            defaultEpsg = getSettingProperty("settingEpsg", "EPSG:3857");
            defaultExtent = getSettingProperty("settingExtent", "[0,0,0,0]");
        } catch (Exception e) {
            log.info("Use default value :" + defaultEpsg);
        }
        
        if(StringUtils.isNotEmpty(configDir)) {
            String fileContent = Utils.getFileContent(configDir, "layers", ".json", "data/");
            if(StringUtils.isNotEmpty(fileContent)) {
                try {
                    JSONObject layersJson = new JSONObject( fileContent );
                    HashMap<String, Document> mapCapabilities = new HashMap<>();
                    ArrayList<String> errorUrls = new ArrayList<>();
                    ArrayList<String> errorLayernames = new ArrayList<>();
                    
                    Document doc = null;
                    XPath xpath = XPathFactory.newInstance().newXPath();
                    
                    Iterator<?> keys = layersJson.keys();
                    while( keys.hasNext() ) {
                        String key = (String)keys.next();
                        JSONObject layerJSON = layersJson.getJSONObject( key );
                        // Reset values
                        layerJSON.remove(Constants.LAYER_STATUS);
                        if(!layerJSON.has("extent")) {
                            hasChanges = true;
                            layerJSON.put("extent", new JSONArray(defaultExtent));
                        }
                        String layerVersion = null;
                        String layerType = null;
                        String login = null;
                        
                        if(layerJSON.has( Constants.TYPE )) {
                            layerType = layerJSON.getString( Constants.TYPE );
                        }
                        if(layerJSON.has(Constants.VERSION)) {
                            layerVersion = layerJSON.getString( Constants.VERSION );
                        }
                        if(layerJSON.has(Constants.AUTH)) {
                            login = layerJSON.getString( Constants.AUTH );
                        }
                        if(layerType.equals( de.ingrid.mapclient.Constants.TYPE_WMS )) {
                            if(layerJSON.has( Constants.WMS_URL)) {
                                StringBuilder layerWmsUrl = new StringBuilder(layerJSON.getString( Constants.WMS_URL ));
                                if(layerWmsUrl != null){
                                    try {
                                        if(layerWmsUrl.indexOf( "?" ) == -1){
                                            layerWmsUrl.append("?");
                                        }
                                        if(layerWmsUrl.toString().toLowerCase().indexOf( "service=" )  == -1){
                                            layerWmsUrl.append("&SERVICE=WMS");
                                        }
                                        if(layerWmsUrl.toString().toLowerCase().indexOf( "request=" )  == -1){
                                            layerWmsUrl.append("&REQUEST=GetCapabilities");
                                        }
                                        if(layerWmsUrl.toString().toLowerCase().indexOf( "version=" )  == -1){
                                            if(layerVersion == null) {
                                                layerWmsUrl.append("&VERSION=1.3.0");
                                            } else {
                                                layerWmsUrl.append("&VERSION=").append(layerVersion);
                                            }
                                        }
                                        if(!errorUrls.contains(layerWmsUrl.toString())) {
                                            doc = mapCapabilities.get( layerWmsUrl.toString() );
                                            if(doc == null){
                                                log.debug( "Load capabilities: " + layerWmsUrl);
                                                GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest( layerWmsUrl.toString(), login);
                                                if(getCapabilities != null) {
                                                    if (getCapabilities.getXml().indexOf( "serviceexception" ) > -1) {
                                                        hasChanges = true;
                                                        layerJSON.put(Constants.LAYER_STATUS, Constants.STATUS_SERVICE_NOT_EXIST);
                                                    } else {
                                                        doc =  getCapabilities.getDoc();
                                                        mapCapabilities.put( layerWmsUrl.toString(), doc );
                                                        boolean hasChangesLayer = updateLayerWMSInformation(doc, xpath, layerJSON, layerWmsUrl.toString(), errorLayernames, key);
                                                        if(hasChangesLayer){
                                                            hasChanges = hasChangesLayer;
                                                        }
                                                    }
                                                }
                                            } else {
                                                log.debug( "Load capabilities from existing doc: " + layerWmsUrl);
                                                boolean hasChangesLayer = updateLayerWMSInformation(doc, xpath, layerJSON, layerWmsUrl.toString(), errorLayernames, key);
                                                if(hasChangesLayer){
                                                    hasChanges = hasChangesLayer;
                                                }
                                            }
                                        } else {
                                            hasChanges = true;
                                            layerJSON.put(Constants.LAYER_STATUS, Constants.STATUS_SERVICE_NOT_EXIST);
                                        }
                                    } catch (Exception e) {
                                        hasChanges = true;
                                        layerJSON.put(Constants.LAYER_STATUS, Constants.STATUS_SERVICE_NOT_EXIST);
                                        if(!errorUrls.contains(layerWmsUrl.toString())){
                                            errorUrls.add(layerWmsUrl.toString());
                                        }
                                    }
                                }
                            }
                        } else if(layerType.equals( Constants.TYPE_WMTS ) && layerJSON.has( Constants.WMTS_URL)) {
                            String layerWtmsUrl = layerJSON.getString( Constants.WMTS_URL );
                            if(layerWtmsUrl != null){
                                try {
                                    if(!errorUrls.contains(layerWtmsUrl)) {
                                        doc = mapCapabilities.get( layerWtmsUrl );
                                        if(doc == null){
                                            log.debug( "Load capabilities: " + layerWtmsUrl);
                                            GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest( layerWtmsUrl, login);
                                            if (getCapabilities != null) {
                                                if (getCapabilities.getXml().toLowerCase().indexOf( "serviceexception" ) > -1) {
                                                    hasChanges = true;
                                                    layerJSON.put(Constants.LAYER_STATUS, Constants.STATUS_SERVICE_NOT_EXIST);
                                                } else {
                                                    doc = getCapabilities.getDoc();
                                                    mapCapabilities.put( layerWtmsUrl, doc );
                                                    boolean hasChangesLayer = updateLayerWTMSInformation(doc, xpath, layerJSON, layerWtmsUrl, errorLayernames, key);
                                                    if(hasChangesLayer){
                                                        hasChanges = hasChangesLayer;
                                                    }
                                                }
                                            }
                                        } else {
                                            log.debug( "Load capabilities from existing doc: " + layerWtmsUrl);
                                            boolean hasChangesLayer = updateLayerWTMSInformation(doc, xpath, layerJSON, layerWtmsUrl, errorLayernames, key);
                                            if(hasChangesLayer){
                                                hasChanges = hasChangesLayer;
                                            }
                                        }
                                    } else {
                                        hasChanges = true;
                                        layerJSON.put(Constants.LAYER_STATUS, Constants.STATUS_SERVICE_NOT_EXIST);
                                    }
                                } catch (Exception e) {
                                    hasChanges = true;
                                    layerJSON.put(Constants.LAYER_STATUS, Constants.STATUS_SERVICE_NOT_EXIST);
                                    if(!errorUrls.contains(layerWtmsUrl)){
                                        errorUrls.add(layerWtmsUrl);
                                    }
                                }
                            }
                        }
                    }
                    if(hasChanges){
                        File cpFile = new File(configDir.concat("data/layers.json.") + Utils.getDateFlag());
                        if(cpFile.exists() && cpFile.delete()){
                            log.debug("Delete file: " + cpFile.getName());
                        }
                        File file = new File(configDir.concat("data/layers.json"));
                        if(file.renameTo( cpFile )) {
                            log.debug("Rename file " + file.getName() + " to " + cpFile.getName());
                        }
                        Utils.cleanDirectory(file);
                        file = new File(configDir.concat("data/layers.json"));
                        log.info( "Update file :" + file.getAbsoluteFile() );
                        if(file != null){
                            try(FileWriter fw = new FileWriter(file, true);
                                BufferedWriter bw = new BufferedWriter(fw);
                                PrintWriter out = new PrintWriter(bw))
                            {
                                out.println("{");
                                //more code
                                Iterator<?> keysUpdate = layersJson.keys();
                                while( keysUpdate.hasNext() ) {
                                    String key = (String)keysUpdate.next();
                                    JSONObject layerJSON = layersJson.getJSONObject( key );
                                    out.println("\""+ key+ "\":");
                                    
                                    String layerString = layerJSON.toString();
                                    if(keysUpdate.hasNext()){
                                        layerString += ",";
                                    }
                                    out.println(layerString);
                                }
                                out.println("}");
                                //more code
                            } catch (IOException e) {
                                log.error( "Error write new json file!" );
                            }
                        }
                    } else {
                      log.info( "No layer changes!" );
                    }
                    
                    StringBuilder mailText = new StringBuilder("");
                    
                    if(!errorUrls.isEmpty()){
                        mailText.append("************************\n");
                        mailText.append("Nicht erreichbare Dienste:\n");
                        mailText.append("************************\n");
                        for (String errorUrl : errorUrls) {
                            mailText.append("- " + errorUrl + "\n");
                        }
                    }
                    
                    if(!errorLayernames.isEmpty()){
                        mailText.append("************************\n");
                        mailText.append("Nicht vorhandene Karten:\n");
                        mailText.append("************************\n");
                        for (String errorLayername : errorLayernames) {
                            mailText.append("- " + errorLayername + "\n");
                        }
                    }
                    
                    String from = p.getProperty( ConfigurationProvider.FEEDBACK_FROM );
                    String to = p.getProperty( ConfigurationProvider.FEEDBACK_TO ); 
                    String host = p.getProperty( ConfigurationProvider.FEEDBACK_HOST );
                    String port = p.getProperty( ConfigurationProvider.FEEDBACK_PORT );
                    String user = p.getProperty( ConfigurationProvider.FEEDBACK_USER );
                    String password = p.getProperty( ConfigurationProvider.FEEDBACK_PW );
                    boolean ssl = Boolean.parseBoolean(p.getProperty( ConfigurationProvider.FEEDBACK_SSL ));
                    String protocol = p.getProperty( ConfigurationProvider.FEEDBACK_PROTOCOL );
                    
                    boolean sendMail = Boolean.parseBoolean(p.getProperty( ConfigurationProvider.SCHEDULER_UPDATE_LAYER_MAIL));
                    
                    if(!mailText.toString().isEmpty()){
                        if(sendMail){
                            String subject = "Webmap Client: Fehlerhafte Dienste und Karten";
                            Utils.sendEmail( from, subject, new String[] { to }, mailText.toString(), null, host, port, user, password, ssl, protocol );
                        } else {
                            log.debug( "\n" + mailText );
                        }
                    }
                } catch (JSONException e) {
                    log.error( "Error generate layers JSON array!" );
                }
               
            }
        }
        log.info("Update WebMapClient capabilitities finished.");
    }
    
    private String getSettingProperty(String key, String defaultValue) throws Exception {
        String classPath = "";
        classPath += this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath().split("WEB-INF")[0];
        String fileSetting = classPath + "frontend/config/setting.json";
        
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String fileSettingProfile = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        if(!fileSettingProfile.endsWith( "/" )){
            fileSettingProfile = fileSettingProfile.concat( "/" );
        }
        fileSettingProfile = fileSettingProfile.concat( "/config/setting.profile.json" );
        
        String[] files = { fileSetting, fileSettingProfile };
        return Utils.getPropertyFromJSONFiles(files, key, defaultValue);
    }

    private boolean updateLayerWTMSInformation(Document doc, XPath xpath, JSONObject layerJSON,
            String layerWtmsUrl, ArrayList<String> errorLayernames, String id) throws JSONException, XPathExpressionException {
        boolean hasChanges = false;
        if(layerJSON.has("serverLayerName") && layerJSON.has("matrixSet")) {
            String layerWtmsLayers = layerJSON.getString( "serverLayerName" );
            String matrixSet = layerJSON.getString( "matrixSet" );
            if(layerWtmsLayers != null){
                Node layerNode = (Node) xpath.evaluate("//Layer/Identifier[text()=\""+layerWtmsLayers+"\"]/..", doc, XPathConstants.NODE);
                Node layerMatrixSetNode = (Node) xpath.evaluate("./TileMatrixSetLink/TileMatrixSet[text()=\"" +matrixSet + "\"]/..", layerNode, XPathConstants.NODE);
                if(layerMatrixSetNode != null && layerNode != null) {
                    // Extent
                    Node layerLowerCornerNode = (Node) xpath.evaluate("./WGS84BoundingBox/LowerCorner", layerNode, XPathConstants.NODE);
                    Node layerUpperCornerNode = (Node) xpath.evaluate("./WGS84BoundingBox/UpperCorner", layerNode, XPathConstants.NODE);
                    if(layerLowerCornerNode != null && layerUpperCornerNode != null) {
                        JSONArray array = new JSONArray();
                        String lowerCorner = layerLowerCornerNode.getTextContent().trim();
                        if(lowerCorner.indexOf(' ') > -1) {
                            array.put(Double.parseDouble(lowerCorner.split(" ")[0]));
                            array.put(Double.parseDouble(lowerCorner.split(" ")[1]));
                        }
                        String upperCorner = layerUpperCornerNode.getTextContent().trim();
                        if(upperCorner.indexOf(' ') > -1) {
                            array.put(Double.parseDouble(upperCorner.split(" ")[0]));
                            array.put(Double.parseDouble(upperCorner.split(" ")[1]));
                        }
                        if(array.length() > 0 ) {
                            hasChanges = true;
                            layerJSON.put("extent", array);
                        }
                    }
                    // Format
                    Node layerFormatNode = (Node) xpath.evaluate("./Format", layerNode, XPathConstants.NODE);
                    if(layerFormatNode != null) {
                        String format = layerFormatNode.getTextContent().trim().replace("image/", "");
                        if(layerJSON.has("format")) {
                            if(!layerJSON.getString("format").equals(format)) {
                                hasChanges = true;
                                layerJSON.put("format", format);
                            }
                        } else {
                            hasChanges = true;
                            layerJSON.put("format", format);
                        }
                    }
                    // Template
                    Node layerTemplateNode = (Node) xpath.evaluate("./ResourceURL/@template", layerNode, XPathConstants.NODE);
                    if(layerTemplateNode != null) {
                        String template = layerTemplateNode.getTextContent().trim();
                        if(layerJSON.has("template")) {
                            if(!layerJSON.getString("template").equals(template)) {
                                hasChanges = true;
                                layerJSON.put("template", template);
                            }
                        } else {
                            hasChanges = true;
                            layerJSON.put("template", template);
                        }
                        
                    }
                    // Attribution
                    Node layerAttribution = (Node) xpath.evaluate(".//ServiceProvider/ProviderName", doc, XPathConstants.NODE);
                    if(layerAttribution != null) {
                        String attribution = layerAttribution.getTextContent().trim();
                        if(layerJSON.has("attribution")) {
                            if(!layerJSON.getString("attribution").equals(attribution)) {
                                hasChanges = true;
                                layerJSON.put("attribution", attribution);
                            }
                        } else {
                            hasChanges = true;
                            layerJSON.put("attribution", attribution);
                        }
                    }
                    // AttributionUrl
                    Node layerAttributionUrl = (Node) xpath.evaluate(".//ServiceProvider/ProviderSite/@href", doc, XPathConstants.NODE);
                    if(layerAttributionUrl != null) {
                        String attributionUrl = layerAttributionUrl.getTextContent().trim();
                        if(layerJSON.has("attributionUrl")) {
                            if(!layerJSON.getString("attributionUrl").equals(attributionUrl)) {
                                hasChanges = true;
                                layerJSON.put("attributionUrl", attributionUrl);
                            }
                        } else {
                            hasChanges = true;
                            layerJSON.put("attributionUrl", attributionUrl);
                        }
                    }
                    // Style
                    Node tileMatrixSetNode = (Node) xpath.evaluate("//TileMatrixSet/Identifier[text()=\""+matrixSet+"\"]/..", doc, XPathConstants.NODE);
                    if(tileMatrixSetNode != null) {
                        // Scales
                        NodeList scalesNodeList = (NodeList) xpath.evaluate("./TileMatrix/ScaleDenominator", tileMatrixSetNode, XPathConstants.NODESET);
                        if(scalesNodeList != null && scalesNodeList.getLength() > 0) {
                            JSONArray array = new JSONArray();
                            for (int i = 0; i < scalesNodeList.getLength(); i++) {
                                Node node = scalesNodeList.item(i);
                                array.put(Double.parseDouble(node.getTextContent().trim()));
                            }
                            if(array.length() > 0 ) {
                                hasChanges = true;
                                layerJSON.put("scales", array);
                            }
                        }
                        // Origin
                        Node originNode = (Node) xpath.evaluate("./TileMatrix/TopLeftCorner", tileMatrixSetNode, XPathConstants.NODE);
                        if (originNode != null) {
                            JSONArray array = new JSONArray();
                            String origin = originNode.getTextContent().trim();
                            if(origin.indexOf(' ') > -1) {
                                array.put(Double.parseDouble(origin.split(" ")[0]));
                                array.put(Double.parseDouble(origin.split(" ")[1]));
                            }
                            if(array.length() > 0 ) {
                                hasChanges = true;
                                layerJSON.put("origin", array);
                            }
                        }
                    }
                } else {
                    hasChanges = true;
                    layerJSON.put(Constants.LAYER_STATUS, Constants.STATUS_LAYER_NOT_EXIST);
                    errorLayernames.add("Layer not exists (" + id + "): " + layerWtmsLayers + " on service url: " + layerWtmsUrl);
                  }
            }
        }
        return hasChanges;
    }

    private boolean updateLayerWMSInformation(Document doc, XPath xpath, JSONObject layerJSON,
            String layerWmsUrl, ArrayList<String> errorLayernames, String id) throws XPathExpressionException, JSONException, FactoryException {
        boolean hasChanges = false;
        if(layerJSON.has("wmsLayers")) {
            String layerWmsLayers = layerJSON.getString( "wmsLayers" );
            if(layerWmsLayers != null){
                if(layerWmsLayers.indexOf( ',' ) == -1){
                    Node layerNode = (Node) xpath.evaluate("//Layer/Name[text()=\""+layerWmsLayers+"\"]/..", doc, XPathConstants.NODE);
                    Node parentLayerNode = (Node) xpath.evaluate("//Layer/Name[text()=\""+layerWmsLayers+"\"]/../..", doc, XPathConstants.NODE);
                    if(layerNode != null){
                        log.debug( "Check for Update layer: " + layerWmsLayers);
                        Node fieldNode = null;
                        String layerKey = null;
                        
                        // MinScale
                        layerKey = "minScale";
                        if(parentLayerNode != null){
                            // Check inherit parent value
                            fieldNode = (Node) xpath.evaluate("./MinScaleDenominator", parentLayerNode, XPathConstants.NODE);
                            if (fieldNode != null) {
                                hasChanges = getDoubleScale(layerKey, fieldNode, layerJSON);
                            }
                            fieldNode = (Node) xpath.evaluate("./ScaleHint/@min", parentLayerNode, XPathConstants.NODE);
                            if (fieldNode != null) {
                                hasChanges = getDoubleScale(layerKey, fieldNode, layerJSON);
                            }
                        }
                        fieldNode = (Node) xpath.evaluate("./MinScaleDenominator", layerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            hasChanges = getDoubleScale(layerKey, fieldNode, layerJSON);
                        }
                        fieldNode = (Node) xpath.evaluate("./ScaleHint/@min", layerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            hasChanges = getDoubleScale(layerKey, fieldNode, layerJSON);
                        }
                        
                        // MaxScale
                        layerKey = "maxScale";
                        if(parentLayerNode != null){
                            // Check inherit parent value
                            fieldNode = (Node) xpath.evaluate("./MaxScaleDenominator", parentLayerNode, XPathConstants.NODE);
                            if (fieldNode != null) {
                                hasChanges = getDoubleScale(layerKey, fieldNode, layerJSON);
                            }
                            fieldNode = (Node) xpath.evaluate("./ScaleHint/@max", parentLayerNode, XPathConstants.NODE);
                            if (fieldNode != null) {
                                hasChanges = getDoubleScale(layerKey, fieldNode, layerJSON);
                            }
                        }
                        
                        layerKey = "maxScale";
                        fieldNode = (Node) xpath.evaluate("./MaxScaleDenominator", layerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            hasChanges = getDoubleScale(layerKey, fieldNode, layerJSON);
                        }
                        fieldNode = (Node) xpath.evaluate("./ScaleHint/@max", layerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            hasChanges = getDoubleScale(layerKey, fieldNode, layerJSON);
                        }
                        // Extent
                        layerKey = "extent";
                        if(parentLayerNode != null){
                            fieldNode = (Node) xpath.evaluate("./EX_GeographicBoundingBox", parentLayerNode, XPathConstants.NODE);
                            if (fieldNode != null) {
                                JSONArray array = new JSONArray();
                                getExtent(xpath, fieldNode, array, FIELD_BOUND);
                                layerJSON.put( layerKey, array );
                                hasChanges = true;
                            }
                            
                            fieldNode = (Node) xpath.evaluate("./BoundingBox[@CRS=\""+defaultEpsg+"\"]", parentLayerNode, XPathConstants.NODE);
                            if(fieldNode != null) {
                                try {
                                    JSONArray array = new JSONArray();
                                    getExtent(xpath, fieldNode, array, FIELD_XY);
                                    transformExtent(defaultEpsg, layerKey, array, layerJSON);
                                } catch (Exception e) {
                                    log.error("Error transform extent!");
                                }
                                hasChanges = true;
                            }
                            
                            fieldNode = (Node) xpath.evaluate("./LatLonBoundingBox", parentLayerNode, XPathConstants.NODE);
                            if (fieldNode != null) {
                                JSONArray array = new JSONArray();
                                getExtent(xpath, fieldNode, array, FIELD_XY);
                                layerJSON.put( layerKey, array );
                                hasChanges = true;
                            }
                            
                            fieldNode = (Node) xpath.evaluate("./BoundingBox[@SRS=\""+defaultEpsg+"\"]", parentLayerNode, XPathConstants.NODE);
                            if(fieldNode != null) {
                                try {
                                    JSONArray array = new JSONArray();
                                    getExtent(xpath, fieldNode, array, FIELD_XY);
                                    transformExtent(defaultEpsg, layerKey, array, layerJSON);
                                } catch (Exception e) {
                                    log.error("Error transform extent!");
                                }
                                hasChanges = true;
                            }
                        }
                        fieldNode = (Node) xpath.evaluate("./EX_GeographicBoundingBox", layerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            JSONArray array = new JSONArray();
                            getExtent(xpath, fieldNode, array, FIELD_BOUND);
                            layerJSON.put( layerKey, array );
                            hasChanges = true;
                        }
                        
                        fieldNode = (Node) xpath.evaluate("./BoundingBox[@CRS=\""+defaultEpsg+"\"]", layerNode, XPathConstants.NODE);
                        if(fieldNode != null) {
                            try {
                                JSONArray array = new JSONArray();
                                getExtent(xpath, fieldNode, array, FIELD_XY);
                                transformExtent(defaultEpsg, layerKey, array, layerJSON);
                            } catch (Exception e) {
                                log.error("Error transform extent!");
                            }
                            hasChanges = true;
                        }
                        
                        fieldNode = (Node) xpath.evaluate("./LatLonBoundingBox", layerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            JSONArray array = new JSONArray();
                            getExtent(xpath, fieldNode, array, FIELD_XY);
                            layerJSON.put( layerKey, array );
                            hasChanges = true;
                        }
                        
                        fieldNode = (Node) xpath.evaluate("./BoundingBox[@SRS=\""+defaultEpsg+"\"]", layerNode, XPathConstants.NODE);
                        if(fieldNode != null) {
                            try {
                                JSONArray array = new JSONArray();
                                getExtent(xpath, fieldNode, array, FIELD_XY);
                                transformExtent(defaultEpsg, layerKey, array, layerJSON);
                            } catch (Exception e) {
                                log.error("Error transform extent!");
                            }
                            hasChanges = true;
                        }
                        // LegendUrl
                        layerKey = "legendUrl";
                        fieldNode = (Node) xpath.evaluate("./Style/LegendURL/OnlineResources/@href", layerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            layerJSON.put( layerKey, fieldNode.getTextContent() );
                            hasChanges = true;
                        }
                        // Attribution
                        Node layerAttribution = (Node) xpath.evaluate(".//Service/ContactInformation/ContactPersonPrimary/ContactOrganization", doc, XPathConstants.NODE);
                        if(layerAttribution != null) {
                            String attribution = layerAttribution.getTextContent().trim();
                            if (layerJSON.has("attribution")) {
                                if(!layerJSON.getString("attribution").equals(attribution)) {
                                    hasChanges = true;
                                    layerJSON.put("attribution", attribution);
                                }
                            } else {
                                hasChanges = true;
                                layerJSON.put("attribution", attribution);
                            }
                        }
                        // AttributionUrl
                        Node layerAttributionUrl = (Node) xpath.evaluate(".//Service/OnlineResource/@href", doc, XPathConstants.NODE);
                        if(layerAttributionUrl != null) {
                            String attributionUrl = layerAttributionUrl.getTextContent().trim();
                            if (layerJSON.has("attributionUrl")) {
                                if(!layerJSON.getString("attributionUrl").equals(attributionUrl)) {
                                    hasChanges = true;
                                    layerJSON.put("attributionUrl", attributionUrl);
                                }
                            } else {
                                hasChanges = true;
                                layerJSON.put("attributionUrl", attributionUrl);
                            }
                        }
                        
                    } else {
                      layerJSON.put(Constants.LAYER_STATUS, Constants.STATUS_LAYER_NOT_EXIST);
                      errorLayernames.add("Layer not exists (" + id + "): " + layerWmsLayers + " on service url: " + layerWmsUrl);
                    }
                } else {
                    /* TODO: Execute combine layers
                    */
                }
            }
        }
        return hasChanges;
    }
    
    private boolean getScale(String layerKey, Node fieldNode, JSONObject layerJSON) throws JSONException {
        String text = fieldNode.getTextContent();
        String oldText;
        try {
            if(layerJSON.has(layerKey)) {
                oldText = layerJSON.getString(layerKey);
                if(oldText == null || (text != null && !oldText.equals( text ))){
                    layerJSON.put( layerKey, fieldNode.getTextContent() );
                    return true;
                }
            }
        } catch (JSONException e) {
            layerJSON.put( layerKey, fieldNode.getTextContent() );
            return true;
        }
        return false;
    }
    
    private boolean getDoubleScale(String layerKey, Node fieldNode, JSONObject layerJSON) throws JSONException {
        String text = fieldNode.getTextContent();
        String oldText;
        try {
            if(layerJSON.has(layerKey)) {
                oldText = layerJSON.getString(layerKey);
                if(oldText == null || (oldText != null && layerJSON.get(layerKey) instanceof String) ||(text != null && !oldText.equals( text ))){
                    layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                    return true;
                }
            }
        } catch (JSONException e) {
            layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
            return true;
        }
        return false;
    }
    
    private void getExtent(XPath xpath, Node fieldNode, JSONArray array, String[] fields) throws XPathExpressionException, JSONException {
        for (String field : fields) {
            Node subFieldNode = (Node) xpath.evaluate(field, fieldNode, XPathConstants.NODE);
            if(subFieldNode != null) {
                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
            }
        }
    }
    
    private void transformExtent(String epsg, String layerKey, JSONArray array, JSONObject layerJSON) throws FactoryException, TransformException, JSONException {
        String [] splitEPSG = epsg.split(":");
        double[] min = CoordTransformUtil.getInstance().transformToWGS84(array.getDouble(0), array.getDouble(1), CoordTransformUtil.getInstance().getCoordTypeByEPSGCode(splitEPSG[splitEPSG.length - 1]));
        double[] max = CoordTransformUtil.getInstance().transformToWGS84(array.getDouble(2), array.getDouble(3), CoordTransformUtil.getInstance().getCoordTypeByEPSGCode(splitEPSG[splitEPSG.length - 1]));
        JSONArray transformArray = new JSONArray();
        transformArray.put(min[0]);
        transformArray.put(min[1]);
        transformArray.put(max[0]);
        transformArray.put(max[1]);
        layerJSON.put( layerKey, transformArray );
    }
}
