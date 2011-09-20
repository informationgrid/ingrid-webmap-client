/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.data");

/**
 * @class Service represents a mapclient session.
 */
de.ingrid.mapclient.frontend.data.Session = function() {
};

/**
 * Static function to save the current session state
 * @param state de.ingrid.mapclient.frontend.data.SessionState instance
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.save = function(state, responseHandler) {
	var serializedState = state.serialize();
	Ext.Ajax.request({
		url: de.ingrid.mapclient.SESSION_DATA_URL,
		method: 'POST',
		headers: { 'Content-Type': 'text/plain' },
		success: function(response, request) {
			if (responseHandler.success instanceof Function) {
				responseHandler.success(response.responseText);
			}
		},
		failure: function(response, request) {
			if (responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		},
		xmlData: serializedState
	});
};

/**
 * Static function to load the existing session data and apply them to the given state instance
 * @param state de.ingrid.mapclient.frontend.data.SessionState instance to that the retrieved data will be applied
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.load = function(state, responseHandler) {
	Ext.Ajax.request({
		url: de.ingrid.mapclient.SESSION_DATA_URL,
		method: 'GET',
		success: function(response, request) {
			if (response.responseText.length > 0) {
				state.unserialize(response.responseText, function() {
					if (responseHandler.success instanceof Function) {
						responseHandler.success(response.responseText);
					}
				});
			}
			else {
				if (responseHandler.failure instanceof Function) {
					responseHandler.failure(response.responseText);
				}
			}
		},
		failure: function(response, request) {
			if (responseHandler.failure instanceof Function) {
				responseHandler.failure(response.responseText);
			}
		}
	});
};