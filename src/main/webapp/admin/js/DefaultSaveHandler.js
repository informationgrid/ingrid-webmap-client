/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin");

/**
 * @class DefaultSaveHandler provides default success and error callbacks
 * to be used when calling de.ingrid.mapclient.Configuration methods.
 *
 * @constructor
 */
de.ingrid.mapclient.admin.DefaultSaveHandler = function() {
};

/**
 * Handle success
 * @param responseText The response text returned from the server
 */
de.ingrid.mapclient.admin.DefaultSaveHandler.success = function(responseText) {
	de.ingrid.mapclient.Message.showInfo('Die &Auml;nderungen wurden gespeichert.');
};

/**
 * Handle failure
 * @param responseText The response text returned from the server
 */
de.ingrid.mapclient.admin.DefaultSaveHandler.failure = function(responseText) {
	de.ingrid.mapclient.Message.showError('Beim Speichern der Daten ist ein Fehler aufgetreten.');
};
