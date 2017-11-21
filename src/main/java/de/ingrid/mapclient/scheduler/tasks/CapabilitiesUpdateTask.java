/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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
import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Properties;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.w3c.dom.DOMException;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.utils.Utils;

public class CapabilitiesUpdateTask implements Runnable{
    
    private static final Logger log = Logger.getLogger(CapabilitiesUpdateTask.class);

    public void run() {
        log.info("Update WebMapClient capabilitities ...");
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String fileContent = null;
        boolean hasChanges = false;
        
        if(config_dir != null){
            fileContent = Utils.getFileContent(config_dir, "layers", ".json", "data/");
        }
        if(fileContent != null) {
            try {
                JSONObject layersJson = new JSONObject( fileContent );
                HashMap<String, Document> mapCapabilities = new HashMap<String, Document>();
                ArrayList<String> errorUrls = new ArrayList<String>();
                ArrayList<String> errorLayernames = new ArrayList<String>();
                
                String getCapabilities = null;
                String url = null;
                Document doc = null;
                XPath xpath = XPathFactory.newInstance().newXPath();
                
                Iterator<?> keys = layersJson.keys();
                while( keys.hasNext() ) {
                    String key = (String)keys.next();
                    JSONObject layerJSON = layersJson.getJSONObject( key );
                    String layerVersion = layerJSON.getString( "version" );
                    String layerType = layerJSON.getString( "type" );
                    if(layerType.equals( "wms" )) {
                        String layerWmsUrl = layerJSON.getString( "wmsUrl" );
                        String layerWmsLayers = layerJSON.getString( "wmsLayers" );
                        if((url != null && layerWmsUrl != null && !layerWmsUrl.equals( url )) ||
                            url == null && layerWmsUrl != null){
                            try {
                                if(layerWmsUrl.toLowerCase().indexOf( "?" ) == -1){
                                    layerWmsUrl += "?";
                                }
                                if(layerWmsUrl.toLowerCase().indexOf( "service=" )  == -1){
                                    layerWmsUrl += "&SERVICE=WMS";
                                }
                                if(layerWmsUrl.toLowerCase().indexOf( "request=" )  == -1){
                                    layerWmsUrl += "&REQUEST=GetCapabilities";
                                }
                                if(layerWmsUrl.toLowerCase().indexOf( "version=" )  == -1){
                                    if(layerVersion == null) {
                                        layerWmsUrl += "&VERSION=1.3.0";
                                    } else {
                                        layerWmsUrl += "&VERSION=" + layerVersion;
                                    }
                                }
                                doc = mapCapabilities.get( layerWmsUrl );
                                if(doc == null){
                                    log.info( "Load capabilities: " + layerWmsUrl);
                                    getCapabilities = HttpProxy.doRequest( layerWmsUrl );
                                    DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
                                    docFactory.setValidating(false);
                                    doc =  docFactory.newDocumentBuilder().parse(new InputSource(new StringReader(getCapabilities)));
                                    mapCapabilities.put( layerWmsUrl, doc );
                                    boolean hasChangesLayer = updateLayerInformation(doc, xpath, layerType, layerJSON, layerWmsLayers, layerWmsUrl, errorLayernames);
                                    if(hasChangesLayer){
                                        hasChanges = hasChangesLayer;
                                    }
                                } else {
                                    log.debug( "Load capabilities from existing doc: " + layerWmsUrl);
                                    boolean hasChangesLayer = updateLayerInformation(doc, xpath, layerType, layerJSON, layerWmsLayers, layerWmsUrl, errorLayernames);
                                    if(hasChangesLayer){
                                        hasChanges = hasChangesLayer;
                                    }
                                }
                            } catch (Exception e) {
                                if(errorUrls.contains(layerWmsUrl)){
                                    errorUrls.add(layerWmsUrl);
                                }
                            }
                        } 
                        if(layerWmsUrl != null){
                            url = layerWmsUrl;
                        }
                    }
                }
                if(hasChanges){
                    File cpFile = new File(config_dir.concat("data/layers.json.old"));
                    if(cpFile.exists()){
                        cpFile.delete();
                    }
                    File file = new File(config_dir.concat("data/layers.json"));
                    file.renameTo( cpFile );
                    file = new File(config_dir.concat("data/layers.json"));
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
                
                if(!errorUrls.isEmpty()){
                    log.error( "************************" );
                    log.error( "Error load capabilities:" );
                    log.error( "************************" );
                    for (String errorUrl : errorUrls) {
                      log.error( "- " + errorUrl );
                    }
                }
                
                if(!errorLayernames.isEmpty()){
                    log.error( "************************" );
                    log.error( "Missing layer names:" );
                    log.error( "************************" );
                    for (String errorLayername : errorLayernames) {
                      log.error( "- " + errorLayername );
                    }
                }
            } catch (JSONException e) {
                log.error( "Error generate layers JSON array!" );
            }
           
        }
        log.info("Update WebMapClient capabilitities finished.");
    }
    
    private boolean updateLayerInformation(Document doc, XPath xpath, String layerType, JSONObject layerJSON, String layerWmsLayers, String layerWmsUrl, ArrayList<String> errorLayernames) throws XPathExpressionException, DOMException, JSONException {
        boolean hasChanges = false;
        if(layerWmsLayers != null){
            if(layerWmsLayers.indexOf( "," ) == -1){
                Node layerNode = (Node) xpath.evaluate("//Layer/Name[text()=\""+layerWmsLayers+"\"]/..", doc, XPathConstants.NODE);
                Node parentLayerNode = (Node) xpath.evaluate("//Layer/Name[text()=\""+layerWmsLayers+"\"]/../..", doc, XPathConstants.NODE);
                if(layerNode != null){
                    log.debug( "Check for Update layer: " + layerWmsLayers);
                    Node fieldNode = null;
                    Node subFieldNode = null;
                    String layerKey = null;
                    
                    // MinScale
                    layerKey = "minScale";
                    if(parentLayerNode != null){
                        // Check inherit parent value
                        fieldNode = (Node) xpath.evaluate("./MinScaleDenominator", parentLayerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            String text = fieldNode.getTextContent();
                            String oldText;
                            try {
                                oldText = layerJSON.getString(layerKey);
                                if(oldText == null || (text != null && oldText != null && !oldText.equals( text ))){
                                    layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                                    hasChanges = true;
                                }
                            } catch (JSONException e) {
                                layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                                hasChanges = true;
                            }
                        }
                        fieldNode = (Node) xpath.evaluate("./ScaleHint/@min", parentLayerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            String text = fieldNode.getTextContent();
                            String oldText;
                            try {
                                oldText = layerJSON.getString(layerKey);
                                if(oldText == null || (text != null && oldText != null && !oldText.equals( text ))){
                                    layerJSON.put( layerKey, fieldNode.getTextContent() );
                                    hasChanges = true;
                                }
                            } catch (JSONException e) {
                                layerJSON.put( layerKey, fieldNode.getTextContent() );
                                hasChanges = true;
                            }
                        }
                    }
                    fieldNode = (Node) xpath.evaluate("./MinScaleDenominator", layerNode, XPathConstants.NODE);
                    if (fieldNode != null) {
                        String text = fieldNode.getTextContent();
                        String oldText;
                        try {
                            oldText = layerJSON.getString(layerKey);
                            if(oldText == null || (text != null && oldText != null && !oldText.equals( text ))){
                                layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                                hasChanges = true;
                            }
                        } catch (JSONException e) {
                            layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                            hasChanges = true;
                        }
                    }
                    fieldNode = (Node) xpath.evaluate("./ScaleHint/@min", layerNode, XPathConstants.NODE);
                    if (fieldNode != null) {
                        String text = fieldNode.getTextContent();
                        String oldText;
                        try {
                            oldText = layerJSON.getString(layerKey);
                            if(oldText == null || (text != null && oldText != null && !oldText.equals( text ))){
                                layerJSON.put( layerKey, fieldNode.getTextContent() );
                                hasChanges = true;
                            }
                        } catch (JSONException e) {
                            layerJSON.put( layerKey, fieldNode.getTextContent() );
                            hasChanges = true;
                        }
                    }
                    
                    // MaxScale
                    layerKey = "maxScale";
                    if(parentLayerNode != null){
                        // Check inherit parent value
                        fieldNode = (Node) xpath.evaluate("./MaxScaleDenominator", parentLayerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            String text = fieldNode.getTextContent();
                            String oldText;
                            try {
                                oldText = layerJSON.getString(layerKey);
                                if(oldText == null || (text != null && oldText != null && !oldText.equals( text ))){
                                    layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                                    hasChanges = true;
                                }
                            } catch (JSONException e) {
                                layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                                hasChanges = true;
                            }
                        }
                        fieldNode = (Node) xpath.evaluate("./ScaleHint/@max", parentLayerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            String text = fieldNode.getTextContent();
                            String oldText;
                            try {
                                oldText = layerJSON.getString(layerKey);
                                if(oldText == null || (text != null && oldText != null && !oldText.equals( text ))){
                                    layerJSON.put( layerKey, fieldNode.getTextContent() );
                                    hasChanges = true;
                                }
                            } catch (JSONException e) {
                                layerJSON.put( layerKey, fieldNode.getTextContent() );
                                hasChanges = true;
                            }
                        }
                    }
                    
                    layerKey = "maxScale";
                    fieldNode = (Node) xpath.evaluate("./MaxScaleDenominator", layerNode, XPathConstants.NODE);
                    if (fieldNode != null) {
                        String text = fieldNode.getTextContent();
                        String oldText;
                        try {
                            oldText = layerJSON.getString(layerKey);
                            if(oldText == null || (text != null && oldText != null && !oldText.equals( text ))){
                                layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                                hasChanges = true;
                            }
                        } catch (JSONException e) {
                            layerJSON.put( layerKey, Double.parseDouble(fieldNode.getTextContent() ) );
                            hasChanges = true;
                        }
                    }
                    fieldNode = (Node) xpath.evaluate("./ScaleHint/@max", layerNode, XPathConstants.NODE);
                    if (fieldNode != null) {
                        String text = fieldNode.getTextContent();
                        String oldText;
                        try {
                            oldText = layerJSON.getString(layerKey);
                            if(oldText == null || (text != null && oldText != null && !oldText.equals( text ))){
                                layerJSON.put( layerKey, fieldNode.getTextContent() );
                                hasChanges = true;
                            }
                        } catch (JSONException e) {
                            layerJSON.put( layerKey, fieldNode.getTextContent() );
                            hasChanges = true;
                        }
                    }
                    // Extent
                    layerKey = "extent";
                    if(parentLayerNode != null){
                        fieldNode = (Node) xpath.evaluate("./EX_GeographicBoundingBox", parentLayerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            JSONArray array = new JSONArray();
                            subFieldNode = (Node) xpath.evaluate("./westBoundLongitude", fieldNode, XPathConstants.NODE);
                            if(subFieldNode != null) {
                                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                            }
                            subFieldNode = (Node) xpath.evaluate("./southBoundLatitude", fieldNode, XPathConstants.NODE);
                            if(subFieldNode != null) {
                                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                            }
                            subFieldNode = (Node) xpath.evaluate("./eastBoundLongitude", fieldNode, XPathConstants.NODE);
                            if(subFieldNode != null) {
                                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                            }
                            subFieldNode = (Node) xpath.evaluate("./northBoundLatitude", fieldNode, XPathConstants.NODE);
                            if(subFieldNode != null) {
                                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                            }
                            layerJSON.put( layerKey, array );
                            hasChanges = true;
                        }
                        fieldNode = (Node) xpath.evaluate("./LatLonBoundingBox", parentLayerNode, XPathConstants.NODE);
                        if (fieldNode != null) {
                            JSONArray array = new JSONArray();
                            subFieldNode = (Node) xpath.evaluate("./@minx", fieldNode, XPathConstants.NODE);
                            if(subFieldNode != null) {
                                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                            }
                            subFieldNode = (Node) xpath.evaluate("./@miny", fieldNode, XPathConstants.NODE);
                            if(subFieldNode != null) {
                                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                            }
                            subFieldNode = (Node) xpath.evaluate("./@maxx", fieldNode, XPathConstants.NODE);
                            if(subFieldNode != null) {
                                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                            }
                            subFieldNode = (Node) xpath.evaluate("./@maxy", fieldNode, XPathConstants.NODE);
                            if(subFieldNode != null) {
                                array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                            }
                            layerJSON.put( layerKey, array );
                            hasChanges = true;
                        }
                    }
                    fieldNode = (Node) xpath.evaluate("./EX_GeographicBoundingBox", layerNode, XPathConstants.NODE);
                    if (fieldNode != null) {
                        JSONArray array = new JSONArray();
                        subFieldNode = (Node) xpath.evaluate("./westBoundLongitude", fieldNode, XPathConstants.NODE);
                        if(subFieldNode != null) {
                            array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                        }
                        subFieldNode = (Node) xpath.evaluate("./southBoundLatitude", fieldNode, XPathConstants.NODE);
                        if(subFieldNode != null) {
                            array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                        }
                        subFieldNode = (Node) xpath.evaluate("./eastBoundLongitude", fieldNode, XPathConstants.NODE);
                        if(subFieldNode != null) {
                            array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                        }
                        subFieldNode = (Node) xpath.evaluate("./northBoundLatitude", fieldNode, XPathConstants.NODE);
                        if(subFieldNode != null) {
                            array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                        }
                        layerJSON.put( layerKey, array );
                        hasChanges = true;
                    }
                    
                    fieldNode = (Node) xpath.evaluate("./LatLonBoundingBox", layerNode, XPathConstants.NODE);
                    if (fieldNode != null) {
                        JSONArray array = new JSONArray();
                        subFieldNode = (Node) xpath.evaluate("./@minx", fieldNode, XPathConstants.NODE);
                        if(subFieldNode != null) {
                            array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                        }
                        subFieldNode = (Node) xpath.evaluate("./@miny", fieldNode, XPathConstants.NODE);
                        if(subFieldNode != null) {
                            array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                        }
                        subFieldNode = (Node) xpath.evaluate("./@maxx", fieldNode, XPathConstants.NODE);
                        if(subFieldNode != null) {
                            array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                        }
                        subFieldNode = (Node) xpath.evaluate("./@maxy", fieldNode, XPathConstants.NODE);
                        if(subFieldNode != null) {
                            array.put(Double.parseDouble( subFieldNode.getTextContent() ));
                        }
                        layerJSON.put( layerKey, array );
                        hasChanges = true;
                    }
                    
                    // LegendUrl
                    layerKey = "legendUrl";
                    fieldNode = (Node) xpath.evaluate("./Style/LegendURL/OnlineResources/@href", layerNode, XPathConstants.NODE);
                    if (fieldNode != null) {
                        layerJSON.put( layerKey, fieldNode.getTextContent() );
                        hasChanges = true;
                    }
                } else {
                  errorLayernames.add("Layer not exists: " + layerWmsLayers + " on service url: " + layerWmsUrl);
                }
            }
        }
        return hasChanges;
    }
}
