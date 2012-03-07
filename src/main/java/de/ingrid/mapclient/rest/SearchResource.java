package de.ingrid.mapclient.rest;

import java.io.IOException;
import java.io.Writer;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import com.thoughtworks.xstream.io.json.JsonHierarchicalStreamDriver;
import com.thoughtworks.xstream.io.json.JsonWriter;

import de.ingrid.mapclient.Configuration;
import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.model.ServiceCategory;
import de.ingrid.mapclient.model.WmsServer;





@Path("/search")
public class SearchResource {

	
	private static final Logger log = Logger.getLogger(SearchResource.class);
	
	/**
	 * Path to search term
	 */
	private static final String SEARCH_PATH = "query";
	
	@GET
	@Path(SEARCH_PATH)
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.APPLICATION_JSON)
	public Response search(@QueryParam("searchTerm") String searchTerm) {

			try {
				ServiceCategory cats = ConfigurationProvider.INSTANCE.getConfiguration().getServiceCategories().get(0);
				
				XStream xstream = new XStream(new JsonHierarchicalStreamDriver() {
					@Override
					public HierarchicalStreamWriter createWriter(Writer writer) {
						return new JsonWriter(writer, JsonWriter.DROP_ROOT_MODE);
					}
				});
				List<WmsServer> services = cats.getServiceCategories().get(1).getServices();
				System.out.println(xstream.toXML(services));
				String json = xstream.toXML(services);
				return Response.ok(json).build();
			}
			catch (Exception ex) {
				log.error("Error retrieving dynamic application configuration", ex);
				throw new WebApplicationException(ex, Response.Status.SERVICE_UNAVAILABLE);
			}

	}
}
