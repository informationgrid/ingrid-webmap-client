package de.ingrid.mapclient;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.Scanner;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import de.ingrid.utils.xml.XPathUtils;;

public class ConvertConfig {

    private static String path = "C:\\Users\\wemove\\Downloads\\";
    private static String fileName = path + "ingrid_webmap_client_config.xml";
    private static String topicFileName = path + "topics.json";
    private static String layersFileName = path + "layers.json";
    private static String defaultEPSG = "EPSG:3857";
    private static JSONObject topics = new JSONObject();
    private static JSONObject layers = new JSONObject();
    private static ArrayList<String> errors = new ArrayList<String>();
    private static ArrayList<String> projectionErrorServices = new ArrayList<String>();
    private static ArrayList<String> projectionSuccessServices = new ArrayList<String>();
    
    public static void main(String[] args) throws Exception {
        File file = new File( fileName );
        
        System.out.println( "Scan file: " + fileName );
        String content;
        if (file.exists()) {
            System.out.println( "File exists!" );
            StringBuilder stringBuilder = new StringBuilder();
            Scanner scanner = new Scanner( file );
            try {
                System.out.println( "Scan config file!" );
                while (scanner.hasNextLine()) {
                    stringBuilder.append( scanner.nextLine() + "\n" );
                }
            } finally {
                scanner.close();
            }
            content = stringBuilder.toString();
            DocumentBuilder db = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            InputSource is = new InputSource();
            is.setCharacterStream(new StringReader(content));
            Document doc = db.parse(is);

            Element root = doc.getDocumentElement();

            createTopicJsonObject( topics, root, "./mapServiceCategories/mapServiceCategory" );
            createTopicSingleJsonObject(root, "./mapServiceCategories/mapServiceCategory");

            // Add default background
            JSONObject layer = new JSONObject();
            layer.put("wmsUrl", "http://sg.geodatenzentrum.de/wms_webatlasde.light?");
            layer.put("wmsLayers", "webatlasde.light");
            layer.put("gutter", 0);
            layer.put("attribution", "geodatenzentrum");
            layer.put("background", false);
            layer.put("searchable", false);
            layer.put("format", "png");
            layer.put("serverLayerName", "sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light");
            layer.put("selectbyrectangle", false);
            layer.put("attributionUrl", "http://www.bkg.bund.de/DE/Home/homepage__node.html__nnn=true");
            layer.put("timeBehaviour", "last");
            layer.put("topics", "ech,inspire,swisstopo,wms-bgdi_prod,wms-swisstopowms_prod");
            layer.put("label", "webatlasde.light");
            layer.put("singleTile", false);
            layer.put("highlightable", true);
            layer.put("chargeable", false);
            layer.put("hasLegend", true);
            layer.put("type", "wms");
            layer.put("timeEnabled", false);
            layer.put("queryable", true);
            layer.put("version", "1.1.1");
            layers.put("sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light", layer);
            
            writeJsonObjectFile( topics, topicFileName );
            writeJsonObjectFile( layers, layersFileName );
            
            System.out.println( "*********************************************************************" );
            System.out.println( "Error URL's:" );
            if(errors.size() > 0){
                for (int i = 0; i < errors.size(); i++) {
                    System.out.println( errors.get( i ) );
                }
            }else{
                System.out.println( "No errors !!!" );
            }
            System.out.println( "*********************************************************************" );
            System.out.println( "Error Services for Projection '" + defaultEPSG + "':" );
            if(projectionErrorServices.size() > 0){
                for (int i = 0; i < projectionErrorServices.size(); i++) {
                    System.out.println( projectionErrorServices.get( i ) );
                }
            }else{
                System.out.println( "No errors !!!" );
            }
            System.out.println( "*********************************************************************" );
            System.out.println( "Success Services for Projection '" + defaultEPSG + "':" );
            if(projectionSuccessServices.size() > 0){
                for (int i = 0; i < projectionSuccessServices.size(); i++) {
                    System.out.println( projectionSuccessServices.get( i ) );
                }
            }else{
                System.out.println( "No success services !!!" );
            }
            
        }
    }

