package de.ingrid.mapclient.rest;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;



@Path("/jsonCallback")
public class JsonCallbackResource{

	
	private static final Logger log = Logger.getLogger(JsonCallbackResource.class);
	
	/**
	 * Path to search term
	 */
	private static final String SEARCH_PATH = "query";
	private static final String SEARCHPOST_PATH = "queryPost";
	
	@GET
	@Path(SEARCH_PATH)
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.APPLICATION_JSON)
	public Response search(@QueryParam("searchterm") String searchTerm, @QueryParam("json_callback") String jsonCallback, @QueryParam("url") String paramURL, @QueryParam("searchID") String identifier) throws IOException {

		searchTerm = searchTerm.trim();
		try {
		    searchTerm = URLEncoder.encode(searchTerm, "UTF-8").replace("+", "%20");
		} catch (Exception e) {
		    log.error("Error url encoding seach term: " + searchTerm, e);
		}
		
		URL url = new URL(paramURL.concat("&" + identifier+"="+searchTerm));
		URLConnection con = url.openConnection();
		InputStream in = con.getInputStream();
		String encoding = con.getContentEncoding();
		encoding = encoding == null ? "UTF-8" : encoding;
		
		String json = IOUtils.toString(in, encoding);
		if(jsonCallback != null){
			if(json.indexOf(jsonCallback) < 0){
				json  = jsonCallback + "("+json+")";
			}
		}
		return Response.ok(json).build();

	}
	
	@GET
	@Path(SEARCHPOST_PATH)
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.APPLICATION_JSON)
	public Response searchPost(@QueryParam("data") String data, @QueryParam("url") String paramURL) throws IOException {

		String content = "content=" + URLEncoder.encode(data.trim(), "UTF-8");
		
		URL url = new URL(paramURL);
		HttpURLConnection con = (HttpURLConnection) url.openConnection();
		con.setRequestMethod("POST");
		con.setDoInput(true);
		con.setDoOutput(true);
		con.setRequestProperty("Content-Type", MediaType.APPLICATION_FORM_URLENCODED);
		con.setRequestProperty("Content-Length", String.valueOf(content.length()));
		
		OutputStreamWriter writer = new OutputStreamWriter( con.getOutputStream() );
		writer.write(content);
		writer.flush();
		
		InputStream in = con.getInputStream();
		String encoding = con.getContentEncoding();
		encoding = encoding == null ? "UTF-8" : encoding;
		
		String json = IOUtils.toString(in, encoding);
		return Response.ok(json).build();

	}
}
