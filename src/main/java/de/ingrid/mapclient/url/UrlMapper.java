package de.ingrid.mapclient.url;

/**
 * Interface for mapping short urls to long urls.
 * 
 * @author ingo@wemove.com
 */
public interface UrlMapper {

	/**
	 * Get the short url for a given long url
	 * @param longUrl
	 * @return String
	 * @throws Exception
	 */
	public String getShortUrl(String longUrl) throws Exception;

	/**
	 * Get the long url for a given short url
	 * @param shortUrl
	 * @return String
	 * @throws Exception
	 */
	public String getLongUrl(String shortUrl) throws Exception;
}