    private static void createTopicSingleJsonObject(Element node, String xPath) throws Exception {
        JSONObject obj = new JSONObject();
        JSONObject results = new JSONObject();
        String categoryName = null;
        if (XPathUtils.nodeExists( node, xPath )) {
            NodeList list = XPathUtils.getNodeList( node, xPath );
            for (int i = 0; i < list.getLength(); i++) {
                Node subNode = list.item( i );
                if (XPathUtils.nodeExists( subNode, "./name" )) {
                    int id = 1;
                    int categoryId = 70;
                    Node mainTopicNode = XPathUtils.getNode( subNode, "./name" );
                    categoryName = mainTopicNode.getTextContent();
                    
                    JSONObject root = new JSONObject();
                    root.put("category", "root");
                    root.put("staging", "prod");
                    root.put("id", id);
                    
                    JSONArray children = new JSONArray();
                    id = createSingleTopic(node, children, id, subNode, categoryId);
                    root.put( "children", children);
                    results.put( "root", root );
                    obj.put( "results", results );
                    obj.put( "last_id", id );
                    writeJsonObjectFile( obj, path + "catalog-" +  categoryName.toLowerCase() + ".json");
                }
            }
        }
    }

    private static int createSingleTopic( Node root, JSONArray childs, int id, Node node, int categoryId) throws Exception {
        int catId = categoryId;
        if (XPathUtils.nodeExists( node, "./mapServiceCategories/mapServiceCategory" )) {
            NodeList list = XPathUtils.getNodeList( node, "./mapServiceCategories/mapServiceCategory" );
            for (int i = 0; i < list.getLength(); i++) {
                Node subNode = list.item( i );
                if (XPathUtils.nodeExists( subNode, "./name" )) {
                    Node topicNameNode = XPathUtils.getNode( subNode, "./name" );
                    id = id + 1;
                    
                    System.out.println( "Check category '" + topicNameNode.getTextContent() + "' with id '" + id + "'!" );
                    
                    JSONObject obj = new JSONObject();
                    obj.put("category", "cat" + catId);
                    obj.put("staging", "prod");
                    obj.put("selectedOpen", false);
                    obj.put("label", topicNameNode.getTextContent());
                    obj.put("id", id);
                    JSONArray children = new JSONArray();
                    id = createService(root, children, subNode, id, catId + 1);
                    obj.put("children", children);
                    childs.put( obj );
                }
            }
        }
        return id;
    }

    private static int createService(Node root, JSONArray array, Node topicNode, int id, int catId) throws Exception {
        String topicIdx = "";
        if (XPathUtils.nodeExists( topicNode, "./idx" )) {
            Node node = XPathUtils.getNode( topicNode, "./idx" );
            topicIdx = node.getTextContent();
        }
        
        if (XPathUtils.nodeExists( root, "./wmsServices/wmsService" )) {
            NodeList list = XPathUtils.getNodeList( root, "./wmsServices/wmsService" );
            for (int i = 0; i < list.getLength(); i++) {
                Node serviceNode = list.item( i );
                
                String label = "";
                if (XPathUtils.nodeExists( serviceNode, "./name" )) {
                    Node node = XPathUtils.getNode( serviceNode, "./name" );
                    label = node.getTextContent();
                }
               
                String url = "";
                if (XPathUtils.nodeExists( serviceNode, "./originalCapUrl" )) {
                    Node node = XPathUtils.getNode( serviceNode, "./originalCapUrl" );
                    url = node.getTextContent();
                }
                
                System.out.println( "Check service'" + label + "' for category '" + topicIdx + "'!" );
                
                if (XPathUtils.nodeExists( serviceNode, "./mapServiceCategories/mapServiceCategory" )) {
                    NodeList catList = XPathUtils.getNodeList( serviceNode, "./mapServiceCategories/mapServiceCategory" );
                    for (int j = 0; j < catList.getLength(); j++) {
                        Node serviceCatNode = catList.item(j);
                        
                        String idx = "";
                        if (XPathUtils.nodeExists( serviceCatNode, "./idx" )) {
                            Node catNodeIdx = XPathUtils.getNode( serviceCatNode, "./idx" );
                            idx = catNodeIdx.getTextContent();
                            
                            if(idx.equals(topicIdx)){
                                id = id + 1;
                                
                                JSONObject obj = new JSONObject();
                                obj.put("category", "cat" + catId);
                                obj.put("staging", "prod");
                                obj.put("selectedOpen", false);
                                obj.put("label", label);
                                obj.put("id", id);
                                if(url != ""){
                                    JSONArray children = new JSONArray();
                                    id = createLayersTopic(children, url, id);
                                    obj.put("children", children);
                                }
                                array.put( obj );
                                System.out.println( "Add service '" + label + "' to category '" + topicIdx + "' by idx!" );
                            }
                        } else if(XPathUtils.nodeExists( serviceCatNode, "./@reference" )){
                            Node catRefNode = XPathUtils.getNode( serviceCatNode, "./@reference" );
                            Node refNode = XPathUtils.getNode( serviceCatNode, catRefNode.getTextContent());
                            if (XPathUtils.nodeExists( refNode, "./idx" )) {
                                Node catNodeIdx = XPathUtils.getNode( refNode, "./idx" );
                                idx = catNodeIdx.getTextContent();
                                if(idx.equals(topicIdx)){
                                    id = id + 1;
                                    
                                    JSONObject obj = new JSONObject();
                                    obj.put("category", "cat" + catId);
                                    obj.put("staging", "prod");
                                    obj.put("selectedOpen", false);
                                    obj.put("label", label);
                                    obj.put("id", id);
                                    if(url != ""){
                                        JSONArray children = new JSONArray();
                                        id = createLayersTopic(children, url, id);
                                        obj.put("children", children);
                                    }
                                    array.put( obj );
                                    System.out.println( "Add service '" + label + "' to category '" + topicIdx + "' by reference!" );
                                }
                            }
                        }
                    }
                }
            }
        }
        return id;
    }

