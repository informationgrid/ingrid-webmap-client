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
 * @param userId Id of the user to save the data for. If null, the data will be saved
 * 		temporarily for the current session (optional)
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.save = function(state, userId, responseHandler) {
	var serializedState = state.serialize();

	// determine the request from the userId parameter,
	// defaults to session url
	var url = de.ingrid.mapclient.SESSION_DATA_URL;
	if (userId) {
		url = de.ingrid.mapclient.USER_DATA_URL+"/"+userId;
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
 * Load the existing session data and apply them to the given state instance
 * @param state de.ingrid.mapclient.frontend.data.SessionState instance to that the retrieved data will be applied
 * @param userId Id of the user to load the data for. If null, the temporary data for the
 * 		current session are loaded(optional)
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.load = function(state, userId, responseHandler) {
	// determine the request from the userId parameter,
	// defaults to session url
	var url = de.ingrid.mapclient.SESSION_DATA_URL;
	if (userId) {
		url = de.ingrid.mapclient.USER_DATA_URL+"/"+userId+"/"+state.id;
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