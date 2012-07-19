/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient");

/**
 * @class Message is used to display messages to the user.
 */
de.ingrid.mapclient.Message = function() {
};

/**
 * Show the given message in an overlay that fades out automatically
 * @param msg The message
 */
de.ingrid.mapclient.Message.showInfo = function(msg, params) {
	if (!params) params={};
	new Ext.ux.Notification({
		iconCls:	params.iconCls || 'x-icon-information',
		title:	  params.title || 'Info',
		html:	   msg,
		width: params.width || 300,
		autoDestroy: true,
		hideDelay:  params.delay || 5000,
		displayTarget: Ext.select('div.x-panel-tbar')
	}).show(Ext.select('div.x-panel-tbar'));

};

/**
 * Show the given error message in a popup window that needs to be closed by the user
 * @param msg The error message
 */
de.ingrid.mapclient.Message.showError = function(msg) {
	Ext.Msg.show({
		title: i18n('tError'),
		msg: msg,
		width: 500,
		height: 400,
		buttons: Ext.MessageBox.OK,
		icon: Ext.MessageBox.ERROR
	});
};

/**
 * Show the given warning message in a popup window that needs to be closed by the user
 * @param msg The warning message
 */
de.ingrid.mapclient.Message.showEPSGWarning = function(epsg, service) {
	var msg = i18n('tUnsupportedSpatialReferenceSystem', [epsg, service]);
	Ext.Msg.show({
		title: i18n('tWarning'),
		msg: msg,
		width: 500,
		height: 400,
		buttons: Ext.MessageBox.OK,
		icon: Ext.MessageBox.ERROR
	});
};

/**
 * Predefined messages
 */
de.ingrid.mapclient.Message.SAVE_SUCCESS = i18n('tDieAenderungenWurdenGespeichert');
de.ingrid.mapclient.Message.SAVE_FAILURE = i18n('tBeimSpeichernDerDatenIstEinFehlerAufgetreten');

de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE = i18n('tDasLaderDerKonfigurationIstFehlgeschlagen');
de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE = i18n('tErrorLoadingCapability');
de.ingrid.mapclient.Message.LOAD_PROJECTION_FAILURE = i18n('tErrorLoadingProjectionDef');

de.ingrid.mapclient.Message.VIEW_CONFIGURATION_FAILURE = i18n('tUnknownViewConfiguration');
de.ingrid.mapclient.Message.VIEW_ALREADY_LOADED_FAILURE = i18n('tServiceAlreadyAdded');

de.ingrid.mapclient.Message.NOT_SUPPORTED_EPSG = i18n('tProjectionNotSupported');

de.ingrid.mapclient.Message.MAP_LIST_FAILURE = i18n('tErrorListingMap');
de.ingrid.mapclient.Message.MAP_SAVE_SUCCESS = i18n('tSuccessMapSaved');
de.ingrid.mapclient.Message.MAP_SAVE_FAILURE = i18n('tErrorSavingMap');
de.ingrid.mapclient.Message.MAP_DELETE_SUCCESS = i18n('tErrorRemovingMap');

de.ingrid.mapclient.Message.MAP_PRINT_FAILURE = i18n('tErrorPrintingMap');
de.ingrid.mapclient.Message.SEARCH_FAILURE = i18n('tErrorSearching');
de.ingrid.mapclient.Message.SEARCH_SUCCESS = i18n('tSuccessSearching');

de.ingrid.mapclient.Message.FEATURE_FAILURE = i18n('tCouldNotObtainAdminInfo');
