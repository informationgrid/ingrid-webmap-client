package de.ingrid.mapclient.store;

import java.io.File;
import java.util.List;

/**
 * FileMappingStrategy implementations are used to define the relative
 * location of a file belonging to a given id. FileStore instances use
 * them to locate files beneath their base path.
 * @author ingo@wemove.com
 */
public interface FileMappingStrategy {

	/**
	 * Get the relative path (including the filename) of the file belonging
	 * to a given id.
	 * @param id
	 * @return String
	 */
	String getFilePath(String id);

	/**
	 * Get a list of ids mapped by this strategy
	 * @param basePath The base path to search from
	 * @return List<String>
	 */
	List<String> getMappedIds(File basePath);
}
