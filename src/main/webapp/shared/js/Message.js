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
de.ingrid.mapclient.Message.showInfo = function(msg) {
    if (!de.ingrid.mapclient.msgCt) {
    	// initialize on first call

    	// create the container for the message
    	de.ingrid.mapclient.msgCt = Ext.DomHelper.insertFirst(document.body, {
    		id: 'msg-div',
    		style: 'position:absolute; z-index:10000;'
    	}, true);
    	// create the message
    	de.ingrid.mapclient.Message.msg = Ext.DomHelper.append(de.ingrid.mapclient.msgCt, {
        	html: msg
        }, true);
    }
    else {
    	// update on succeeding calls

    	// set the message
    	de.ingrid.mapclient.Message.msg.dom.innerHTML = msg;
    }

    de.ingrid.mapclient.msgCt.alignTo(document, 't-t', [0, 10]);
    /*de.ingrid.mapclient.Message.msg.slideIn('t').pause(1.5).ghost("t", {
    	remove:true
    });*/
    de.ingrid.mapclient.Message.msg.fadeIn('t').pause(1.5).fadeOut("t", {
    	remove: false
    });
};

/**
 * Show the given error message in a popup window that needs to be closed by the user
 * @param msg The error message
 */
de.ingrid.mapclient.Message.showError = function(msg) {
	Ext.Msg.show({
		title: 'Fehler',
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
	var msg = 'Das Raumbezugssystem ('+epsg+') wird von den geladenen Diensten ('+service+') nicht unterst&uuml;tzt.';
	Ext.Msg.show({
		title: 'Warnung',
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
de.ingrid.mapclient.Message.SAVE_SUCCESS = "Die &Auml;nderungen wurden gespeichert.";
de.ingrid.mapclient.Message.SAVE_FAILURE = "Beim Speichern der Daten ist ein Fehler aufgetreten.";

de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE = "Das Laden der Konfiguration ist fehlgeschlagen.";
de.ingrid.mapclient.Message.LOAD_CAPABILITIES_FAILURE = "Das Laden des Capabilities Dokuments ist fehlgeschlagen.";
de.ingrid.mapclient.Message.LOAD_PROJECTION_FAILURE = "Das Laden der Projektionsdefinition ist fehlgeschlagen.";

de.ingrid.mapclient.Message.VIEW_CONFIGURATION_FAILURE = "Die View-Konfiguration ist unbekannt.";
de.ingrid.mapclient.Message.VIEW_ALREADY_LOADED_FAILURE = "Der Dienst wurde bereits hinzugef&uuml;gt.";

de.ingrid.mapclient.Message.NOT_SUPPORTED_EPSG = "Das geladene Raumbezugssystem (EPSG) wird von der Basiskarte nicht unterstützt.";

de.ingrid.mapclient.Message.MAP_LIST_FAILURE = "Die Karten konnten nicht gelistet werden.";
de.ingrid.mapclient.Message.MAP_SAVE_SUCCESS = "Die Karte wurde gespeichert.";
de.ingrid.mapclient.Message.MAP_SAVE_FAILURE = "Beim Speichern der Karte ist ein Fehler aufgetreten.";
de.ingrid.mapclient.Message.MAP_DELETE_SUCCESS = "Beim L&ouml;schen der Karte ist ein Fehler aufgetreten.";

de.ingrid.mapclient.Message.MAP_PRINT_FAILURE = "Beim Drucken der Karte ist ein Fehler aufgetreten.";
de.ingrid.mapclient.Message.SEARCH_FAILURE = "Beim Suchen ist ein Fehler aufgetreten.";
de.ingrid.mapclient.Message.SEARCH_SUCCESS = "Suche erfolgreich.";

de.ingrid.mapclient.Message.FEATURE_FAILURE = "Konnte keine administrativen Informationen abrufen.";
