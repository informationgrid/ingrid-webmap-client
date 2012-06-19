package de.ingrid.mapclient.url;

import de.ingrid.mapclient.url.impl.DbUrlMapper;

/**
 * UrlManager is used to retrieve the UrlMapper implementation.
 * 
 * @author ingo@wemove.com
 */
public enum UrlManager {

	// singleton instance
	INSTANCE;

	// UrlMapper instance
	private UrlMapper urlMapper = null;;

	/**
	 * Get the UrlMapper implementation
	 * @return UrlMapper
	 */
	public UrlMapper getUrlMapper() {
		if (this.urlMapper == null) {
			this.urlMapper = new DbUrlMapper();
		}
		return this.urlMapper;
	}
}