    private static int createLayersTopic(JSONArray children, String url, int id) {
        System.out.println( "Load service '" + url + "'!" );
        
        String response;
        try {
            response = HttpProxy.doRequest(url);
            if(response.indexOf("<Service>") < 0){
                System.out.println( "No content: " + response );
            }
            if(response != null){
                System.out.println( "Content available for sync category!" );
                DocumentBuilder db = DocumentBuilderFactory.newInstance().newDocumentBuilder();
                InputSource is = new InputSource();
                is.setCharacterStream(new StringReader(response));
                Document doc = db.parse(is);
                
                Element service = doc.getDocumentElement();
                String version = XPathUtils.getNode(service, "./@version" ).getNodeValue();
                
                if (XPathUtils.nodeExists(service, "./Capability/Layer" )) {
                    NodeList layersNode = XPathUtils.getNodeList( service, "./Capability/Layer" );
                    id = checkLayerTopic(children, layersNode, url, id, version);
                }
                
                boolean supportEPSG = false;
                if (XPathUtils.nodeExists(service, "//Layer/SRS[text()[contains(.,'" + defaultEPSG + "')]]" )) {
                    supportEPSG = true;
                }else if (XPathUtils.nodeExists(service, "//Layer/CRS[text()[contains(.,'" + defaultEPSG + "')]]" )) {
                    supportEPSG = true;
                }
                if(supportEPSG == false){
                    projectionErrorServices.add( url );
                }else{
                    projectionSuccessServices.add( url );
                }
            }
        } catch (Exception e) {
            errors.add( url );
        }
        return id;
    }

    private static int checkLayerTopic(JSONArray children, NodeList nodes, String url, int id, String version) throws JSONException {
        for (int j = 0; j < nodes.getLength(); j++) {
            Node node = nodes.item( j );
            
            String wmsLayers = null;
            if(XPathUtils.nodeExists( node, "./Name" )){
                wmsLayers = XPathUtils.getNode( node, "./Name" ).getTextContent();
            }
            
            String label = "";
            if(XPathUtils.nodeExists( node, "./Title" )){
                label = XPathUtils.getNode( node, "./Title" ).getTextContent();
            }
            
            String layerBodId = null;
            if(wmsLayers != null){
                layerBodId = url.split( "://" )[1].replace( ".", "_" ).replace( "/", "_" ).replace( "-", "_" ).split( "\\?" )[0] + "_" + wmsLayers;
            }
            
            id  = id + 1;
            JSONObject obj = new JSONObject();
            obj.put("category", "layer");
            obj.put("staging", "prod");
            obj.put("label", label);
            if(layerBodId != null){
                obj.put("layerBodId", layerBodId);
            }
            obj.put("id", id);
            if (XPathUtils.nodeExists(node, "./Layer" )) {
                NodeList subNodes = XPathUtils.getNodeList( node, "./Layer" );
                id = checkLayerTopic(children, subNodes, url, id, version);
            }
            children.put( obj );

            // Add layer to json
            addLayerNode(node, version, url, wmsLayers, label, layerBodId);
            System.out.println( "Add layer '" + label + "' to category!" );
        }
        return id;
    }

