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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.io.Writer;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Properties;
import java.util.regex.Pattern;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.itextpdf.text.html.HtmlEncoder;
import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.json.JsonHierarchicalStreamDriver;
import com.thoughtworks.xstream.io.json.JsonWriter;

import de.ingrid.iplug.opensearch.communication.OSCommunication;
import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.utils.Utils;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/wms")
public class WmsResource {

    private static final Logger log = Logger.getLogger( WmsResource.class );

    /**
     * The service pattern that urls must match
     */
    private final static Pattern SERVICE_PATTERN = Pattern.compile( "SERVICE=WMS", Pattern.CASE_INSENSITIVE );

    /**
     * The request pattern that urls must match
     */
    private final static Pattern REQUEST_PATTERN = Pattern.compile( "REQUEST=(GetCapabilities|GetFeatureInfo)", Pattern.CASE_INSENSITIVE );

    /**
     * Get WMS response from the given url
     * 
     * @param url
     *            The request url
     * @return String
     */
    @GET
    @Path("proxy")
    @Produces(MediaType.TEXT_PLAIN)
    public String doWmsRequest(@QueryParam("url") String url, @QueryParam("toJson") boolean toJson, @QueryParam("login") String login) {
        try {
            String response = null;
            if(login != null) {
                Properties p = ConfigurationProvider.INSTANCE.getProperties();
                String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                if(config_dir != null){
                    String fileContent = Utils.getFileContent(config_dir, "service.auth", ".json", "config/");
                    if(fileContent != null) {
                        String password = Utils.getServiceLogin(fileContent, url, login);
                        if(password != null) {
                            response = HttpProxy.doRequest( url, login, password);
                        }
                    }
                }
            } else {
                response = HttpProxy.doRequest( url );
            }
            if(response.indexOf("<?xml") == -1) {
               response = "<?xml version=\"1.0\" encoding=\"UTF-8\">" + response;
            }
            if (url.toLowerCase().indexOf( "getfeatureinfo" ) > 0) {
                // Remove script tags on getFeatureInfo response.
                Pattern p = Pattern.compile("<script[^>]*>(.*?)</script>",
                        Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
                return p.matcher(response).replaceAll("");
            } else {
                // Replace "," to "." on bounding box.
                response = response.replaceAll( "x=\"([0-9]+),([0-9]+)\"", "x=\"$1.$2\"" );
                response = response.replaceAll( "y=\"([0-9]+),([0-9]+)\"", "y=\"$1.$2\"" );
                response = response.replaceAll( "tude>([0-9]+),([0-9]+)", "tude>$1.$2" );
                response = response.replaceAll( "tude>([0-9]+),([0-9]+)", "tude>$1.$2" );
            }
            if(toJson){
                JSONObject json;
                try {
                    json = XML.toJSONObject( response );
                    json.put( "xmlResponse", response );
                    return json.toString();
                } catch (JSONException e) {
                    log.error("Error create json object" + response);
                }
            }
            return response;
        } catch (IOException ex) {
            log.error( "Error sending WMS request: " + url, ex );
            throw new WebApplicationException( ex, Response.Status.NOT_FOUND );
        } catch (Exception e) {
            log.error( "Error sending WMS request: " + url, e );
        }
        return null;
    }

    @POST
    @Path("proxy/auth")
    @Produces(MediaType.TEXT_PLAIN)
    public String doCapabilitiesWithLoginRequest(String content) {
        String login = null; 
        String password = null;
        String response = null;
        String url = null;
        boolean toJson = false;
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
                if(obj.has("toJson")) {
                    toJson = obj.getBoolean("toJson");
                }
            }
            response = HttpProxy.doRequest( url, login, password );
            if(response != null) {
                if (url.toLowerCase().indexOf( "getfeatureinfo" ) > 0) {
                    // Remove script tags on getFeatureInfo response.
                    Pattern p = Pattern.compile("<script[^>]*>(.*?)</script>",
                            Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
                    return p.matcher(response).replaceAll("");
                } else {
                    // Replace "," to "." on bounding box.
                    response = response.replaceAll( "x=\"([0-9]+),([0-9]+)\"", "x=\"$1.$2\"" );
                    response = response.replaceAll( "y=\"([0-9]+),([0-9]+)\"", "y=\"$1.$2\"" );
                    response = response.replaceAll( "tude>([0-9]+),([0-9]+)", "tude>$1.$2" );
                    response = response.replaceAll( "tude>([0-9]+),([0-9]+)", "tude>$1.$2" );
                }
                if(toJson){
                    JSONObject json;
                    try {
                        json = XML.toJSONObject( response );
                    } catch (JSONException e) {
                        json = new JSONObject();
                    }
                    json.put( "xmlResponse", response );
                    return json.toString();
                }
                return response;
            }
        } catch (IOException ex) {
            log.error( "Error sending WMS request: " + url, ex );
            throw new WebApplicationException( ex, Response.Status.NOT_FOUND );
        } catch (Exception e) {
            log.error( "Error sending WMS request: " + url, e );
        }
        return null;
    }
    @POST
    @Path("proxy")
    @Produces(MediaType.TEXT_PLAIN)
    public String doServiceTransformationRequest(String data, String content, @QueryParam("toJson") boolean toJson) {
        try {
            String response = data;
            if(toJson){
                JSONObject json = XML.toJSONObject( response );
                json.put( "xmlResponse", response );
                return json.toString();
            }
            return response;
        } catch (Exception e) {
            log.error( "Error transformation service", e );
        }
        return null;
    }
    
