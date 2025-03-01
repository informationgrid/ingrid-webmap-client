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

import java.io.File;
import java.net.URL;
import java.util.regex.Pattern;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;

import de.ingrid.mapclient.HttpProxy;
import de.ingrid.mapclient.utils.Utils;

/**
 * Proj4sResource defines the interface for retrieving Proj4s data
 * 
 * @author ingo@wemove.com
 */
@Path("/proj4s")
public class Proj4sResource {

    private static final Logger log = Logger.getLogger( Proj4sResource.class );

    /**
     * Path to user data functions
     */
    private static final String DEFS_PATH = "defs";

    /**
     * The url pattern for retrieving proj4s data
     */
    private static final String BASE_URL = "http://spatialreference.org/ref/epsg/CODE/proj4js";

    /**
     * The pattern in BASE_URL that will be replaced by the code
     */
    private static final Pattern CODE_URL_PATTERN = Pattern.compile( "CODE" );

    /**
     * The pattern that the code parameter must match
     */
    private static final Pattern CODE_SYNTAX_PATTERN = Pattern.compile( "([0-9]+)", Pattern.CASE_INSENSITIVE );

    /**
     * Get Proj4s projection definition for the given code
     * 
     * @param code
     *            The projection code
     * @return String
     */
    @GET
    @Path(DEFS_PATH + "/{code}")
    @Produces("application/javascript")
    public String getProjectionDefinition(@PathParam("code") String code) {
        // check if the code string is valid
        if (!CODE_SYNTAX_PATTERN.matcher( code ).find()) {
            throw new IllegalArgumentException( "The code is not a valid epsg code number: " + code );
        }

        String response = null;
        response = getLocalProjDef( code );
        if(StringUtils.isNotEmpty(response)) {
            return response;
        }
        if (log.isDebugEnabled()) {
            log.debug( "EPSG:" + code + " not found in local storage. Try to fetch from remote." );
        }

        try {
            String url = CODE_URL_PATTERN.matcher( BASE_URL ).replaceAll( code );
            if (url != null && !url.endsWith( "/" )) {
                url = url + "/";
            }
            response = HttpProxy.doRequest( url );
            return response;
        } catch (Exception ex) {
            log.error( "Error sending Proj4s request for code: " + code, ex );
            throw new WebApplicationException( ex, Response.Status.NOT_FOUND );
        }
    }

    private String getLocalProjDef(String code) {
        URL refUrl = this.getClass().getClassLoader().getResource( "application.properties" );
        String path = refUrl.getPath().substring( 0, refUrl.getPath().length() - "application.properties".length() );
        path = path + "../../lib/proj4js/lib/defs/EPSG" + code + ".js";
        File codeFile = new File( path );
        if (codeFile.exists()) {
            try {
                return Utils.readFileAsString( codeFile );
            } catch (Exception e) {
                return "";
            }
        } else {
            return "";
        }
    }
}
