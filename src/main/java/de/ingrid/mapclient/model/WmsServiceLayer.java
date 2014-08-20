/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
package de.ingrid.mapclient.model;

/**
 * MapExtend represents a map extend
 * 
 * @author ingo@wemove.com
 */
public class WmsServiceLayer {

	private String layer = "";
	private String opacity = "";
	private boolean checked = false;
	
	public WmsServiceLayer() {
	}

	public WmsServiceLayer(String layer, String opacity, boolean checked) {
		this.setLayer(layer);
		this.setOpacity(opacity);
		this.setChecked(checked);
	}

	public String getOpacity() {
		return opacity;
	}

	public void setOpacity(String opacity) {
		this.opacity = opacity;
	}

	public String getLayer() {
		return layer;
	}

	public void setLayer(String layer) {
		this.layer = layer;
	}

	public boolean isChecked() {
		return checked;
	}

	public void setChecked(boolean checked) {
		this.checked = checked;
	}

}