    /**
     * Get WMS response from the given url
     * 
     * @param url
     *            The request url
     * @return String
     */
    @GET
    @Path("proxyAdministrativeInfos")
    @Produces(MediaType.APPLICATION_JSON)
    public Response doAdministrativeInfosWmsRequest(@QueryParam("url") String url) {
        // check if the url string is valid
        if (!SERVICE_PATTERN.matcher( url ).find() && !REQUEST_PATTERN.matcher( url ).find()) {
            throw new IllegalArgumentException( "The url is not a valid wms request: " + url );
        }

        OSCommunication comm = new OSCommunication();
        InputStream result = null;
        result = comm.sendRequest( url );
        Document doc = null;
        XPath xpath = XPathFactory.newInstance().newXPath();
        NodeList fields = null;

        comm.releaseConnection();
        XStream xstream = new XStream( new JsonHierarchicalStreamDriver() {
            @Override
            public HierarchicalStreamWriter createWriter(Writer writer) {
                return new JsonWriter( writer, JsonWriter.DROP_ROOT_MODE );
            }
        } );

        String json = ""; // xstream.toXML(adminInfos);
        return Response.ok( json ).build();
    }

    
    @GET
    @Path("metadata")
    @Produces(MediaType.TEXT_HTML)
    public Response metadataRequest(@QueryParam("layer") String layer, @QueryParam("url") String url, @QueryParam("lang") String lang, @QueryParam("legend") String legend, @QueryParam("login") String login) {
        String html = "";
        String response = null;
        boolean hasError = false;
        String serviceCapabilitiesURL = null;
        
        if(layer != null){
            String serviceHost = null;
            String serviceType = null;
            String layerLegend = null;
            String layerTitle = null;
            String layerName = null;
            
            try {
                if(layer.indexOf("||") > -1){
                    // Extern
                    String[] layerSplit = layer.split( "\\|\\|" );
                    serviceType = layerSplit[0].trim();
                    if(layerSplit != null && layerSplit.length > 0){
                        if(serviceType.toLowerCase().equals( "wms" )){
                            layerTitle = URLDecoder.decode(layerSplit[1], "UTF-8" );
                            layerName = layerSplit[3];
                            serviceHost = layerSplit[2];
                            if(serviceHost.indexOf("?") == -1){
                                serviceHost = serviceHost + "?";
                            }
                            String wmsVersion = "1.3.0"; 
                            if(layerSplit[4] != null){
                                wmsVersion = layerSplit[4];
                            }
                            serviceCapabilitiesURL = Utils.checkWMSUrl(serviceHost, "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=" + wmsVersion);
                        }else if(serviceType.toLowerCase().equals( "wmts" )){
                            // WMTS||WmsBWaStr||http:%2F%2Fatlas.wsv.bund.de%2Fbwastr%2Fwmts%2F1.0.0%2FWMTSCapabilities.xml
                            layerTitle = layerSplit[1];
                            layerName = layerSplit[1];
                            serviceCapabilitiesURL = layerSplit[2];
                        }
                    }
                }else {
                    // Intern
                    JSONObject json = readJsonFromUrl(url);
                    if(json != null){
                        JSONObject jsonLayer = (JSONObject) json.get(layer);
                        if(jsonLayer != null){
                            serviceType = jsonLayer.getString("type").trim();
                            if(serviceType.toLowerCase().equals( "wms" )){
                                layerTitle = jsonLayer.getString("label");
                                serviceHost = jsonLayer.getString("wmsUrl");
                                if(serviceHost != null){
                                    if(serviceHost.indexOf("?") == -1){
                                        serviceHost = serviceHost + "?";
                                    }
                                    serviceCapabilitiesURL = Utils.checkWMSUrl(serviceHost, "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=" + jsonLayer.getString("version"));
                                }
                                if(jsonLayer.has("legendUrl")){
                                    layerLegend = jsonLayer.getString("legendUrl");
                                }
                                layerName = jsonLayer.getString("wmsLayers");
                            }else if(serviceType.toLowerCase().equals( "wmts" )){
                                layerTitle = jsonLayer.getString("label");
                                serviceCapabilitiesURL = jsonLayer.getString("serviceUrl");
                                if(jsonLayer.has("legendUrl")){
                                    layerLegend = jsonLayer.getString("legendUrl");
                                }
                                layerName = jsonLayer.getString("serverLayerName");
                            }
                        }
                    }
                }
                if(layerLegend == null){
                    layerLegend = legend;
                }
                
                if(serviceCapabilitiesURL != null && layerName != null){
                    String password = null;
                    if(login != null) {
                        Properties p = ConfigurationProvider.INSTANCE.getProperties();
                        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
                        if(config_dir != null){
                            String fileContent = Utils.getFileContent(config_dir, "service.auth", ".json", "config/");
                            if(fileContent != null) {
                                password = Utils.getServiceLogin(fileContent, serviceCapabilitiesURL, login);
                            }
                        }
                    }
                    response = HttpProxy.doRequest( serviceCapabilitiesURL, login, password);
                    DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
                    docFactory.setValidating(false);
                    Document doc =  docFactory.newDocumentBuilder().parse(new InputSource(new StringReader(response)));
                    XPath xpath = XPathFactory.newInstance().newXPath();
                    
                    if(serviceType.toLowerCase().equals( "wms" )){
                        html = getWmsInfo(response, xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend, legend);
                    }else if(serviceType.toLowerCase().equals( "wmts" )){
                        html = getWmtsInfo(response, xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend);
                    }
                }
            } catch (Exception e) {
                hasError = true;
            }
        }
        
        if(hasError){
            html += "<div style=\"padding: 5px;\">";
           
            html += "<h4>Fehler beim Laden des GetCapabilities:</h4>";
            if(serviceCapabilitiesURL != null){
                html += "<a href=\"" + serviceCapabilitiesURL +" \" target=\"_blank\">" + serviceCapabilitiesURL + "</a>";
            }
            if(response != null){
                html += "<br>";
                html += "<h4>Antwort: </h4>";
                html += response;
            }
            
            html +="</div>";
        }
        return Response.ok(html).build();
    }

