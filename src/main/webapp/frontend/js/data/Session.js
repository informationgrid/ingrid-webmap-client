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
 * 		only or permanently
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.save = function(state, isTemporary, responseHandler) {
	var serializedState = state.serialize();

	// determine the request from the isTemporary flag, defaults to session url
	var url = de.ingrid.mapclient.SESSION_DATA_URL;
	if (!isTemporary) {
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
 * @param responseHandler Object with properties success and failure, which are both functions
 * 		to be called with the response text as parameter in the appropriate case (optional)
 */
de.ingrid.mapclient.frontend.data.Session.prototype.load = function(state, responseHandler) {
	// determine the request from the state id, defaults to session url, if no id is given
	var url = de.ingrid.mapclient.SESSION_DATA_URL;
	if (state.id) {
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
