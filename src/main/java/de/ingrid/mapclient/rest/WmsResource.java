/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.rest;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

import de.ingrid.mapclient.WmsProxy;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/wms")
public class WmsResource {

	private static final Logger log = Logger.getLogger(WmsResource.class);

	/**
	 * Get capabilities document from the given url
	 * @param url The GetCapabilities url
	 * @return String
	 */
	@GET
	@Path("capabilities")
	@Produces(MediaType.TEXT_XML)
	public String doWmsRequest(@QueryParam("url") String url) {
		try {
			String response = WmsProxy.doRequest(url);
			return response;
		}
		catch (Exception ex) {
			log.error("Error sending WMS request", ex);
			throw new WebApplicationException(ex, Response.Status.NOT_FOUND);
		}
	}
}