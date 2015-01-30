/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
Ext.namespace("de.ingrid.mapclient.frontend.data");

/**
 * @class Service represents a mapclient session.
 */
de.ingrid.mapclient.frontend.data.Session = function(config) {
    /**
     * @cfg The user id, with which the current session should be associated
     */
	this.userId = null;

	// apply values from the provided config object
	Ext.apply(this, config);
};

/**
 * Check if the session has a user id
 * @return Boolean
 */
de.ingrid.mapclient.frontend.data.Session.prototype.hasUserId = function() {
	return this.userId != null;
} ;

/**
 * Get the user id
 * @return String
 */
de.ingrid.mapclient.frontend.data.Session.prototype.getUserId = function() {
	return this.userId;
} ;

/**
 * Save the given session state
 * @param state de.ingrid.mapclient.frontend.data.SessionState instance
 * @param isTemporary Boolean indicating, if the data should be saved in the current session
 * 		only or permanently for the current user
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.save = function(state, isTemporary, responseHandler) {
	var serializedState = state.serialize();

	// determine the request from the isTemporary flag, defaults to session url
	var url = de.ingrid.mapclient.SESSION_DATA_URL;
	if (!isTemporary) {
		if (!this.hasUserId()) {
			throw "Cannot save permanent data without userId";
		}
		url = de.ingrid.mapclient.USER_DATA_URL+"/"+this.getUserId();
	}
	Ext.Ajax.request({
		url: url,
		method: 'POST',
		headers: { 'Content-Type': 'text/plain' },
		success: function(response, request) {
			if (responseHandler && responseHandler.success instanceof Function) {
				responseHandler.success(response.responseText);
			}
		},
		failure: function(response, request) {
			if (responseHandler && responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		},
		xmlData: serializedState
	});
};

/**
 * Load the existing data and apply them to the given state instance
 * @param state de.ingrid.mapclient.frontend.data.SessionState instance to that the retrieved data will be applied,
 * 		if the state contains an id, the appropriate user data will be loaded, if not, only the current
 * 		session data will be loaded
 * @param shortUrl A short url that the server maps to a user data url (optional, if given, state id will be ignored)
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.load = function(state, shortUrl, responseHandler) {
	// determine the request from the state id, defaults to session url, if no id is given
	var url = de.ingrid.mapclient.SESSION_DATA_URL;
	if (shortUrl) {
		url = de.ingrid.mapclient.SHORTURL_DATA_URL+"/"+shortUrl;
	}
	else if (state.id) {
		if (!this.hasUserId()) {
			throw "Cannot load permanent data without userId";
		}
		url = de.ingrid.mapclient.USER_DATA_URL+"/"+this.getUserId()+"/"+state.id;
	}

	Ext.Ajax.request({
		url: url,
		method: 'GET',
		success: function(response, request) {
			if (response.responseText.length > 0) {
				state.unserialize(response.responseText, function() {
					if (responseHandler && responseHandler.success instanceof Function) {
						responseHandler.success(response.responseText);
					}
				});
			}
			else {
				if (responseHandler && responseHandler.failure instanceof Function) {
					responseHandler.failure(response.responseText);
				}
			}
		},
		failure: function(response, request) {
			if (responseHandler && responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		}
	});
};

/**
 * List stored data for the current user id.
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.list = function(responseHandler) {
	// determine the request from the userId
	if (!this.hasUserId()) {
		throw "Cannot list permanent data without userId";
	}
	var url = de.ingrid.mapclient.USER_DATA_URL+"/"+this.getUserId();

	Ext.Ajax.request({
		url: url,
		method: 'GET',
		headers: { 'Content-Type': 'text/plain' },
		success: function(response, request) {
			if (responseHandler && responseHandler.success instanceof Function) {
				responseHandler.success(response.responseText);
			}
		},
		failure: function(response, request) {
			if (responseHandler && responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		}
	});
};

/**
 * Delete the given session state determined by its id.
 * @param state de.ingrid.mapclient.frontend.data.SessionState instance
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.remove = function(state, responseHandler) {
	// determine the request from the userId and state id
	var url = de.ingrid.mapclient.USER_DATA_URL+"/"+this.getUserId()+"/"+state.id;

	Ext.Ajax.request({
		url: url,
		method: 'DELETE',
		headers: { 'Content-Type': 'text/plain' },
		success: function(response, request) {
			if (responseHandler && responseHandler.success instanceof Function) {
				responseHandler.success(response.responseText);
			}
		},
		failure: function(response, request) {
			if (responseHandler && responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		}
	});
};

/**
 * Save the given session state
 * @param state de.ingrid.mapclient.frontend.data.SessionState instance
 * @param isTemporary Boolean indicating, if the data should be saved in the current session
 * 		only or permanently for the current user
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.download = function(state, responseHandler) {
	var serializedState = state.serialize();

	// determine the request from the isTemporary flag, defaults to session url
	var url = de.ingrid.mapclient.DOWNLOAD_URL;
	var dlUrl = de.ingrid.mapclient.MAP_SITE;
	Ext.Ajax.request({
		url: url,
		method: 'POST',
		headers: { 'Content-Type': 'text/plain' },
		success: function(response, request) {
					window.open(dlUrl+"?title="+response.responseText);
					if (responseHandler && responseHandler.success instanceof Function) {
						responseHandler.success(response.responseText);
					}
		},
		failure: function(response, request) {
			if (responseHandler && responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		},
		xmlData: serializedState
	});
};
