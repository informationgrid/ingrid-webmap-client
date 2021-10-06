/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2021 wemove digital solutions GmbH
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
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.URL;
import java.net.URLDecoder;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.regex.Pattern;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;
import org.w3c.dom.Document;
import org.w3c.dom.Entity;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.itextpdf.text.html.HtmlEncoder;

import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.model.GetCapabilitiesDocument;
import de.ingrid.mapclient.utils.Utils;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/wms")
public class WmsResource {

    private static final Logger log = Logger.getLogger( WmsResource.class );

    private static final String ERROR_WMS_MSG = "Error sending WMS request: ";
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
    public String doWmsRequest(@QueryParam("url") String url, @QueryParam("toJson") boolean toJson, @QueryParam("login") String login, @QueryParam("password") String password) {
        try {
            String response = null;
            if(StringUtils.isNotEmpty(login) && StringUtils.isEmpty(password)) {
                password = Utils.getServiceLogin(url, login);
            }
            boolean isGetFeatureInfo = false;
            if (url.toLowerCase().indexOf( "getfeatureinfo" ) > -1) {
                isGetFeatureInfo = true;
            }
            if(isGetFeatureInfo) {
                response = HttpProxy.doRequest( url, login, password);
                // Remove script tags on getFeatureInfo response.
                Pattern p = Pattern.compile("<script[^>]*>(.*?)</script>",
                        Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
                return p.matcher(response).replaceAll("");
            } else {
                GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest( url, login, password);
                if (getCapabilities != null && evaluate(getCapabilities)) {
                    response = getCapabilities.getXml();
                    if(response != null) {
                        if(response.indexOf("<?xml") == -1) {
                           response = "<?xml version=\"1.0\"?>" + response;
                        }
                        // Replace "," to "." on bounding box.
                        response = response.replaceAll( "x=\"([0-9]+),([0-9]+)\"", "x=\"$1.$2\"" );
                        response = response.replaceAll( "y=\"([0-9]+),([0-9]+)\"", "y=\"$1.$2\"" );
                        response = response.replaceAll( "tude>([0-9]+),([0-9]+)", "tude>$1.$2" );
                        response = response.replaceAll( "tude>([0-9]+),([0-9]+)", "tude>$1.$2" );
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
                }
                throw new WebApplicationException( Response.Status.NOT_FOUND );
            }
        } catch (UnknownHostException | FileNotFoundException ex) {
            log.error( ERROR_WMS_MSG + url, ex );
            throw new WebApplicationException( ex, Response.Status.NOT_FOUND );
        } catch (IOException ioEx) {
            log.error( ERROR_WMS_MSG + url, ioEx );
            String exMsg = ioEx.getMessage();
            if (exMsg.indexOf(": 401") > -1) {
                throw new WebApplicationException( ioEx, Response.Status.UNAUTHORIZED );
            }
            throw new WebApplicationException( ioEx, Response.Status.NOT_FOUND );
        } catch (Exception e) {
            log.error( ERROR_WMS_MSG + url, e );
            throw new WebApplicationException( e, Response.Status.NOT_FOUND );
        }
    }

    private boolean evaluate(GetCapabilitiesDocument getCapabilities) {
        boolean isMapContent = false;
        if(getCapabilities != null) {
            String content = getCapabilities.getXml();
            String[] checkList = { "gpx", "kml", "Capabilities", "WMS_Capabilities", "WMT_MS_Capabilities" };
            if(content != null) {
                for (String check : checkList) {
                    if(content.indexOf("<" + check) > -1 && content.indexOf("</" + check + ">") > -1) {
                        isMapContent = true;
                        break;
                    }
                }
            }
        }
        return isMapContent;
    }

    @POST
    @Path("proxy/auth")
    @Produces(MediaType.TEXT_PLAIN)
    public String doCapabilitiesWithLoginRequest(String content) {
        String login = null; 
        String password = null;
        String url = null;
        boolean toJson = false;
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
            if(obj.has("toJson")) {
                toJson = obj.getBoolean("toJson");
            }
            return doWmsRequest(url, toJson, login, password);
        } catch (Exception e) {
            log.error( ERROR_WMS_MSG + url, e );
            throw new WebApplicationException( e, Response.Status.NOT_FOUND );
        }
    }

    @GET
    @Path("proxy/layers")
    @Produces(MediaType.TEXT_PLAIN)
    public String getServiceLayers(@QueryParam("url") String url, @QueryParam("login") String login) {
        try {
            if(url != null) {
                GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest( url, login);
                if (getCapabilities != null) {
                    Document doc = getCapabilities.getDoc();
                    XPath xpath = XPathFactory.newInstance().newXPath();
                    NodeList layers = (NodeList) xpath.evaluate( "//Layer/Name", doc, XPathConstants.NODESET );
                    if(layers != null) {
                        JSONArray json = new JSONArray();
                        for (int i = 0; i < layers.getLength(); i++) {
                            Node layer = layers.item(i);
                            json.put(layer.getTextContent());
                        }
                        return json.toString();
                    }
                }
            }
            throw new WebApplicationException( Response.Status.NOT_FOUND );
        } catch (IOException ex) {
            log.error( ERROR_WMS_MSG + url, ex );
            throw new WebApplicationException( ex, Response.Status.NOT_FOUND );
        } catch (Exception e) {
            log.error( ERROR_WMS_MSG + url, e );
            throw new WebApplicationException( e, Response.Status.NOT_FOUND );
        }
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
        return "";
    }

    @GET
    @Path("metadata")
    @Produces(MediaType.TEXT_HTML)
    public Response metadataRequest(@QueryParam("layer") String layer, @QueryParam("url") String url, @QueryParam("lang") String lang, @QueryParam("legend") String legend, @QueryParam("login") String login) {
        String html = "";
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
                    if(layerSplit.length > 0){
                        if(serviceType.equalsIgnoreCase( "wms" )){
                            layerTitle = URLDecoder.decode(layerSplit[1], "UTF-8" );
                            layerName = layerSplit[3];
                            serviceHost = layerSplit[2];
                            if(serviceHost.indexOf('?') == -1){
                                serviceHost = serviceHost + "?";
                            }
                            String wmsVersion = "1.3.0"; 
                            if(layerSplit[4] != null){
                                wmsVersion = layerSplit[4];
                            }
                            serviceCapabilitiesURL = Utils.checkWMSUrl(serviceHost, "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=" + wmsVersion);
                        }else if(serviceType.equalsIgnoreCase( "wmts" )){
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
                            if(serviceType.equalsIgnoreCase( "wms" )){
                                layerTitle = jsonLayer.getString("label");
                                serviceHost = jsonLayer.getString("wmsUrl");
                                if(serviceHost != null){
                                    if(serviceHost.indexOf('?') == -1){
                                        serviceHost = serviceHost + "?";
                                    }
                                    serviceCapabilitiesURL = Utils.checkWMSUrl(serviceHost, "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=" + jsonLayer.getString("version"));
                                }
                                if(jsonLayer.has("legendUrl")){
                                    layerLegend = jsonLayer.getString("legendUrl");
                                }
                                layerName = jsonLayer.getString("wmsLayers");
                            }else if(serviceType.equalsIgnoreCase( "wmts" )){
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
                    GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest( serviceCapabilitiesURL, login);
                    if(getCapabilities != null) {
                        Document doc = getCapabilities.getDoc();
                        XPath xpath = XPathFactory.newInstance().newXPath();
                        if(serviceType.equalsIgnoreCase( "wms" )){
                            html = getWmsInfo(xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend);
                        }else if(serviceType.equalsIgnoreCase( "wmts" )){
                            html = getWmtsInfo(xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend);
                        }
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
            html +="</div>";
        }
        return Response.ok(html).build();
    }

    private String getWmsInfo(XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle, String layerLegend) throws XPathExpressionException {
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
        html += getWMSInfoData(xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend);
        html += "</div>";
        
        html += "<div class=\"tab-pane\" ng-class=\"getTabClass(2)\">";
        html += getWMSInfoTree(xpath, doc, layerName);
        html += "</div>";
        
        html += "</div>";
        html += "</div>";

        html += "<div ng-if=\"!showWMSTree\">";
        html += getWMSInfoData(xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend);
        html += "</div>";
        
        return html;
    }

    private String getWMSInfoTree(XPath xpath, Document doc, String layerName) throws XPathExpressionException {
        Node field = null;
        StringBuilder html = new StringBuilder("<div class=\"metadata-structure\">");
        field = (Node) xpath.evaluate( ".//Service/Title", doc, XPathConstants.NODE);
        StringBuilder wmsStructure = new StringBuilder("");
        if(field != null){
            wmsStructure.append("<h4>" + field.getTextContent() + "</h4>");
            wmsStructure.append("<br>");
        }

        NodeList fields = (NodeList) xpath.evaluate( "./*/Capability/Layer", doc, XPathConstants.NODESET );
        if(fields != null){
            StringBuilder wmsStructureLayers = new StringBuilder(getSubLayers(fields, xpath, layerName));
            wmsStructure.append("<ul style=\"padding: 0px;\">");
            wmsStructure.append(wmsStructureLayers);
            wmsStructure.append("</ul>");
        }
        html.append(wmsStructure);
        html.append("</div>");
        return html.toString();
    }

    private String getWMSInfoData(XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle,
            String layerLegend) throws XPathExpressionException {
        StringBuilder html = new StringBuilder("");
        html.append("<div class=\"legend-container\">");
        html.append("<div class=\"legend-footer\">");
        html.append("<span translate>metadata_information_layer</span><br>");
        if (layerName != null) {
            ArrayList<String> layerAbstracts = new ArrayList<>();
            ArrayList<String> layerLegends = new ArrayList<>();
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
                layerLegends = new ArrayList<>();
                for (String tmpLegend : tmpLegends) {
                    layerLegends.add(tmpLegend);
                }
            }
            
            html.append("<table>");
            html.append("<tbody>");
            if(layerTitle != null){
                html.append("<tr ng-if=\"!showWMSName\"");
                if(layerAbstracts.isEmpty()){
                    html.append(" style=\"border-bottom:0;\"");
                }
                html.append(">");
                html.append("<td translate>metadata_service_title</td>");
                html.append("<td>" + layerTitle + "</td>");
                html.append("</tr>");
                html.append("<tr ng-if=\"showWMSName\"");
                html.append(">");
                html.append("<td translate>metadata_service_title</td>");
                html.append("<td>" + layerTitle + "</td>");
                html.append("</tr>");
            }
            if(!layerAbstracts.isEmpty()){
                for(int i=0; i < layerAbstracts.size(); i++) {
                    if (i == 0 && layers.length <= 1) {
                        html.append("<tr ng-if=\"showWMSName\">");
                        html.append("<td translate>metadata_service_abstract</td>");
                        html.append("<td>" + layerAbstracts.get(i) + "</td>");
                        html.append("</tr>");
                        html.append("<tr ng-if=\"!showWMSName\" style=\"border-bottom:0;\">");
                        html.append("<td translate>metadata_service_abstract</td>");
                        html.append("<td>" + layerAbstracts.get(i) + "</td>");
                        html.append("</tr>");
                    } else if (i == 0 && layers.length > 1) {
                        html.append("<tr style=\"border-bottom:0;\">");
                        html.append("<td translate>metadata_service_abstract</td>");
                        html.append("<td>" + layerAbstracts.get(i) + "</td>");
                        html.append("</tr>");
                    } else if(i == layerAbstracts.size() - 1) {
                        html.append("<tr>");
                        html.append("<td></td>");
                        html.append("<td>" + layerAbstracts.get(i) + "</td>");
                        html.append("</tr>");
                    } else {
                        html.append("<tr style=\"border-bottom:0;\">");
                        html.append("<td></td>");
                        html.append("<td>" + layerAbstracts.get(i) + "</td>");
                        html.append("</tr>");
                    }
                }
            }
            if(layers.length > 0){
                for(int i=0; i < layers.length; i++) {
                    html.append("<tr ng-if=\"showWMSName\" style=\"border-bottom:0;\">");
                    if (i == 0) {
                        html.append("<td translate>metadata_service_layer</td>");
                    } else {
                        html.append("<td></td>");
                    }
                    html.append("<td>" + layers[i] + "</td>");
                    html.append("</tr>");
                }
            }
            html.append("</tbody>");
            html.append("</table>");
            html.append("<div class=\"legend\">");
            html.append("<span translate>metadata_legend</span><br>");
            html.append("<div class=\"img-container\">");
            if(!layerLegends.isEmpty()) {
                for(int i=0; i < layerLegends.size(); i++) {
                    
                    html.append("<img alt=\"{{'no_legend_available' | translate}}\" src=\"");
                    html.append(layerLegends.get(i));
                    html.append("\">");
                    if(i != layerLegends.size() - 1) {
                        html.append("<hr>");
                    }
                }
            } else {
                html.append("<img alt=\"{{'no_legend_available' | translate}}\">");
            }
        }
        html.append("</div>");
        html.append("</div>");
        html.append("<span translate>metadata_information_service</span><br>");
        html.append("<table>");
        html.append("<tbody>");
        Node field = (Node) xpath.evaluate( ".//Service/Title", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_title</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/Name", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_id</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/Abstract", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_abstract</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/Fees", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_fees</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/AccessConstraints", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_accessconstraints</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactPersonPrimary/ContactPerson", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_contactperson</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactPersonPrimary/ContactOrganization", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_organisation</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/Address", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_addresse</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
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
            html.append("<tr>");
            html.append("<td translate>metadata_service_city</td>");
            html.append("<td>");
            if(plz != null){
                html.append("" + plz + " ");
            }
            if(city != null){
                html.append("" + city);
            }
            html.append("</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/Country", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_country</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactVoiceTelephone", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_phone</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactFacsimileTelephone", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_fax</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactElectronicMailAddress", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_mail</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate( ".//Service/OnlineResource/@href", doc, XPathConstants.NODE);
        if(field != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_resource</td>");
            html.append("<td><a target=\"new\" href=\"" + field.getTextContent() + "\">"+ field.getTextContent() + "</a></td>");
            html.append("</tr>");
        }
        if(serviceCapabilitiesURL != null){
            html.append("<tr>");
            html.append("<td translate>metadata_service_url</td>");
            html.append("<td><a target=\"new\" href=\"" + serviceCapabilitiesURL + "\" translate>metadata_service_url_link</a></td>");
            html.append("</tr>");
        }
        html.append("</tbody>");
        html.append("</table>");
        html.append("</div>");

        html.append("</div>");
        return html.toString();
    }

    private String getWmtsInfo(XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle, String layerLegend) throws XPathExpressionException {
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

    private String getSubLayers(NodeList fields, XPath xpath, String layername) throws XPathExpressionException {
        StringBuilder html = new StringBuilder("");
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
                        if(nodeName != null && splitLayername != null && nodeName.getTextContent().trim().equals( splitLayername.trim() )){
                            isLayerName = true;
                        }
                    }
                }
                
                html.append("<li");
                if(isLayerName){
                    html.append(" class=\"active\"");
                }
                html.append(">");
                if(field != null) {
                    html.append("<div>");
                    html.append("<span title=\"" + field.getTextContent() + "\">");
                    html.append("<label class=\"ga-truncate-text ga-checkbox\">");
                    html.append(field.getTextContent());
                    html.append("</label>"); 
                    html.append("</span>");
                    html.append("</div>");
                }
                html.append("</li>");
                
                NodeList subFields = (NodeList) xpath.evaluate( "./Layer", node, XPathConstants.NODESET );
                if(subFields != null && subFields.getLength() > 0){
                    StringBuilder wmsStructerLayers = new StringBuilder(getSubLayers( subFields, xpath, layername ));
                    html.append("<ul>");
                    html.append(wmsStructerLayers);
                    html.append("</ul>");
                }
            }
        }
        return html.toString();
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
        try (
          BufferedReader rd = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        ){
          String jsonText = readAll(rd);
          return new JSONObject(jsonText);
        } finally {
          is.close();
        }
    }
}
