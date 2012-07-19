/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;
import java.util.Comparator;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

public class CustomComparator implements Comparator<JSONObject> {
    @Override
    public int compare(JSONObject o1, JSONObject o2) {
    	Integer i1;
		try {
			i1 = (Integer)o1.getInt("index");
			return i1.compareTo(o2.getInt("index"));
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return -1;
    }
}