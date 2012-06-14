/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class MetaDataDialog is the dialog for displaying meta data about a wms or wms layer.
 */
de.ingrid.mapclient.frontend.controls.MetaDataDialog = Ext.extend(Ext.Window, {
	title: "Metadaten",
	closable: true,
	draggable: true,
	resizable: false,
	width: 500,
	autoHeight: true,
	shadow: false,
	initHidden: false,

	windowContent: null,

    /**
     * @cfg capabilitiesUrl The url for the GetCapabilities request
     */
    capabilitiesUrl: null,

    /**
     * @cfg layer OpenLayers.Layer instance, if the meta data of a layer should be displayed (optional)
     */
    layer: null,

	/**
	 * Templates
	 */
	serviceInfoTpl: null,
	layerInfoTpl: null
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.MetaDataDialog.prototype.initComponent = function() {

	// create the template for service meta data
	this.serviceInfoTpl = new Ext.Template(this.getServiceInfoHtml());
	this.serviceInfoTpl.compile();

	// create the template for layer meta data
	this.layerInfoTpl = new Ext.Template(this.getLayerInfoHtml());
	this.layerInfoTpl.compile();

	// create the window layout
	this.windowContent = new Ext.FormPanel({
		border: false,
		bodyStyle: 'padding: 10px',
		labelAlign: 'top',
		defaults: {
			anchor:'100%'
		}
	});

	// load the capabilities
	var self = this;
	de.ingrid.mapclient.frontend.data.Service.load(this.capabilitiesUrl, this.applyData.createDelegate(self));

	Ext.apply(this, {
		items: this.windowContent
	});

	de.ingrid.mapclient.frontend.controls.MetaDataDialog.superclass.initComponent.call(this);
};

/**
 * Apply the loaded service data to the template
 * @param service de.ingrid.mapclient.frontend.data.Service instance
 */
de.ingrid.mapclient.frontend.controls.MetaDataDialog.prototype.applyData = function(service) {
	// determine the object for which metadata are requested
	var isServiceRequest = (this.layer == undefined) ? true : false;

	// select the template and map the data to the template variables
	var tpl = null;
	var data = {};
	if (isServiceRequest) {
		tpl = this.serviceInfoTpl;

		// collect the layer names
		var layerNames = [];
		var layers = service.getLayers();
		for (var i=0, count=layers.length; i<count; i++) {
			layerNames.push(layers[i].name);
		}

		// map the data
		var data = service.getDefinition();
		data.layers = layerNames.join(', ');
		data.wmsTitle = data.title;
		data.wmsAbstract = data['abstract'];
		// TODO do more mapping if required
	}
	else {
		tpl = this.layerInfoTpl;

		// default data from service
		var data = service.getDefinition();
		data.wmsTitle = data.title;
		data.wmsAbstract = data['abstract'];
		// overwrite by layer data
		Ext.apply(data, this.layer);
		// id is OpenLayers id per default (remove it)
		data.id = null;
		data.metadata = this.serializeObject(data.metadata);
		// TODO do more mapping if required
	}

	// render the content
	if (tpl != null) {
		var htmlData = new Object();
		// we do this by hand since the apply method doesnt apply our data very well
		htmlData.name = data.name;
		htmlData.abstract = data.abstract;
		htmlData.projections = data.projection.projCode; //TODO in case of more?
		htmlData.minScale = data.minScale;
		htmlData.maxScale = data.maxScale;
		htmlData.date = "";
		htmlData.issuer = data.contactInformation.personPrimary.organization;
		htmlData.wmsId = data.name;
		htmlData.wmsAbstract = data.wmsAbstract;
		htmlData.wmsTitle = data.wmsTitle;
		htmlData.fees = "";
		htmlData.restrictions = "";
		htmlData.contactPerson = data.contactInformation.personPrimary.person;
		htmlData.contactOrganization = data.contactInformation.personPrimary.organization;
		htmlData.contactAddress = data.contactInformation.contactAddress.address;
		htmlData.contactCity = data.contactInformation.contactAddress.city;
		htmlData.contactState = data.contactInformation.contactAddress.stateOrProvince;
		htmlData.contactCountry = data.contactInformation.contactAddress.country;
		htmlData.contactPostalcode = data.contactInformation.contactAddress.postcode;
		htmlData.contactPhone = data.contactInformation.phone;
		htmlData.contactFax = data.contactInformation.fax;
		htmlData.contactEmail = data.contactInformation.email;
		htmlData.metadata = data.metadata;
		
		
		var html = tpl.apply(htmlData);
		this.windowContent.add(new Ext.Panel({
			html: html,
			border: false
		}));
		this.windowContent.doLayout();
	}
};

/**
 * Get the html template string for the service meta data table
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.MetaDataDialog.prototype.getServiceInfoHtml = function() {

	var tplStr = '<table class="metaDataTable">'+

		'<tr><td>ID</td><td>{id}</td></tr>'+
		'<tr><td>Titel</td><td>{title}</td></tr>'+
		'<tr><td>Zusammenfassung</td><td>{abstract}</td></tr>'+
		'<tr><td>Koordinatensysteme</td><td>{projections}</td></tr>'+
		'<tr><td>Datum der Registrierung</td><td>{date}</td></tr>'+
		'<tr><td>Registrierende Stelle</td><td>{issuer}</td></tr>'+
		'<tr><td>WMS ID</td><td>{wmsId}</td></tr>'+
		'<tr><td>WMS Titel</td><td>{wmsTitle}</td></tr>'+
		'<tr><td>WMS Abstract</td><td>{wmsAbstract}</td></tr>'+
		'<tr><td>Geb&uuml;hren</td><td>{fees}</td></tr>'+
		'<tr><td>Zugriffsbeschr&auml;nkung</td><td>{restrictions}</td></tr>'+

		'<tr><td>Ansprechpartner</td><td>{contactPerson}</td></tr>'+
		'<tr><td>Organisation</td><td>{contactOrganization}</td></tr>'+
		'<tr><td>Adresse</td><td>{contactAddress}</td></tr>'+
		'<tr><td>Stadt</td><td>{contactCity}</td></tr>'+
		'<tr><td>Bundesland</td><td>{contactState}</td></tr>'+
		'<tr><td>PLZ</td><td>{contactPostalcode}</td></tr>'+
		'<tr><td>Telefon</td><td>{contactPhone}</td></tr>'+
		'<tr><td>Fax</td><td>{contactFax}</td></tr>'+
		'<tr><td>E-Mail</td><td>{contactEmail}</td></tr>'+
		'<tr><td>Land</td><td>{contactCountry}</td></tr>'+

		'<tr><td>Metadaten</td><td>{metadata}</td></tr>'+
		'<tr><td>Ebenen</td><td>{layers}</td></tr>'+

	'</table>';

	return tplStr;
};

/**
 * Get the html template string for the layer meta data table
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.MetaDataDialog.prototype.getLayerInfoHtml = function() {

	var tplStr = '<table class="metaDataTable">'+

		'<tr><td>ID</td><td>{id}</td></tr>'+
		'<tr><td>Titel</td><td>{name}</td></tr>'+
		'<tr><td>Zusammenfassung</td><td>{abstract}</td></tr>'+
		'<tr><td>Minscale</td><td>{minScale}</td></tr>'+
		'<tr><td>Maxscale</td><td>{maxScale}</td></tr>'+
		'<tr><td>Koordinatensysteme</td><td>{projections}</td></tr>'+
		'<tr><td>Datum der Registrierung</td><td>{date}</td></tr>'+
		'<tr><td>Registrierende Stelle</td><td>{issuer}</td></tr>'+
		'<tr><td>WMS ID</td><td>{wmsId}</td></tr>'+
		'<tr><td>WMS Titel</td><td>{wmsTitle}</td></tr>'+
		'<tr><td>WMS Abstract</td><td>{wmsAbstract}</td></tr>'+
		'<tr><td>Geb&uuml;hren</td><td>{fees}</td></tr>'+
		'<tr><td>Zugriffsbeschr&auml;nkung</td><td>{restrictions}</td></tr>'+

		'<tr><td>Ansprechpartner</td><td>{contactPerson}</td></tr>'+
		'<tr><td>Organisation</td><td>{contactOrganization}</td></tr>'+
		'<tr><td>Adresse</td><td>{contactAddress}</td></tr>'+
		'<tr><td>Stadt</td><td>{contactCity}</td></tr>'+
		'<tr><td>Bundesland</td><td>{contactState}</td></tr>'+
		'<tr><td>PLZ</td><td>{contactPostalcode}</td></tr>'+
		'<tr><td>Telefon</td><td>{contactPhone}</td></tr>'+
		'<tr><td>Fax</td><td>{contactFax}</td></tr>'+
		'<tr><td>E-Mail</td><td>{contactEmail}</td></tr>'+
		'<tr><td>Land</td><td>{contactCountry}</td></tr>'+

		'<tr><td>Metadaten</td><td>{metadata}</td></tr>'+

	'</table>';

	return tplStr;
};

/**
 * Serialize an object into key value string
 * @param obj The object
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.MetaDataDialog.prototype.serializeObject = function(obj) {
	var result = '';
	for (key in obj) {
		result += key+": "+obj[key]+"<br />";
	}
	return result;
};
