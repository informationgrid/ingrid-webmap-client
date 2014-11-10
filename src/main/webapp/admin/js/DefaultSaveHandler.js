/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
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