    private String getWmsInfo(String response, XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle, String layerLegend, String legend) throws XPathExpressionException {
        String html = "";
        // Create HTML
        html += "<div ng-if=\"showWMSTree\" class=\"tabbable\">";
        
        html += "<ul class=\"nav nav-tabs\">";
        html += "<li ng-class=\"getTabClass(1)\">";
        html += "<a ng-click=\"activeTab(1)\" translate>metadata_data</a>";
        html += "</li>";
        html += "<li ng-class=\"getTabClass(2)\">";
        html += "<a ng-click=\"activeTab(2)\" translate>metadata_structure</a>";
        html += "</li>";
        html += "</ul>";
        
        html += "<div class=\"tab-content\">";
        
        html += "<div class=\"tab-pane\" ng-class=\"getTabClass(1)\">";
        html += getWMSInfoData(response, xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend, legend);
        html += "</div>";
        
        html += "<div class=\"tab-pane\" ng-class=\"getTabClass(2)\">";
        html += getWMSInfoTree(response, xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend);
        html += "</div>";
        
        html += "</div>";
        html += "</div>";

        html += "<div ng-if=\"!showWMSTree\">";
        html += getWMSInfoData(response, xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend, legend);
        html += "</div>";
        
        return html;
    }

    private String getWMSInfoTree(String response, XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle,
            String layerLegend) throws XPathExpressionException {
        Node field = null;
        String html = "";
        
        html += "<div class=\"metadata-structure\">";
        if(response != null){
            field = (Node) xpath.evaluate( ".//Service/Title", doc, XPathConstants.NODE);
            String wmsStructure = "";
            if(field != null){
                wmsStructure += "<h4>" + field.getTextContent() + "</h4>";
                wmsStructure += "<br>";
            }

            NodeList fields = (NodeList) xpath.evaluate( "./*/Capability/Layer", doc, XPathConstants.NODESET );
            if(fields != null){
                String wmsStructureLayers = "";
                wmsStructureLayers += getSubLayers(fields, xpath, wmsStructureLayers, layerName);
                wmsStructure += "<ul style=\"padding: 0px;\">";
                wmsStructure += wmsStructureLayers;
                wmsStructure += "</ul>";
            }
            html += wmsStructure;
        }
        html += "</div>";
        return html;
    }