    private static void addLayerNode(Node node, String version, String url, String wmsLayers, String label, String layerBodId) throws JSONException {
        JSONObject layer = new JSONObject();
        if( wmsLayers != null){
            String id = "";
            id = url.split( "://" )[1].replace( ".", "_" ).replace( "/", "_" ).replace( "-", "_" ).split( "\\?" )[0] + "_" + wmsLayers;
            
            System.out.println("Add layer '"+ wmsLayers + "' with name '" + label + "' in version '" + version + "'!");
            
            String[] urlSplit = url.split( "\\?" );
            String urlHost = urlSplit[0] + "?";
            if(urlSplit.length > 0){
                String urlParams = urlSplit[1];
                String[] paramsSplit = urlParams.split( "&" );
                String urlHostParams = "";
                for (int i = 0; i < paramsSplit.length; i++) {
                    String param = paramsSplit[i];
                    if(param.toLowerCase().startsWith( "version" ) || param.toLowerCase().startsWith( "service" ) || param.toLowerCase().startsWith( "request" ) || param.toLowerCase().startsWith( "format" )){
                        
                    }else{
                        if(urlHostParams.equals( "" )){
                            urlHost = urlHost + "" + param;
                        }else if (!urlParams.endsWith( "&" )) {
                            urlHost = urlHost + "&" + param;
                        }
                    }
                }
            }
            layer.put("wmsUrl", urlHost);
            layer.put("wmsLayers", wmsLayers.toLowerCase());
            layer.put("gutter", 150);
            //layer.put("attribution", "");
            layer.put("background", false);
            layer.put("searchable", false);
            layer.put("format", "png");
            layer.put("serverLayerName", id);
            layer.put("selectbyrectangle", true);
            //layer.put("attributionUrl", "");
            layer.put("timeBehaviour", "last");
            layer.put("topics", "");
            layer.put("label", label);
            layer.put("singleTile", false);
            layer.put("highlightable", true);
            layer.put("chargeable", false);
            layer.put("hasLegend", true);
            layer.put("type", "wms");
            layer.put("timeEnabled", false);
            layer.put("queryable", true);
            layer.put("version", version);
            layers.put( id, layer );
        }
    }

    private static void createTopicJsonObject(JSONObject topics, Node node, String xPath) throws JSONException {
        System.out.println( "Create topics json!" );
        
        JSONArray topicsArray = new JSONArray();
        if (XPathUtils.nodeExists( node, xPath )) {
            NodeList list = XPathUtils.getNodeList( node, xPath );
            for (int i = 0; i < list.getLength(); i++) {
                Node subNode = list.item( i );
                if (XPathUtils.nodeExists( subNode, "./name" )) {
                    Node topicNode = XPathUtils.getNode( subNode, "./name" );
                    JSONObject topic = new JSONObject();
                    topic.put( "defaultBackground", "osmLayer" );
                    topic.put( "langs", "de,fr,it,rm,en" );
                    topic.put( "selectedLayers", new JSONArray() );
                    topic.put( "activatedLayers", new JSONArray() );
                    JSONArray backgroundLayers = new JSONArray();
                    backgroundLayers.put( "osmLayer" );
                    backgroundLayers.put( "sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light" );
                    topic.put( "backgroundLayers", backgroundLayers );
                    topic.put( "id", topicNode.getTextContent().toLowerCase() );
                    topicsArray.put( topic );
                }
            }
        }
        topics.put( "topics", topicsArray );
    }

    private static void writeJsonObjectFile(JSONObject obj, String filename) throws IOException {
        System.out.println( "Write file: " + filename );
        FileWriter file = new FileWriter( filename );
        if(file != null){
            file.write( obj.toString().replace( "\\/", "/" ) );
        }
    }
}
