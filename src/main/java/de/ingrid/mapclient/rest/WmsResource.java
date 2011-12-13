/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import java.util.regex.Pattern;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

import de.ingrid.mapclient.HttpProxy;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/wms")
public class WmsResource {

	private static final Logger log = Logger.getLogger(WmsResource.class);

	/**
	 * The service pattern that urls must match
	 */
	private final static Pattern SERVICE_PATTERN = Pattern.compile("SERVICE=WMS", Pattern.CASE_INSENSITIVE);

	/**
	 * The request pattern that urls must match
	 */
	private final static Pattern REQUEST_PATTERN = Pattern.compile("REQUEST=(GetCapabilities|GetFeatureInfo)", Pattern.CASE_INSENSITIVE);


	/**
	 * Get WMS response from the given url
	 * @param url The request url
	 * @return String
	 */
	@GET
	@Path("proxy")
	@Produces(MediaType.TEXT_PLAIN)
	public String doWmsRequest(@QueryParam("url") String url) {
		// check if the url string is valid
		if (!SERVICE_PATTERN.matcher(url).find() && !REQUEST_PATTERN.matcher(url).find()) {
			throw new IllegalArgumentException("The url is not a valid wms request: "+url);
		}

		try {
			String response = HttpProxy.doRequest(url);
			return response;
		}
		catch (Exception ex) {
			log.error("Error sending WMS request: "+url, ex);
			throw new WebApplicationException(ex, Response.Status.NOT_FOUND);
		}
	}
}