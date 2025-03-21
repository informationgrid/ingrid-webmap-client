/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2025 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
package de.ingrid.mapclient.rest;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.net.URLEncoder;
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
import javax.xml.stream.XMLInputFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.RequestBody;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.ctc.wstx.stax.WstxInputFactory;
import com.ctc.wstx.stax.WstxOutputFactory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.xml.XmlFactory;
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

    private static final Logger log = Logger.getLogger(WmsResource.class);

    private static final String ERROR_WMS_MSG = "Error sending WMS request: ";

    private static final ObjectMapper mapper = new ObjectMapper();
    private final ObjectMapper xmlMapper;
    

    public WmsResource() {
        XMLInputFactory input = new WstxInputFactory();
        input.setProperty(XMLInputFactory.IS_NAMESPACE_AWARE, Boolean.FALSE);
        this.xmlMapper = new ObjectMapper(new XmlFactory(input, new WstxOutputFactory()))
                .registerModule(new SimpleModule().addDeserializer(JsonNode.class, new CustomJsonNodeDeserializer()));

    }

    /**
     * Get WMS response from the given url
     *
     * @param url The request url
     * @return String
     */
    @GET
    @Path("proxy")
    @Produces(MediaType.TEXT_PLAIN)
    public String doWmsRequest(@QueryParam("url") String url, @QueryParam("toJson") boolean toJson, @QueryParam("login") String login, @QueryParam("password") String password, @QueryParam("isFeatureInfo") boolean isFeatureInfo) {
        try {
            String response = null;
            if (StringUtils.isNotEmpty(login) && StringUtils.isEmpty(password)) {
                password = Utils.getServiceLogin(url, login);
            }
            boolean isGetFeatureInfo = isFeatureInfo;
            if (url.toLowerCase().indexOf("getfeatureinfo") > -1 ) {
                isGetFeatureInfo = true;
            }
            if (isGetFeatureInfo) {
                response = HttpProxy.doRequest(url, login, password);
                // Remove script tags on getFeatureInfo response.
                Pattern p = Pattern.compile("<script[^>]*>(.*?)</script>",
                        Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
                return p.matcher(response).replaceAll("");
            } else {
                GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest(url, login, password);
                if (getCapabilities != null) {
                    response = getCapabilities.getXml();
                    if (response != null) {
                        if (response.indexOf("<?xml") == -1) {
                            response = "<?xml version=\"1.0\"?>" + response;
                        }
                        // Replace "," to "." on bounding box.
                        response = response.replaceAll("x=\"([0-9]+),([0-9]+)\"", "x=\"$1.$2\"");
                        response = response.replaceAll("y=\"([0-9]+),([0-9]+)\"", "y=\"$1.$2\"");
                        response = response.replaceAll("tude>([0-9]+),([0-9]+)", "tude>$1.$2");
                        response = response.replaceAll("tude>([0-9]+),([0-9]+)", "tude>$1.$2");
                        if (toJson) {
                            ObjectNode json;
                            try {
                                json = (ObjectNode) xmlMapper.readTree(response);
                            } catch (JsonProcessingException e) {
                                json = mapper.createObjectNode();
                            }
                            json.put("xmlResponse", response);
                            return json.toString();
                        }
                        return response;
                    }
                }
                throw new WebApplicationException(Response.Status.NOT_FOUND);
            }
        } catch (UnknownHostException | FileNotFoundException ex) {
            log.error(ERROR_WMS_MSG + url, ex);
            throw new WebApplicationException(ex, Response.Status.NOT_FOUND);
        } catch (IOException ioEx) {
            log.error(ERROR_WMS_MSG + url, ioEx);
            String exMsg = ioEx.getMessage();
            if (exMsg.indexOf(": 401") > -1) {
                throw new WebApplicationException(ioEx, Response.Status.UNAUTHORIZED);
            }
            throw new WebApplicationException(ioEx, Response.Status.NOT_FOUND);
        } catch (Exception e) {
            log.error(ERROR_WMS_MSG + url, e);
            throw new WebApplicationException(e, Response.Status.NOT_FOUND);
        }
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
            if (obj.hasNonNull("toJson")) {
                toJson = obj.get("toJson").asBoolean();
            }
            return doWmsRequest(url, toJson, login, password, false);
        } catch (Exception e) {
            log.error(ERROR_WMS_MSG + url, e);
            throw new WebApplicationException(e, Response.Status.NOT_FOUND);
        }
    }

    @GET
    @Path("proxy/layers")
    @Produces(MediaType.TEXT_PLAIN)
    public String getServiceLayers(@QueryParam("url") String url, @QueryParam("login") String login) {
        try {
            if (url != null) {
                GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest(url, login);
                if (getCapabilities != null) {
                    Document doc = getCapabilities.getDoc();
                    XPath xpath = XPathFactory.newInstance().newXPath();
                    NodeList layers = (NodeList) xpath.evaluate("//Layer/Name", doc, XPathConstants.NODESET);
                    if (layers != null) {
                        ArrayNode json = mapper.createArrayNode();
                        for (int i = 0; i < layers.getLength(); i++) {
                            Node layer = layers.item(i);
                            json.add(layer.getTextContent());
                        }
                        return json.toString();
                    }
                }
            }
            throw new WebApplicationException(Response.Status.NOT_FOUND);
        } catch (IOException ex) {
            log.error(ERROR_WMS_MSG + url, ex);
            throw new WebApplicationException(ex, Response.Status.NOT_FOUND);
        } catch (Exception e) {
            log.error(ERROR_WMS_MSG + url, e);
            throw new WebApplicationException(e, Response.Status.NOT_FOUND);
        }
    }

    @POST
    @Path("proxy")
    @Produces(MediaType.TEXT_PLAIN)
    public String doServiceTransformationRequest(@RequestBody String data, @QueryParam("url") String url, @QueryParam("toJson") boolean toJson) {
        if (url != null) {
            JsonNode json;
            try {
                json = mapper.readTree(data);
                String login = null;
                String password = null;
                if (json.hasNonNull("login")) {
                    login = json.get("login").textValue();
                }
                if (json.hasNonNull("password")) {
                    password = json.get("password").textValue();
                }
                return doWmsRequest(url, toJson, login, password, false);
            } catch (JsonProcessingException e) {
                log.error("No data defined.", e);
            }
        }
        try {
            String response = data;
            if (toJson) {
                ObjectNode json = (ObjectNode) xmlMapper.readTree(response);
                json.put("xmlResponse", response);
                return json.toString();
            }
            return response;
        } catch (Exception e) {
            log.error("Error transformation service", e);
        }
        return "";
    }

    @GET
    @Path("metadata")
    @Produces(MediaType.TEXT_HTML)
    public Response metadataRequest(@QueryParam("layer") String layer, @QueryParam("url") String url, @QueryParam("lang") String lang, @QueryParam("legend") String legend, @QueryParam("login") String login, @QueryParam("password") String password) {
        String html = "";
        boolean hasError = false;
        String serviceCapabilitiesURL = null;

        if (layer != null) {
            String serviceHost = null;
            String serviceType = null;
            String layerLegend = null;
            String layerTitle = null;
            String layerName = null;
            String portalUrl = null;

            try {
                if (layer.indexOf("||") > -1) {
                    // Extern
                    String[] layerSplit = layer.split("\\|\\|");
                    serviceType = layerSplit[0].trim();
                    if (layerSplit.length > 0) {
                        if (serviceType.equalsIgnoreCase("wms")) {
                            layerTitle = URLDecoder.decode(layerSplit[1], "UTF-8");
                            layerName = layerSplit[3];
                            serviceHost = layerSplit[2];
                            if (serviceHost.indexOf('?') == -1) {
                                serviceHost = serviceHost + "?";
                            }
                            String wmsVersion = "1.3.0";
                            if (layerSplit[4] != null) {
                                wmsVersion = layerSplit[4];
                            }
                            serviceCapabilitiesURL = Utils.checkWMSUrl(serviceHost, "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=" + wmsVersion);
                        } else if (serviceType.equalsIgnoreCase("wmts")) {
                            // WMTS||WmsBWaStr||http:%2F%2Fvia.bund.de%2Fwsv%2Fbwastr%2Fwmts%2F1.0.0%2FWMTSCapabilities.xml
                            layerTitle = layerSplit[1];
                            layerName = layerSplit[1];
                            serviceCapabilitiesURL = layerSplit[2];
                        }
                    }
                } else {
                    // Intern
                    JsonNode json = readJsonFromUrl(url);
                    if (json != null) {
                        JsonNode jsonLayer = (JsonNode) json.get(layer);
                        if (jsonLayer != null) {
                            serviceType = jsonLayer.get("type").textValue().trim();
                            if (serviceType.equalsIgnoreCase("wms")) {
                                layerTitle = jsonLayer.get("label").textValue();
                                serviceHost = jsonLayer.get("wmsUrl").textValue();
                                if (serviceHost != null) {
                                    if (serviceHost.indexOf('?') == -1) {
                                        serviceHost = serviceHost + "?";
                                    }
                                    serviceCapabilitiesURL = Utils.checkWMSUrl(serviceHost, "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=" + jsonLayer.get("version").textValue());
                                }
                                if (jsonLayer.hasNonNull("legendUrl")) {
                                    layerLegend = jsonLayer.get("legendUrl").textValue();
                                }
                                layerName = jsonLayer.get("wmsLayers").textValue();
                            } else if (serviceType.equalsIgnoreCase("wmts")) {
                                layerTitle = jsonLayer.get("label").textValue();
                                serviceCapabilitiesURL = jsonLayer.get("serviceUrl").textValue();
                                if (jsonLayer.hasNonNull("legendUrl")) {
                                    layerLegend = jsonLayer.get("legendUrl").textValue();
                                }
                                layerName = jsonLayer.get("serverLayerName").textValue();
                            }
                            if (jsonLayer.hasNonNull("portalUrl")) {
                                portalUrl = jsonLayer.get("portalUrl").textValue();
                            }
                        }
                    }
                }
                if (layerLegend == null) {
                    layerLegend = legend;
                }

                if (serviceCapabilitiesURL != null && layerName != null) {
                    GetCapabilitiesDocument getCapabilities = HttpProxy.doCapabilitiesRequest(serviceCapabilitiesURL, login, password);
                    if (getCapabilities != null) {
                        Document doc = getCapabilities.getDoc();
                        XPath xpath = XPathFactory.newInstance().newXPath();
                        if (serviceType.equalsIgnoreCase("wms")) {
                            html = getWmsInfo(xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend, portalUrl);
                        } else if (serviceType.equalsIgnoreCase("wmts")) {
                            html = getWmtsInfo(xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend, portalUrl);
                        }
                    }
                }
            } catch (Exception e) {
                hasError = true;
            }
        }

        if (hasError) {
            html += "<div style=\"padding: 5px;\">";

            html += "<h4>Fehler beim Laden des GetCapabilities:</h4>";
            if (serviceCapabilitiesURL != null) {
                html += "<a href=\"" + serviceCapabilitiesURL + " \" target=\"_blank\">" + serviceCapabilitiesURL + "</a>";
            }
            html += "</div>";
        }
        return Response.ok(html).build();
    }


    @POST
    @Path("metadata")
    @Produces(MediaType.TEXT_HTML)
    public Response metadataPostRequest(@RequestBody String data, @QueryParam("layer") String layer, @QueryParam("url") String url, @QueryParam("lang") String lang, @QueryParam("legend") String legend) {
        JsonNode json;
        String login = null;
        String password = null;
        try {
            json = mapper.readTree(data);
            if (json.hasNonNull("login")) {
                login = json.get("login").textValue();
            }
            if (json.hasNonNull("password")) {
                password = json.get("password").textValue();
            }
        } catch (JsonProcessingException e) {
            log.error("No data defined.", e);
        }
        return metadataRequest(layer, url, lang, legend, login, password);
    }

    @GET
    @Path("wfsDownload")
    @Produces(MediaType.TEXT_HTML)
    public Response wfsDownloadRequest(@QueryParam("url") String urlStr, @QueryParam("filter") String filterStr, @QueryParam("title") String titleStr, @QueryParam("featureTypes") String featureTypesStr, @QueryParam("download") boolean isDownload) {
        String html = "<div class=\"metadata-structure\"><ul>";
        if (urlStr != null) {
            try {
                String urlGetCap = urlStr;
                if (urlGetCap.indexOf("?") == -1) {
                    urlGetCap += "?";
                }
                if (urlGetCap.toLowerCase().indexOf("request=") == -1) {
                    urlGetCap += "&Request=GetCapabilities";
                }
                if (urlGetCap.toLowerCase().indexOf("service=") == -1) {
                    urlGetCap += "&Service=WFS";
                }
                if (urlGetCap.toLowerCase().indexOf("version=") == -1) {
                    urlGetCap += "&Version=2.0.0";
                }
                URL url = new URL(urlGetCap);
                URLConnection conn = url.openConnection();
                InputStream is = new BufferedInputStream(conn.getInputStream());
                Document doc = Utils.getDocumentFromStream(is);
                XPath xpath = XPathFactory.newInstance().newXPath();
                String title = xpath.evaluate("//ServiceIdentification/Title", doc);
                if (titleStr != null && !titleStr.isEmpty()) {
                    title = titleStr;
                }
                NodeList featureTypes = (NodeList) xpath.evaluate("//FeatureTypeList/FeatureType", doc, XPathConstants.NODESET);
                html += "<li><div>";
                html += "<span title=\"" + title + "\">"
                        + title
                        + "</span></div></li>";
                html += "<ul>";
                ArrayList<String> featureTypeList = new ArrayList<String>();
                if (featureTypesStr != null) {
                    String[] includeFeatureTypes = featureTypesStr.split(",");
                    for (String includeFeatureType : includeFeatureTypes) {
                        featureTypeList.add(includeFeatureType);
                    }
                }
                boolean hasToExclude = false;
                if (!featureTypesStr.isEmpty()) {
                    hasToExclude = true;
                }
                if (featureTypes.getLength() > 0) {
                    for (int i = 0; i < featureTypes.getLength(); i++) {
                        Node featureType = featureTypes.item(i);
                        String featureName = xpath.evaluate("./Name", featureType);
                        String featureTitle = xpath.evaluate("./Title", featureType);
                        if ((hasToExclude && featureTypeList.indexOf(featureName) > -1) || !hasToExclude) {
                            String urlGetFeature = urlStr + "&Request=GetFeature&Service=WFS&Version=2.0.0&TYPENAMES=" + featureName;
                            if (filterStr != null) {
                                urlGetFeature += filterStr;
                            }
                            if (isDownload) {
                                urlGetFeature = "/ingrid-webmap-client/rest/wms/wfsDownload/download?url=" + URLEncoder.encode(urlGetFeature);
                            }
                            html += "<li><div>";
                            html += "<a target=\"_blank\" href=\"" + urlGetFeature + "\" title=\"" + featureTitle + "\">"
                                    + featureTitle
                                    + "</a>";
                            html += "</div></li>";
                        }
                    }
                }
                html += "</ul>";
                html += "</div>";
            } catch (Exception e) {
                log.error("Error read GetCapabilities: " + urlStr, e);
            }
        }
        html += "</ul></div>";
        return Response.ok(html).build();
    }

    @GET
    @Path("wfsDownload/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response wfsDownloadContentRequest(@QueryParam("url") String urlStr) throws MalformedURLException {
        URL url = new URL(urlStr);
        String filename = "unknown";
        String urlQuery = url.getQuery().toLowerCase();
        if (urlQuery.indexOf("typenames=") > -1 && urlQuery.indexOf("service=wfs") > -1
                && urlQuery.indexOf("request=getfeature") > -1) {
            String[] params = url.getQuery().split("&");
            for (String param : params) {
                String[] paramKeyValue = param.split("=");
                if (paramKeyValue.length > 1) {
                    String key = paramKeyValue[0];
                    String value = paramKeyValue[1];
                    if (key.toLowerCase().equals("typenames")) {
                        value = value.replace(":", "-");
                        value = value.replace("\\", "-");
                        value = value.replace("/", "-");
                        value = value.replace("*", "-");
                        value = value.replace("?", "-");
                        value = value.replace("\"", "-");
                        value = value.replace("<", "-");
                        value = value.replace(">", "-");
                        value = value.replace("|", "-");
                        filename = value;
                    }
                }
            }
            filename += ".gml";
            try {
                InputStream inputStream = url.openStream();
                return Response.ok(inputStream, MediaType.APPLICATION_OCTET_STREAM)
                        .header("Content-Disposition", "attachment; filename=\"" + filename + "\"") //optional
                        .build();
            } catch (IOException e) {
                // handle exception
            } finally {
            }
        }
        throw new WebApplicationException(Response.Status.NOT_FOUND);
    }

    private String getWmsInfo(XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle, String layerLegend, String portalUrl) throws XPathExpressionException {
        String html = "";
        // Create HTML
        html += "<div ng-if=\"showWMSTree\" class=\"tabbable\">";

        html += "<ul class=\"nav nav-tabs\">";
        html += "<li ng-class=\"getTabClass(1)\">";
        html += "<a ng-click=\"activeTab(1)\" ng-keypress=\"activeTab(1)\" tabindex=\"0\" translate>metadata_data</a>";
        html += "</li>";
        html += "<li ng-class=\"getTabClass(2)\">";
        html += "<a ng-click=\"activeTab(2)\" ng-keypress=\"activeTab(2)\" tabindex=\"0\" translate>metadata_structure</a>";
        html += "</li>";
        html += "</ul>";

        html += "<div class=\"tab-content\">";

        html += "<div class=\"tab-pane\" ng-class=\"getTabClass(1)\">";
        html += getWMSInfoData(xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend, portalUrl);
        html += "</div>";

        html += "<div class=\"tab-pane\" ng-class=\"getTabClass(2)\">";
        html += getWMSInfoTree(xpath, doc, layerName);
        html += "</div>";

        html += "</div>";
        html += "</div>";

        html += "<div ng-if=\"!showWMSTree\">";
        html += getWMSInfoData(xpath, doc, serviceCapabilitiesURL, layerName, layerTitle, layerLegend, portalUrl);
        html += "</div>";

        return html;
    }

    private String getWMSInfoTree(XPath xpath, Document doc, String layerName) throws XPathExpressionException {
        Node field = null;
        StringBuilder html = new StringBuilder("<div class=\"metadata-structure\">");
        field = (Node) xpath.evaluate(".//Service/Title", doc, XPathConstants.NODE);
        StringBuilder wmsStructure = new StringBuilder("");
        if (field != null) {
            wmsStructure.append("<h4>" + field.getTextContent() + "</h4>");
            wmsStructure.append("<br>");
        }

        NodeList fields = (NodeList) xpath.evaluate("./*/Capability/Layer", doc, XPathConstants.NODESET);
        if (fields != null) {
            StringBuilder wmsStructureLayers = new StringBuilder(getSubLayers(fields, xpath, layerName));
            wmsStructure.append("<ul>");
            wmsStructure.append(wmsStructureLayers);
            wmsStructure.append("</ul>");
        }
        html.append(wmsStructure);
        html.append("</div>");
        return html.toString();
    }

    private String getWMSInfoData(XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle,
                                  String layerLegend, String portalUrl) throws XPathExpressionException {
        StringBuilder html = new StringBuilder("");
        html.append("<div class=\"legend-container\">");
        html.append("<div class=\"legend-footer\">");
        html.append("<span translate>metadata_information_layer</span><br>");
        if (layerName != null) {
            ArrayList<String> layerAbstracts = new ArrayList<>();
            ArrayList<String> layerLegends = new ArrayList<>();
            String[] layers = layerName.split(",");
            for (String layer : layers) {
                Node field = (Node) xpath.evaluate("//Layer/Name[text()=\"" + layer + "\"]", doc, XPathConstants.NODE);
                if (field != null) {
                    Node abstractField = (Node) xpath.evaluate("./Abstract", field.getParentNode(), XPathConstants.NODE);
                    if (abstractField != null) {
                        layerAbstracts.add(abstractField.getTextContent());
                    }
                    field = (Node) xpath.evaluate("./Style/LegendURL/OnlineResource/@href", field.getParentNode(), XPathConstants.NODE);
                    if (field != null) {
                        layerLegends.add(field.getTextContent());
                    }
                }
            }
            html.append("<table>");
            html.append("<tbody>");
            if (layerTitle != null) {
                html.append("<tr>");
                html.append("<td translate>metadata_service_title</td>");
                html.append("<td>" + layerTitle + "</td>");
                html.append("</tr>");
            }
            if (layerAbstracts != null && !layerAbstracts.isEmpty()) {
                for (int i = 0; i < layerAbstracts.size(); i++) {
                    if (i == 0 && layerAbstracts.size() <= 1) {
                        html.append("<tr>");
                        html.append("<td translate>metadata_service_abstract</td>");
                    } else if (i == layerAbstracts.size() - 1) {
                        html.append("<tr>");
                        html.append("<td></td>");
                    } else {
                        html.append("<tr style=\"border-bottom:0;\">");
                        html.append("<td></td>");
                    }
                    html.append("<td>" + layerAbstracts.get(i) + "</td>");
                    html.append("</tr>");
                }
            }
            if (layers.length > 0) {
                for (int i = 0; i < layers.length; i++) {
                    if (i == 0 && layers.length <= 1) {
                        html.append("<tr ng-if=\"showWMSName\">");
                        html.append("<td translate>metadata_service_layer</td>");
                    } else if (i == layers.length - 1) {
                        html.append("<tr ng-if=\"showWMSName\">");
                        html.append("<td></td>");
                    } else {
                        html.append("<tr ng-if=\"showWMSName\" style=\"border-bottom:0;\">");
                        html.append("<td></td>");
                    }
                    html.append("<td>" + layers[i] + "</td>");
                    html.append("</tr>");
                }
            }
            if (portalUrl != null && !portalUrl.isEmpty()) {
                html.append("<tr>");
                html.append("<td translate>metadata_service_portalUrl</td>");
                html.append("<td><a target=\"new\" href=\"" + portalUrl + "\">" + portalUrl + "</a></td>");
                html.append("</tr>");
            }
            html.append("</tbody>");
            html.append("</table>");
            html.append("<div class=\"legend\">");
            html.append("<span translate>metadata_legend</span><br>");
            html.append("<div class=\"img-container\">");
            if (!layerLegends.isEmpty()) {
                for (int i = 0; i < layerLegends.size(); i++) {

                    html.append("<img alt=\"{{'no_legend_available' | translate}}\" src=\"");
                    html.append(layerLegends.get(i));
                    html.append("\">");
                    if (i != layerLegends.size() - 1) {
                        html.append("<hr>");
                    }
                }
            } else if (layerLegend != null && !layerLegend.equals("undefined")) {
                html.append("<img alt=\"{{'no_legend_available' | translate}}\" src=\"");
                html.append(layerLegend);
                html.append("\">");
            } else {
                html.append("<img alt=\"{{'no_legend_available' | translate}}\">");
            }
        }
        html.append("</div>");
        html.append("</div>");
        html.append("<span translate>metadata_information_service</span><br>");
        html.append("<table>");
        html.append("<tbody>");
        Node field = (Node) xpath.evaluate(".//Service/Title", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_title</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/Name", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_id</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/Abstract", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_abstract</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/Fees", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_fees</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/AccessConstraints", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_accessconstraints</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactPersonPrimary/ContactPerson", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_contactperson</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactPersonPrimary/ContactOrganization", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_organisation</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactAddress/Address", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_addresse</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        String city = null;
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactAddress/City", doc, XPathConstants.NODE);
        if (field != null) {
            city = HtmlEncoder.encode(field.getTextContent());
        }
        String plz = null;
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactAddress/PostCode", doc, XPathConstants.NODE);
        if (field != null) {
            plz = HtmlEncoder.encode(field.getTextContent());
        }
        if (city != null || plz != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_city</td>");
            html.append("<td>");
            if (plz != null) {
                html.append("" + plz + " ");
            }
            if (city != null) {
                html.append("" + city);
            }
            html.append("</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactAddress/Country", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_country</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactVoiceTelephone", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_phone</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactFacsimileTelephone", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_fax</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/ContactInformation/ContactElectronicMailAddress", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_mail</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//Service/OnlineResource/@href", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_resource</td>");
            html.append("<td><a target=\"new\" href=\"" + field.getTextContent() + "\">" + field.getTextContent() + "</a></td>");
            html.append("</tr>");
        }
        if (serviceCapabilitiesURL != null) {
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

    private String getWmtsInfo(XPath xpath, Document doc, String serviceCapabilitiesURL, String layerName, String layerTitle, String layerLegend, String portalUrl) throws XPathExpressionException {
        Node field = (Node) xpath.evaluate("//Layer/Identifier[text()=\"" + layerName + "\"]", doc, XPathConstants.NODE);
        Node layerField = null;
        StringBuilder html = new StringBuilder("");
        String layerAbstract = null;

        if (field != null) {
            layerField = field.getParentNode();
            field = (Node) xpath.evaluate("./Abstract", layerField, XPathConstants.NODE);
            if (field != null) {
                layerAbstract = field.getTextContent();
            }
            field = (Node) xpath.evaluate("./Title", layerField, XPathConstants.NODE);
            if (field != null) {
                layerTitle = field.getTextContent();
            }

        }

        // Create HTML
        html.append("<div class=\"legend-container\">");
        html.append("<div class=\"legend-footer\">");
        html.append("<span translate>metadata_information_layer</span><br>");
        html.append("<table>");
        html.append("<tbody>");
        if (layerTitle != null) {
            if (layerTitle != null) {
                html.append("<tr>");
                html.append("<td translate>metadata_service_title</td>");
                html.append("<td>" + layerTitle + "</td>");
                html.append("</tr>");
            }
        }
        if (layerAbstract != null) {
            if (layerAbstract != null && !layerAbstract.isEmpty()) {
                html.append("<tr>");
                html.append("<td translate>metadata_service_abstract</td>");
                html.append("<td>" + layerAbstract + "</td>");
                html.append("</tr>");
            }
        }
        if (!layerName.isEmpty()) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_layer</td>");
            html.append("<td>" + layerName + "</td>");
            html.append("</tr>");
        }
        if (portalUrl != null && !portalUrl.isEmpty()) {
            html.append("<tr style=\"border-bottom:0;\">");
            html.append("<td translate>metadata_service_portalUrl</td>");
            html.append("<td><a target=\"new\" href=\"" + portalUrl + "\">" + portalUrl + "</a></td>");
            html.append("</tr>");
        }
        html.append("</tbody>");
        html.append("</table>");
        if (layerLegend == null || layerLegend.equals("undefined")) {
            field = (Node) xpath.evaluate("./Style/LegendURL/@href", layerField, XPathConstants.NODE);
            if (field != null) {
                layerLegend = field.getTextContent();
            } else {
                layerLegend = null;
            }

        }
        html.append("<div class=\"legend\">");
        html.append("<span translate>metadata_legend</span><br>");
        html.append("<div class=\"img-container\">");
        html.append("<img alt=\"{{'no_legend_available' | translate}}\" src=\"");
        if (layerLegend != null && !layerLegend.equals("undefined")) {
            html.append(layerLegend);
        }
        html.append("\">");
        html.append("</div>");
        html.append("</div>");
        html.append("<span translate>metadata_information_service</span><br>");
        html.append("<table>");
        html.append("<tbody>");
        field = (Node) xpath.evaluate(".//ServiceIdentification/Title", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_title</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceIdentification/ServiceType", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_id</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceIdentification/Abstract", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_abstract</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceIdentification/Fees", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_fees</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceIdentification/AccessConstraints", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_accessconstraints</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceProvider/ProviderName", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_contactperson</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceProvider/ServiceContact/IndividualName", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_organisation</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceProvider/ServiceContact/ContactInfo/Address/DeliveryPoint", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_addresse</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        String city = null;
        field = (Node) xpath.evaluate(".//ServiceProvider/ServiceContact/ContactInfo/Address/City", doc, XPathConstants.NODE);
        if (field != null) {
            city = HtmlEncoder.encode(field.getTextContent());
        }
        String plz = null;
        field = (Node) xpath.evaluate(".//ServiceProvider/ServiceContact/ContactInfo/Address/PostalCode", doc, XPathConstants.NODE);
        if (field != null) {
            plz = HtmlEncoder.encode(field.getTextContent());
        }
        if (city != null || plz != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_city</td>");
            html.append("<td>");
            if (plz != null) {
                html.append("" + plz + " ");
            }
            if (city != null) {
                html.append("" + city);
            }
            html.append("</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceProvider/ServiceContact/ContactInfo/Address/Country", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_country</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceProvider/ServiceContact/ContactInfo/Phone/Voice", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_phone</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceProvider/ServiceContact/ContactInfo/Phone/Facsimile", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_fax</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceProvider/ServiceContact/ContactInfo/Address/ElectronicMailAddress", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_mail</td>");
            html.append("<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>");
            html.append("</tr>");
        }
        field = (Node) xpath.evaluate(".//ServiceProvider/ProviderSite/@href", doc, XPathConstants.NODE);
        if (field != null) {
            html.append("<tr>");
            html.append("<td translate>metadata_service_resource</td>");
            html.append("<td><a target=\"new\" href=\"" + field.getTextContent() + "\">" + field.getTextContent() + "</a></td>");
            html.append("</tr>");
        }
        if (serviceCapabilitiesURL != null) {
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

    private String getSubLayers(NodeList fields, XPath xpath, String layername) throws XPathExpressionException {
        StringBuilder html = new StringBuilder("");
        for (int i = 0; i < fields.getLength(); i++) {
            boolean isLayerName = false;
            Node node = fields.item(i);
            if (node != null) {
                Node field = (Node) xpath.evaluate("./Title", node, XPathConstants.NODE);
                if (field != null) {
                    Node nodeName = (Node) xpath.evaluate("./Name", node, XPathConstants.NODE);
                    String[] splitLayernames = layername.split(",");
                    for (int j = 0; j < splitLayernames.length; j++) {
                        String splitLayername = splitLayernames[j];
                        if (nodeName != null && splitLayername != null && nodeName.getTextContent().trim().equals(splitLayername.trim())) {
                            isLayerName = true;
                        }
                    }
                }

                html.append("<li");
                if (isLayerName) {
                    html.append(" class=\"active\"");
                }
                html.append(">");
                if (field != null) {
                    html.append("<div>");
                    html.append("<span title=\"" + field.getTextContent() + "\">");
                    html.append("<label class=\"ga-truncate-text\">");
                    html.append(field.getTextContent());
                    html.append("</label>");
                    html.append("</span>");
                    html.append("</div>");
                }
                html.append("</li>");

                NodeList subFields = (NodeList) xpath.evaluate("./Layer", node, XPathConstants.NODESET);
                if (subFields != null && subFields.getLength() > 0) {
                    StringBuilder wmsStructerLayers = new StringBuilder(getSubLayers(subFields, xpath, layername));
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

    private static JsonNode readJsonFromUrl(String url) throws IOException {
        InputStream is = new URL(url).openStream();
        try (
                BufferedReader rd = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        ) {
            String jsonText = readAll(rd);
            return mapper.readTree(jsonText);
        } finally {
            is.close();
        }
    }
}
