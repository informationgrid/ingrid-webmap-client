/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2017 wemove digital solutions GmbH
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
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.regex.Pattern;

import javax.ws.rs.GET;
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
    public String doWmsRequest(@QueryParam("url") String url, @QueryParam("toJson") boolean toJson) {
        try {
            String response = HttpProxy.doRequest( url );
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
                JSONObject json = XML.toJSONObject( response );
                return json.toString();
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
    public Response metadataRequest(@QueryParam("layer") String layer, @QueryParam("url") String url, @QueryParam("lang") String lang, @QueryParam("legend") String legend) throws Exception {
        String html = "";
        
        if(layer != null){
            String serviceCapabilitiesURL = null;
            String serviceHost = null;
            String serviceType = null;
            String layerLegend = null;
            String layerTitle = null;
            String layerName = null;
            String layerAbstract = null;
            
            if(layer.indexOf("||") > -1){
                // Extern
                String[] layerSplit = layer.split( "\\|\\|" );
                serviceType = layerSplit[0].trim();
                if(layerSplit != null && layerSplit.length > 0){
                    if(serviceType.toLowerCase().equals( "wms" )){
                        layerTitle = layerSplit[1];
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
                String response = HttpProxy.doRequest( serviceCapabilitiesURL );
                DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
                docFactory.setValidating(false);
                Document doc =  docFactory.newDocumentBuilder().parse(new InputSource(new StringReader(response)));
                XPath xpath = XPathFactory.newInstance().newXPath();
                Node field = null;
                Node layerField = null;
                
                if(serviceType.toLowerCase().equals( "wms" )){
                    field = (Node) xpath.evaluate("//Layer/Name[text()=\""+layerName+"\"]", doc, XPathConstants.NODE);
                    if(field != null){
                        layerField = field.getParentNode();
                        field = (Node) xpath.evaluate( "./Abstract", layerField, XPathConstants.NODE);
                        if(field != null){
                            layerAbstract = HtmlEncoder.encode(field.getTextContent());
                        }
                    }
                    
                    // Create HTML
                    html += "<div ng-if=\"currentTab\" class=\"tabbable\">";
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
                    html += "<div class=\"legend-container\">";
                    html += "<div class=\"legend-header\">";
                    if(layerTitle != null){
                        html += "<p class=\"bod-title\">" + layerTitle + "</p>";
                    }
                    if(layerAbstract != null){
                        html += "<p class=\"legend-abstract\">" + layerAbstract + "</p>";
                    }
                    
                    html += "</div>";
                    html += "<div class=\"legend-footer\">";
                    
                    if(layerLegend.equals( legend )){
                        field = (Node) xpath.evaluate( "./Style/LegendURL/OnlineResource/@href", layerField, XPathConstants.NODE);
                        if(field != null){
                          layerLegend = field.getTextContent();
                        }
                    }
                    
                    if(layerLegend != null && !layerLegend.equals( "undefined" )){
                        html += "<br>";
                        html += "<span>metadata_legend</span><br>";
                        html += "<div class=\"img-container\">";
                        html += "<img alt=\"layer legend img\" src=\"" + layerLegend + "\">";
                        html += "</div>";
                    }
                    html += "<br><br>";
                    html += "<span>metadata_information</span><br>";
                    html += "<table>";
                    html += "<tbody>";
                    
                    field = (Node) xpath.evaluate( ".//Service/Title", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_title</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/Name", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_id</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/Abstract", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_abstract</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/Fees", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_fees</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/AccessConstraints", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_accessconstraints</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactPersonPrimary/ContactPerson", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_contactperson</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactPersonPrimary/ContactOrganization", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_organisation</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/Address", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_addresse</td>";
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
                        html += "<td>metadata_service_city</td>";
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
                        html += "<td>metadata_service_country</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactVoiceTelephone", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_phone</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactFacsimileTelephone", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_fax</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactElectronicMailAddress", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_mail</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//Service/OnlineResource/@href", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_resource</td>";
                        html += "<td><a target=\"new\" href=\"" + field.getTextContent() + "\">"+ field.getTextContent() + "</a></td>";
                        html += "</tr>";
                    }
                    
                    if(serviceCapabilitiesURL != null){
                        html += "<tr>";
                        html += "<td>metadata_service_url</td>";
                        html += "<td><a target=\"new\" href=\"" + serviceCapabilitiesURL + "\">metadata_service_url_link</a></td>";
                        html += "</tr>";
                    }
                    
                    html += "</tbody>";
                    html += "</table>";
                    html += "</div>";
                    html += "</div>";
                    html += "</div>";
                    html += "<div class=\"tab-pane\" ng-class=\"getTabClass(2)\">";
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
                    html += "</div>";
                    html += "</div>";
                    html += "</div>";
                }else if(serviceType.toLowerCase().equals( "wmts" )){
                    field = (Node) xpath.evaluate("//Layer/Identifier[text()=\""+layerName+"\"]", doc, XPathConstants.NODE);
                    if(field != null){
                        layerField = field.getParentNode();
                        field = (Node) xpath.evaluate( "./Abstract", layerField, XPathConstants.NODE);
                        if(field != null){
                            layerAbstract = HtmlEncoder.encode(field.getTextContent());
                        }
                        field = (Node) xpath.evaluate( "./Title", layerField, XPathConstants.NODE);
                        if(field != null){
                            layerTitle = HtmlEncoder.encode(field.getTextContent());
                        }
                        
                    }
                    
                    // Create HTML
                    html += "<div class=\"legend-container\">";
                    html += "<div class=\"legend-header\">";
                    if(layerTitle != null){
                        html += "<p class=\"bod-title\">" + layerTitle + "</p>";
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
                    
                    if(layerLegend != null) {
                        html += "<br>";
                        html += "<span>metadata_legend</span><br>";
                        html += "<div class=\"img-container\">";
                        html += "<img alt=\"layer legend img\" src=\"" + layerLegend + "\">";
                        html += "</div>";
                    }
                    html += "<br><br>";
                    html += "<span>metadata_information</span><br>";
                    html += "<table>";
                    html += "<tbody>";
                    
                    field = (Node) xpath.evaluate( ".//ServiceIdentification/Title", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_title</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceIdentification/ServiceType", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_id</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                         html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceIdentification/Abstract", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_abstract</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceIdentification/Fees", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_fees</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceIdentification/AccessConstraints", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_accessconstraints</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceProvider/ProviderName", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_contactperson</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/IndividualName", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_organisation</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Address/DeliveryPoint", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_addresse</td>";
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
                        html += "<td>metadata_service_city</td>";
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
                        html += "<td>metadata_service_country</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Phone/Voice", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_phone</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Phone/Facsimile", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_fax</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceProvider/ServiceContact/ContactInfo/Address/ElectronicMailAddress", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_mail</td>";
                        html += "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                        html += "</tr>";
                    }
    
                    field = (Node) xpath.evaluate( ".//ServiceProvider/ProviderSite/@href", doc, XPathConstants.NODE);
                    if(field != null){
                        html += "<tr>";
                        html += "<td>metadata_service_resource</td>";
                        html += "<td><a target=\"new\" href=\"" + field.getTextContent() + "\">"+ field.getTextContent() + "</a></td>";
                        html += "</tr>";
                    }
                    
                    if(serviceCapabilitiesURL != null){
                        html += "<tr>";
                        html += "<td>metadata_service_url</td>";
                        html += "<td><a target=\"new\" href=\"" + serviceCapabilitiesURL + "\">metadata_service_url_link</a></td>";
                        html += "</tr>";
                    }
                    
                    html += "</tbody>";
                    html += "</table>";
                    html += "</div>";
                    html += "</div>";
                }
            }
        }
        return Response.ok(html).build();
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
                html += "<div>";
                html += "<span title=\"" + field.getTextContent() + "\">";
                html += "<label class=\"ga-truncate-text ga-checkbox\">";
                html += field.getTextContent();
                html += "</label>"; 
                html += "</span>";
                html += "</div>";
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
