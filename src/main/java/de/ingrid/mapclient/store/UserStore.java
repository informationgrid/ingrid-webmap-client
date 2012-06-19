package de.ingrid.mapclient.store;

import java.io.IOException;
import java.util.List;

/**
 * Interface for data store functionality that can handle records
 * for different user ids.
 * @author ingo@wemove.com
 */
public interface UserStore {

	/**
	 * Get all record ids contained in this store
	 * @return List<String>
	 */
	public List<String> getRecordIds(String userId) throws IOException;

	/**
	 * Get the record with the given record id.
	 * @param recordId
	 * @return String
	 */
	public String getRecord(String userId, String recordId) throws IOException;

	/**
	 * Store/overwrite the given record with the given record id.
	 * @param recordId
	 * @param record
	 */
	public void putRecord(String userId, String recordId, String record) throws IOException;

	/**
	 * Remove the record with the given record id.
	 * @param recordId
	 */
	public void removeRecord(String userId, String recordId) throws IOException;
}
