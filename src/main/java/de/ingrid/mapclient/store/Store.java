package de.ingrid.mapclient.store;

import java.io.IOException;
import java.util.List;

/**
 * Interface for data store functionality.
 * @author ingo@wemove.com
 */
public interface Store {

	/**
	 * Get all record ids contained in this store
	 * @return List<String>
	 */
	public List<String> getRecordIds() throws IOException;

	/**
	 * Get the record with the given record id.
	 * @param recordId
	 * @return String
	 */
	public String getRecord(String recordId) throws IOException;

	/**
	 * Store/overwrite the given record with the given record id.
	 * @param recordId
	 * @param record
	 */
	public void putRecord(String recordId, String record) throws IOException;

	/**
	 * Remove the record with the given record id.
	 * @param recordId
	 */
	public void removeRecord(String recordId) throws IOException;
}