    private String getWMSInfoData(String response, XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle,
            String layerLegend, String legend) throws XPathExpressionException {
        String html = "";
        html += "<div class=\"legend-container\">";
        html += "<div class=\"legend-footer\">";
        html += "<span translate>metadata_information_layer</span><br>";
        if (layerName != null) {
            ArrayList<String> layerAbstracts = new ArrayList<String>();
            ArrayList<String> layerLegends = new ArrayList<String>();
            String[] layers = layerName.split(",");
            for (String layer : layers) {
                Node field = (Node) xpath.evaluate("//Layer/Name[text()=\""+layer+"\"]", doc, XPathConstants.NODE);
                if(field != null) {
                    Node abstractField = (Node) xpath.evaluate( "./Abstract", field.getParentNode(), XPathConstants.NODE);
                    if(abstractField != null) {
                        layerAbstracts.add(abstractField.getTextContent());
                    }
                    field = (Node) xpath.evaluate( "./Style/LegendURL/OnlineResource/@href", field.getParentNode(), XPathConstants.NODE);
                    if(field != null){
                      layerLegends.add(field.getTextContent());
                    }
                }
            }
            if(layerLegend != null && !layerLegend.equals( "undefined" )){
                String[] tmpLegends = layerLegend.split("\\|");
                layerLegends = new ArrayList<String>();
                for (String tmpLegend : tmpLegends) {
                    layerLegends.add(tmpLegend);
                }
            }
            
            html += "<table>";
            html += "<tbody>";
            if(layerTitle != null){
                html += "<tr ng-if=\"!showWMSName\"";
                if(layerAbstracts.size() == 0){
                    html += " style=\"border-bottom:0;\"";
                }
                html += ">";
                html += "<td translate>metadata_service_title</td>";
                html += "<td>" + layerTitle + "</td>";
                html += "</tr>";
                html += "<tr ng-if=\"showWMSName\"";
                html += ">";
                html += "<td translate>metadata_service_title</td>";
                html += "<td>" + layerTitle + "</td>";
                html += "</tr>";
            }
            if(layerAbstracts.size() > 0){
                for(int i=0; i < layerAbstracts.size(); i++) {
                    if (i == 0 && layers.length <= 1) {
                        html += "<tr ng-if=\"showWMSName\">";
                        html += "<td translate>metadata_service_abstract</td>";
                        html += "<td>" + layerAbstracts.get(i) + "</td>";
                        html += "</tr>";
                        html += "<tr ng-if=\"!showWMSName\" style=\"border-bottom:0;\">";
                        html += "<td translate>metadata_service_abstract</td>";
                        html += "<td>" + layerAbstracts.get(i) + "</td>";
                        html += "</tr>";
                    } else if (i == 0 && layers.length > 1) {
                        html += "<tr style=\"border-bottom:0;\">";
                        html += "<td translate>metadata_service_abstract</td>";
                        html += "<td>" + layerAbstracts.get(i) + "</td>";
                        html += "</tr>";
                    } else if(i == layerAbstracts.size() - 1) {
                        html += "<tr>";
                        html += "<td></td>";
                        html += "<td>" + layerAbstracts.get(i) + "</td>";
                        html += "</tr>";
                    } else {
                        html += "<tr style=\"border-bottom:0;\">";
                        html += "<td></td>";
                        html += "<td>" + layerAbstracts.get(i) + "</td>";
                        html += "</tr>";
                    }
                }
            }
            if(layers.length > 0){
                for(int i=0; i < layers.length; i++) {
                    html += "<tr ng-if=\"showWMSName\" style=\"border-bottom:0;\">";
                    if (i == 0) {
                        html += "<td translate>metadata_service_layer</td>";
                    } else {
                        html += "<td></td>";
                    }
                    html += "<td>" + layers[i] + "</td>";
                    html += "</tr>";
                }
            }
            html += "</tbody>";
            html += "</table>";
            html += "<div class=\"legend\">";
            html += "<span translate>metadata_legend</span><br>";
            html += "<div class=\"img-container\">";
            if(layerLegends.size() > 0) {
                for(int i=0; i < layerLegends.size(); i++) {
                    
                    html += "<img alt=\"{{'no_legend_available' | translate}}\" src=\"";
                    html += layerLegends.get(i);
                    html += "\">";
                    if(i != layerLegends.size() - 1) {
                        html += "<hr>";
                    }
                }
            } else {
                html += "<img alt=\"{{'no_legend_available' | translate}}\">";
            }
        }
        html += "</div>";
        html += "</div>";
        html += "<span translate>metadata_information_service</span><br>";
        html += "<table>";
        html += "<tbody>";
        Node field = (Node) xpath.evaluate( ".//Service/Title", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_title</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/Name", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_id</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/Abstract", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_abstract</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/Fees", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_fees</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/AccessConstraints", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_accessconstraints</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactPersonPrimary/ContactPerson", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_contactperson</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactPersonPrimary/ContactOrganization", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_organisation</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/Address", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_addresse</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        String city = null;
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/City", doc, XPathConstants.NODE);
        if(field != null){
            city = HtmlEncoder.encode(field.getTextContent());
        }
        String plz = null;
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/PostCode", doc, XPathConstants.NODE);
        if(field != null){
            plz = HtmlEncoder.encode(field.getTextContent());
        }
        if(city != null || plz != null){
            html += "<tr>";
            html += "<td translate>metadata_service_city</td>";
            html += "<td>";
            if(plz != null){
                html += "" + plz + " ";
            }
            if(city != null){
                html += "" + city;
            }
            html += "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/Country", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_country</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactVoiceTelephone", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_phone</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactFacsimileTelephone", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_fax</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactElectronicMailAddress", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_mail</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//Service/OnlineResource/@href", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_resource</td>";
            html += "<td><a target=\"new\" href=\"" + field.getTextContent() + "\">"+ field.getTextContent() + "</a></td>";
            html += "</tr>";
        }
        if(serviceCapabilitiesURL != null){
            html += "<tr>";
            html += "<td translate>metadata_service_url</td>";
            html += "<td><a target=\"new\" href=\"" + serviceCapabilitiesURL + "\" translate>metadata_service_url_link</a></td>";
            html += "</tr>";
        }
        html += "</tbody>";
        html += "</table>";
        html += "</div>";

        html += "</div>";
        return html;
    }

    private String getWmtsInfo(String response, XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle, String layerLegend) throws XPathExpressionException {
        Node field = (Node) xpath.evaluate("//Layer/Identifier[text()=\""+layerName+"\"]", doc, XPathConstants.NODE);
        Node layerField = null;
        String html = "";
        String layerAbstract = null;
        
        if(field != null){
            layerField = field.getParentNode();
            field = (Node) xpath.evaluate( "./Abstract", layerField, XPathConstants.NODE);
            if(field != null){
                layerAbstract = field.getTextContent();
            }
            field = (Node) xpath.evaluate( "./Title", layerField, XPathConstants.NODE);
            if(field != null){
                layerTitle = field.getTextContent();
            }
            
        }
        
        // Create HTML
        html += "<div class=\"legend-container\">";
        
        html += "<div class=\"legend-header\">";
        if(layerTitle != null){
            html += "<p class=\"bod-title\">" + layerTitle + " ";
            if(layerName != null) {
                html += "<span ng-if=\"showWMSName\">(" + layerName + ")</span>";
            }
            html += "</p>";
        }
        if(layerAbstract != null){
            html += "<p class=\"legend-abstract\">" + layerAbstract + "</p>";
        }
        html += "</div>";

        html += "<div class=\"legend-footer\">";
        if(layerLegend == null || layerLegend.equals( "undefined" )){
            field = (Node) xpath.evaluate( "./Style/LegendURL/@href", layerField, XPathConstants.NODE);
            if(field != null){
                layerLegend = field.getTextContent();
            }else{
                layerLegend = null;
            }
            
        }
        html += "<br>";
        html += "<span translate>metadata_legend</span><br>";
        html += "<div class=\"img-container\">";
        html += "<img alt=\"{{'no_legend_available' | translate}}\" src=\"";
        if(layerLegend != null && !layerLegend.equals( "undefined" )) {
            html += layerLegend;
        }
        html += "\">";
        html += "</div>";
        html += "<br><br>";
        html += "<span translate>metadata_information</span><br>";
        html += "<table>";
        html += "<tbody>";
        field = (Node) xpath.evaluate( ".//ServiceIdentification/Title", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_title</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceIdentification/ServiceType", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_id</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
             html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceIdentification/Abstract", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_abstract</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceIdentification/Fees", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_fees</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceIdentification/AccessConstraints", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_accessconstraints</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceProvider/ProviderName", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_contactperson</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/IndividualName", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_organisation</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Address/DeliveryPoint", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_addresse</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        String city = null;
        field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Address/City", doc, XPathConstants.NODE);
        if(field != null){
            city = HtmlEncoder.encode(field.getTextContent());
        }
        String plz = null;
        field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Address/PostalCode", doc, XPathConstants.NODE);
        if(field != null){
            plz = HtmlEncoder.encode(field.getTextContent());
        }
        if(city != null || plz != null){
            html += "<tr>";
            html += "<td translate>metadata_service_city</td>";
            html += "<td>";
            if(plz != null){
                html += "" + plz + " ";
            }
            if(city != null){
                html += "" + city;
            }
            html += "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Address/Country", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_country</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Phone/Voice", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_phone</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Phone/Facsimile", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_fax</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Address/ElectronicMailAddress", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_mail</td>";
            html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
            html += "</tr>";
        }
        field = (Node) xpath.evaluate( ".//ServiceProvider/ProviderSite/@href", doc, XPathConstants.NODE);
        if(field != null){
            html += "<tr>";
            html += "<td translate>metadata_service_resource</td>";
            html += "<td><a target=\"new\" href=\"" + field.getTextContent() + "\">"+ field.getTextContent() + "</a></td>";
            html += "</tr>";
        }
        if(serviceCapabilitiesURL != null){
            html += "<tr>";
            html += "<td translate>metadata_service_url</td>";
            html += "<td><a target=\"new\" href=\"" + serviceCapabilitiesURL + "\" translate>metadata_service_url_link</a></td>";
            html += "</tr>";
        }
        html += "</tbody>";
        html += "</table>";
        html += "</div>";
        
        html += "</div>";
        
        return html;
    }

    private String getSubLayers(NodeList fields, XPath xpath, String html, String layername) throws XPathExpressionException {
        for (int i = 0; i < fields.getLength(); i++) {
            boolean isLayerName = false;
            Node node = fields.item( i );
            if(node != null){
                Node field = (Node) xpath.evaluate( "./Title", node, XPathConstants.NODE);
                if(field != null){
                    Node nodeName = (Node) xpath.evaluate( "./Name", node, XPathConstants.NODE);
                    String[] splitLayernames = layername.split( "," );
                    for (int j = 0; j < splitLayernames.length; j++) {
                        String splitLayername = splitLayernames[j];
                        if(nodeName != null && splitLayername != null){
                            if(nodeName.getTextContent().trim().equals( splitLayername.trim() )){
                                isLayerName = true;
                            }
                        }
                    }
                }
                
                html += "<li";
                if(isLayerName){
                    html += " class=\"active\"";
                }
                html += ">";
                if(field != null) {
                    html += "<div>";
                    html += "<span title=\"" + field.getTextContent() + "\">";
                    html += "<label class=\"ga-truncate-text ga-checkbox\">";
                    html += field.getTextContent();
                    html += "</label>"; 
                    html += "</span>";
                    html += "</div>";
                }
                html += "</li>";
                
                NodeList subFields = (NodeList) xpath.evaluate( "./Layer", node, XPathConstants.NODESET );
                if(subFields != null){
                    String wmsStructerLayers = "";
                    wmsStructerLayers += getSubLayers( subFields, xpath, wmsStructerLayers, layername );
                    html += "<ul>";
                    html += wmsStructerLayers;
                    html += "</ul>";
                }
            }
        }
        return html;
    }

    private static String readAll(Reader rd) throws IOException {
        StringBuilder sb = new StringBuilder();
        int cp;
        while ((cp = rd.read()) != -1) {
          sb.append((char) cp);
        }
        return sb.toString();
      }

      private static JSONObject readJsonFromUrl(String url) throws IOException, JSONException {
        InputStream is = new URL(url).openStream();
        try {
          BufferedReader rd = new BufferedReader(new InputStreamReader(is, Charset.forName("UTF-8")));
          String jsonText = readAll(rd);
          JSONObject json = new JSONObject(jsonText);
          return json;
        } finally {
          is.close();
        }
      }
      
      private static String readFile(String path, Charset encoding) throws IOException {
        byte[] encoded = Files.readAllBytes(Paths.get(path));
        return new String(encoded, encoding);
      }
}
