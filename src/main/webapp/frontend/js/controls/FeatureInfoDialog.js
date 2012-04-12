/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class FeatureInfoDialog is the dialog used for displaying WMS feature infos.
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog = Ext.extend(Ext.Window, {
	title: "Feature Info",
	closable: true,
	draggable: true,
	resizable: true,
	width: 300,
	autoHeight: true,
	shadow: false,
	hidden: true,
	closeAction: 'hide',
    autoScroll: true,
    layout: 'fit',

	/**
	 * @cfg The OpenLayers.Map instance to query feature infos for
	 */
	map: null,

	/**
	 * Boolean indicating, if the control is activated or not
	 */
	activated: false
});

/**
 * Activate the control
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.activate = function() {
	this.activated = true;
};

/**
 * Deactivate the control
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.deactivate = function() {
	this.activated = false;
};

/**
 * Query the feature infos for the current map, if the control is activated
 * @param e OpenLayers.Event
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.query = function(e) {
	if (!this.activated) {
		return;
	}

	// remove all panels from preceeding calls
	this.removeAll();

	// use a FeatureInfoControl instance to create the GetFeatureInfo requests
	var self = this;
	var featureInfoControl = new de.ingrid.mapclient.frontend.controls.FeatureInfoControl({
		queryVisible: true,
		drillDown: true,
		eventListeners: {
			"getfeatureinfo": function(e) {
				// create a panel for each response
				var service = de.ingrid.mapclient.frontend.data.Service.findByUrl(e.url);
				if(service != null){
					var p = new Ext.Panel({
					title: service.getDefinition().title,
					collapsible: true,
					border: false,
					autoScroll: true,
					boxMaxHeight:500,
					bodyStyle: 'padding: 10px',
					defaults: {
						anchor: '100%'
					},
					html: e.text
				});
				self.add(p);
				self.doLayout();	
				}
				
			}
		}
	});
	featureInfoControl.setMap(this.map);
	featureInfoControl.getInfoForClick(e);
	this.show();
};

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.initComponent = function() {
	de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.superclass.initComponent.call(this);
};

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.prototype.onRender = function() {
	de.ingrid.mapclient.frontend.controls.FeatureInfoDialog.superclass.onRender.apply(this, arguments);
};
