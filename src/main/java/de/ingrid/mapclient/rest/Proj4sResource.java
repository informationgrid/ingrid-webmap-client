/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URL;
import java.util.regex.Pattern;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

import de.ingrid.mapclient.HttpProxy;

/**
 * Proj4sResource defines the interface for retrieving Proj4s data
 * 
 * @author ingo@wemove.com
 */
@Path("/proj4s")
public class Proj4sResource {

	private static final Logger log = Logger.getLogger(Proj4sResource.class);

	/**
	 * Path to user data functions
	 */
	private static final String DEFS_PATH = "defs";

	/**
	 * The url pattern for retrieving proj4s data
	 */
	private final static String BASE_URL = "http://spatialreference.org/ref/epsg/CODE/proj4js";

	/**
	 * The pattern in BASE_URL that will be replaced by the code
	 */
	private final static Pattern CODE_URL_PATTERN = Pattern.compile("CODE");

	/**
	 * The pattern that the code parameter must match
	 */
	private final static Pattern CODE_SYNTAX_PATTERN = Pattern.compile("([0-9]+)", Pattern.CASE_INSENSITIVE);



	/**
	 * Get Proj4s projection definition for the given code
	 * @param code The projection code
	 * @return String
	 */
	@GET
	@Path(DEFS_PATH+"/{code}")
	@Produces("application/javascript")
	public String getProjectionDefinition(@PathParam("code") String code) {
		// check if the code string is valid
		if (!CODE_SYNTAX_PATTERN.matcher(code).find()) {
			throw new IllegalArgumentException("The code is not a valid epsg code number: "+code);
		}
		
		String response = null;
		response = getLocalProjDef(code);
		if (response != null) {
		    return response;
		}
        if (log.isDebugEnabled()) {
            log.debug("EPSG:" + code + " not found in local storage. Try to fetch from remote.");
        }


		try {
			String url = CODE_URL_PATTERN.matcher(BASE_URL).replaceAll(code);
			response = HttpProxy.doRequest(url);
			return response;
		}
		catch (Exception ex) {
			log.error("Error sending Proj4s request for code: "+code, ex);
			throw new WebApplicationException(ex, Response.Status.NOT_FOUND);
		}
	}
	
	private String getLocalProjDef(String code) {
	    URL refUrl = this.getClass().getClassLoader().getResource("application.properties");
	    String path = refUrl.getPath().substring(0, refUrl.getPath().length() - "application.properties".length());
	    path = path + "../../lib/proj4js/lib/defs/EPSG"+code+".js";
	    File codeFile = new File(path);
	    if (codeFile.exists()) {
	        try {
                return readFileAsString(codeFile);
            } catch (IOException e) {
                return null;
            }
	    } else {
	        return null;
	    }
	}
	
	private String readFileAsString(File file) throws java.io.IOException{
	    byte[] buffer = new byte[(int) file.length()];
	    BufferedInputStream f = null;
	    try {
	        f = new BufferedInputStream(new FileInputStream(file));
	        f.read(buffer);
	    } finally {
	        if (f != null) try { f.close(); } catch (IOException ignored) { }
	    }
	    return new String(buffer);
	}
}