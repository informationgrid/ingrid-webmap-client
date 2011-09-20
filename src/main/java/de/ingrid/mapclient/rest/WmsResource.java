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

import de.ingrid.mapclient.WmsProxy;

/**
 * WmsResource defines the interface for retrieving WMS data
 * 
 * @author ingo@wemove.com
 */
@Path("/wms")
public class WmsResource {

	/**
	 * Get capabilities document from the given url
	 * @param url The GetCapabilities url
	 * @return String
	 */
	@GET
	@Path("capabilities")
	@Produces(MediaType.TEXT_XML)
	public String getUserDefaultMap(@QueryParam("url") String capUrl) {

		try {
			String capDoc = WmsProxy.getCapabilities(capUrl);
			return capDoc;
		}
		catch (Exception ex) {
			throw new WebApplicationException(ex, Response.Status.NOT_FOUND);
		}
	}
}