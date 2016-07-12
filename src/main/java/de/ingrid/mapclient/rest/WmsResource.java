/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
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
import javax.xml.xpath.XPathFactory;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.lowagie.text.html.HtmlEncoder;
import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.json.JsonHierarchicalStreamDriver;
import com.thoughtworks.xstream.io.json.JsonWriter;

import de.ingrid.iplug.opensearch.communication.OSCommunication;
import de.ingrid.mapclient.HttpProxy;

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
                return response;
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
            String wmsURL = null;
            String wmsLegend = null;
            String wmsTitle = null;
            String wmsName = null;
            String wmsHost = null;
            String wmsLayerAbstract = null;
            
            if(layer.indexOf("||") > -1){
                // Extern WMS
                String[] layerSplit = layer.split( "\\|\\|" );
                if(layerSplit != null && layerSplit.length > 0){
                    // WMS||Wasserstrassenklassen||http://atlas.wsv.bund.de/bwastr/wms?||Wasserstrassenklassen||1.1.1||true
                    wmsTitle = layerSplit[1];
                    wmsName = layerSplit[3];
                    wmsHost = layerSplit[2];
                    if(wmsHost.indexOf("?") == -1){
                        wmsHost = wmsHost + "?";
                    }
                    String wmsVersion = "1.3.0"; 
                    if(layerSplit[4] != null){
                        wmsVersion = layerSplit[4];
                    }
                    wmsURL = wmsHost + "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=" + wmsVersion;
                }
            }else {
                // Intern WMS
                JSONObject json = readJsonFromUrl(url);
                if(json != null){
                    JSONObject jsonLayer = (JSONObject) json.get(layer);
                    if(jsonLayer != null){
                        wmsTitle = jsonLayer.getString("label");
                        wmsHost = jsonLayer.getString("wmsUrl");
                        if(wmsHost.indexOf("?") == -1){
                            wmsHost = wmsHost + "?";
                        }
                        wmsURL = wmsHost + "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=" + jsonLayer.getString("version");
                        wmsLegend = jsonLayer.getString("legendUrl");
                        wmsName = jsonLayer.getString("wmsLayers");
                    }
                }
            }
            if(wmsLegend == null){
                wmsLegend = legend;
            }
            
            if(wmsURL != null && wmsName != null){
                String response = HttpProxy.doRequest( wmsURL );
                DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
                docFactory.setValidating(false);
                Document doc =  docFactory.newDocumentBuilder().parse(new InputSource(new StringReader(response)));
                XPath xpath = XPathFactory.newInstance().newXPath();
                Node field = null;
                Node layerField = null;
                
                field = (Node) xpath.evaluate("//Layer/Name[text()=\""+wmsName+"\"]", doc, XPathConstants.NODE);
                if(field != null){
                    layerField = field.getParentNode();
                    field = (Node) xpath.evaluate( "./Abstract", layerField, XPathConstants.NODE);
                    if(field != null){
                        wmsLayerAbstract = HtmlEncoder.encode(field.getTextContent());
                    }
                }
                
                // Create HTML
                html = html + "<div class=\"legend-container\">";
                html = html + "<div class=\"legend-header\">";
                if(wmsTitle != null){
                    html = html + "<p class=\"bod-title\">" + wmsTitle + "</p>";
                }
                if(wmsLayerAbstract != null){
                    html = html + "<p class=\"legend-abstract\">" + wmsLayerAbstract + "</p>";
                }
                
                html = html + "</div>";
                html = html + "<div class=\"legend-footer\">";
                if(wmsLegend != null){
                    html = html + "<br>";
                    html = html + "<span>metadata_legend</span><br>";
                    html = html + "<div class=\"img-container\">";
                    html = html + "<img alt=\"layer legend img\" src=\"" + wmsLegend + "\">";
                    html = html + "</div>";
                }
                html = html + "<br><br>";
                html = html + "<span>metadata_information</span><br>";
                html = html + "<table>";
                html = html + "<tbody>";
                
                field = (Node) xpath.evaluate( ".//Service/Title", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_title</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/Name", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_id</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                     html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/Abstract", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_abstract</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/Fees", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_fees</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/AccessConstraints", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_accessconstraints</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactPersonPrimary/ContactPerson", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_contactperson</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactPersonPrimary/ContactOrganization", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_organisation</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/Address", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_addresse</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
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
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_city</td>";
                    html = html + "<td>";
                    if(plz != null){
                        html = html + "" + plz + " ";
                    }
                    if(city != null){
                        html = html + "" + city;
                    }
                    html = html + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactAddress/Country", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_country</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactVoiceTelephone", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_phone</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactFacsimileTelephone", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_fax</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/ContactInformation/ContactElectronicMailAddress", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_mail</td>";
                    html = html + "<td>" + HtmlEncoder.encode(field.getTextContent()) + "</td>";
                    html = html + "</tr>";
                }

                field = (Node) xpath.evaluate( ".//Service/OnlineResource/@href", doc, XPathConstants.NODE);
                if(field != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_resource</td>";
                    html = html + "<td><a target=\"new\" href=\"" + field.getTextContent() + "\">"+ field.getTextContent() + "</a></td>";
                    html = html + "</tr>";
                }
                
                if(wmsURL != null){
                    html = html + "<tr>";
                    html = html + "<td>metadata_service_url</td>";
                    html = html + "<td><a target=\"new\" href=\"" + wmsURL + "\">metadata_service_url_link</a></td>";
                    html = html + "</tr>";
                }
                
                html = html + "</tbody>";
                html = html + "</table>";
                html = html + "</div>";
                html = html + "</div>";
            }
        }
        return Response.ok(html).build();
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
