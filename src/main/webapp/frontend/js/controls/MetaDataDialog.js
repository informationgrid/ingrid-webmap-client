/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class MetaDataDialog is the dialog for displaying meta data about a wms or wms layer.
 */
de.ingrid.mapclient.frontend.controls.MetaDataDialog = Ext.extend(Ext.Window, {
	title: i18n('tMetadaten'),
	closable: true,
	draggable: true,
	resizable: true,
	width: 590,
	height:400,
	shadow: false,
	initHidden: false,
	autoScroll:true,

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
	var html = null;
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
		
		data.wmsTitle = data.title;
		data.wmsAbstract = data['abstract'];
		
		var htmlData = new Object();
		// we do this by hand since the apply method doesnt apply our data very well
		var contactInformation = data.contactInformation;
		htmlData.layers = layerNames.join('<br/> ');
		htmlData.name = data.name;
		htmlData.date = "";
		htmlData.issuer = contactInformation.personPrimary ? contactInformation.personPrimary.organization : "";
		htmlData.wmsId = data.name;
		htmlData.wmsAbstract = data.wmsAbstract;
		htmlData.wmsTitle = data.wmsTitle;
		htmlData.fees = data.fees ? data.fees : "";
		htmlData.restrictions = data.accessConstraints ? data.accessConstraints : "";
		htmlData.contactPerson = contactInformation.personPrimary ? contactInformation.personPrimary.person: "";
		htmlData.contactOrganization = contactInformation.personPrimary ? contactInformation.personPrimary.organization : "";
		htmlData.contactAddress = contactInformation.contactAddress ? data.contactInformation.contactAddress.address:"";
		htmlData.contactCity = contactInformation.contactAddress ? data.contactInformation.contactAddress.city:"";
		htmlData.contactState = contactInformation.contactAddress ? data.contactInformation.contactAddress.stateOrProvince:"";
		htmlData.contactCountry = contactInformation.contactAddress ? data.contactInformation.contactAddress.country:"";
		htmlData.contactPostalcode = contactInformation.contactAddress ? data.contactInformation.contactAddress.postcode:"";
		htmlData.contactPhone = contactInformation ? data.contactInformation.phone:"";
		htmlData.contactFax = contactInformation.fax ? data.contactInformation.fax:"";
		htmlData.contactEmail = contactInformation.email ? data.contactInformation.email:"";
		htmlData.metadata = data.metadata;		
		
		html = tpl.apply(htmlData);
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
		
		// get the layer abstract, which we put into the layer object by hand
		for( var i = 0; i < service.layers.items.length; i++){
			var layerItem = service.layers.items[i];
			if(layerItem.name == data.name){
				var layerAbstractInfo = layerItem.layerAbstract;
				break;
			}	
		}
		
		var htmlData = new Object();
		// we do this by hand since the apply method doesnt apply our data very well
		var contactInformation = data.contactInformation;
		htmlData.name = data.name;
		htmlData.layerAbstract = layerAbstractInfo;
		htmlData.projections = data.projection.projCode; //TODO in case of more?
		htmlData.minScale = data.minScale;
		htmlData.maxScale = data.maxScale;
		htmlData.date = "";
		htmlData.issuer = contactInformation.personPrimary ? contactInformation.personPrimary.organization : "";
		htmlData.wmsId = data.name;
		htmlData.wmsAbstract = data.wmsAbstract;
		htmlData.wmsTitle = data.wmsTitle;
		htmlData.fees = data.fees ? data.fees : "";
		htmlData.restrictions = data.accessConstraints ? data.accessConstraints : "";
		htmlData.contactPerson = contactInformation.personPrimary ? contactInformation.personPrimary.person: "";
		htmlData.contactOrganization = contactInformation.personPrimary ? contactInformation.personPrimary.organization : "";
		htmlData.contactAddress = contactInformation.contactAddress ? data.contactInformation.contactAddress.address:"";
		htmlData.contactCity = contactInformation.contactAddress ? data.contactInformation.contactAddress.city:"";
		htmlData.contactState = contactInformation.contactAddress ? data.contactInformation.contactAddress.stateOrProvince:"";
		htmlData.contactCountry = contactInformation.contactAddress ? data.contactInformation.contactAddress.country:"";
		htmlData.contactPostalcode = contactInformation.contactAddress ? data.contactInformation.contactAddress.postcode:"";
		htmlData.contactPhone = contactInformation ? data.contactInformation.phone:"";
		htmlData.contactFax = contactInformation.fax ? data.contactInformation.fax:"";
		htmlData.contactEmail = contactInformation.email ? data.contactInformation.email:"";
		htmlData.metadata = data.metadata;
		// TODO do more mapping if required
		
		
		html = tpl.apply(htmlData);
	}

	// render the content
	if (tpl != null) {

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

		//'<tr><td>' + i18n('tTitle') + '</td><td>{title}</td></tr>'+
		//'<tr><td>' + i18n('tZusammenfassung') + '</td><td>{layerAbstract}</td></tr>'+
		'<tr><td>' + i18n('tWmsId') + '</td><td>{wmsId}</td></tr>'+
		'<tr><td>' + i18n('tWmsTitle') + '</td><td>{wmsTitle}</td></tr>'+
		'<tr><td>' + i18n('tWmsAbstract') + '</td><td>{wmsAbstract}</td></tr>'+
		'<tr><td>' + i18n('tKoordinatensysteme') + '</td><td>{projections}</td></tr>'+
		//'<tr><td>' + i18n('tDatumDerRegistrierung') + '</td><td>{date}</td></tr>'+
		'<tr><td>' + i18n('tRegistrierendeStelle') + '</td><td>{issuer}</td></tr>'+
		'<tr><td>' + i18n('tGebuehren') + '</td><td>{fees}</td></tr>'+
		'<tr><td>' + i18n('tZugriffsbeschraenkung') + '</td><td>{restrictions}</td></tr>'+

		'<tr><td>' + i18n('tAnsprechpartner') + '</td><td>{contactPerson}</td></tr>'+
		'<tr><td>' + i18n('tOrganisation') + '</td><td>{contactOrganization}</td></tr>'+
		'<tr><td>' + i18n('tAdresse') + '</td><td>{contactAddress}</td></tr>'+
		'<tr><td>' + i18n('tStadt') + '</td><td>{contactCity}</td></tr>'+
		'<tr><td>' + i18n('tBundesland') + '</td><td>{contactState}</td></tr>'+
		'<tr><td>' + i18n('tPLZ') + '</td><td>{contactPostalcode}</td></tr>'+
		'<tr><td>' + i18n('tTelefon') + '</td><td>{contactPhone}</td></tr>'+
		'<tr><td>' + i18n('tFax') + '</td><td>{contactFax}</td></tr>'+
		'<tr><td>' + i18n('tEmail') + '</td><td>{contactEmail}</td></tr>'+
		'<tr><td>' + i18n('tLand') + '</td><td>{contactCountry}</td></tr>'+

		'<tr><td>' + i18n('tMetadaten') + '</td><td>{metadata}</td></tr>'+
		'<tr><td>' + i18n('tEbenen') + '</td><td>{layers}</td></tr>'+

	'</table>';

	return tplStr;
};

/**
 * Get the html template string for the layer meta data table
 * @returns String
 */
de.ingrid.mapclient.frontend.controls.MetaDataDialog.prototype.getLayerInfoHtml = function() {

	var tplStr = '<table class="metaDataTable">'+

		'<tr><td>' + i18n('tTitle') + '</td><td>{name}</td></tr>'+
		'<tr><td>' + i18n('tZusammenfassung') + '</td><td>{layerAbstract}</td></tr>'+
		'<tr><td>' + i18n('tKoordinatensysteme') + '</td><td>{projections}</td></tr>'+
		//'<tr><td>' + i18n('tDatumDerRegistrierung') + '</td><td>{date}</td></tr>'+
		'<tr><td>' + i18n('tRegistrierendeStelle') + '</td><td>{issuer}</td></tr>'+
		'<tr><td>' + i18n('tWmsId') + '</td><td>{wmsId}</td></tr>'+
		'<tr><td>' + i18n('tWmsTitle') + '</td><td>{wmsTitle}</td></tr>'+
		'<tr><td>' + i18n('tWmsAbstract') + '</td><td>{wmsAbstract}</td></tr>'+
		'<tr><td>' + i18n('tGebuehren') + '</td><td>{fees}</td></tr>'+
		'<tr><td>' + i18n('tZugriffsbeschraenkung') + '</td><td>{restrictions}</td></tr>'+

		'<tr><td>' + i18n('tAnsprechpartner') + '</td><td>{contactPerson}</td></tr>'+
		'<tr><td>' + i18n('tOrganisation') + '</td><td>{contactOrganization}</td></tr>'+
		'<tr><td>' + i18n('tAdresse') + '</td><td>{contactAddress}</td></tr>'+
		'<tr><td>' + i18n('tStadt') + '</td><td>{contactCity}</td></tr>'+
		'<tr><td>' + i18n('tBundesland') + '</td><td>{contactState}</td></tr>'+
		'<tr><td>' + i18n('tPLZ') + '</td><td>{contactPostalcode}</td></tr>'+
		'<tr><td>' + i18n('tTelefon') + '</td><td>{contactPhone}</td></tr>'+
		'<tr><td>' + i18n('tFax') + '</td><td>{contactFax}</td></tr>'+
		'<tr><td>' + i18n('tEmail') + '</td><td>{contactEmail}</td></tr>'+
		'<tr><td>' + i18n('tLand') + '</td><td>{contactCountry}</td></tr>'+

		'<tr><td>' + i18n('tMetadaten') + '</td><td>{metadata}</td></tr>'+

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
