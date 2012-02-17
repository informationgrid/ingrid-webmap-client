
/**
 * Application startup script
 */
Ext.QuickTips.init();
Ext.onReady(function() {
	// load the configuration
	de.ingrid.mapclient.Configuration.load({
		success: function() {
 
	
			// inject call back hooks from outer application
			var callbackHooks = {};
			if (!(typeof mapClientCallbackHooks === "undefined")) {
				callbackHooks = mapClientCallbackHooks;
//				console.debug("mapClientCallbackHooks defined: "+callbackHooks);
   			} else if ( window.parent != window && !(typeof window.parent.mapClientCallbackHooks === "undefined")) {
   			 // check if map is IFRAME embedded and callback was defined outside
    			var callbackHooks = window.parent.mapClientCallbackHooks;
//    			console.debug("parent != window, callbackHooks: "+callbackHooks);
			}

			var mapUrl = de.ingrid.mapclient.Configuration.getUrlParameter('mapUrl') || null;

			// create the session and personalize it, if an user id is given in the userId GET parameter
			var userId = de.ingrid.mapclient.Configuration.getUrlParameter('userId') || null;
			var session = new de.ingrid.mapclient.frontend.data.Session({
				userId: userId
			});

			// determine the view configuration from the viewConfig GET parameter
			var viewConfig = de.ingrid.mapclient.Configuration.getUrlParameter('viewConfig') || 'default';
			console.log("Use viewConfig: " + viewConfig);

			// build the gui with the given configuration
			var configPrams = de.ingrid.mapclient.VIEW_CONFIG[viewConfig];
			if (configPrams != undefined) {
				
				if(configPrams.isFullScreen){
					console.log("Use full screen workspace.");
				new de.ingrid.mapclient.frontend.Workspace({
					mapUrl: mapUrl,
					session: session,
					viewConfig: configPrams,
					callbackHooks: callbackHooks
				});			
				}else {
					console.log("Use panel based workspace.");
				new de.ingrid.mapclient.frontend.PanelWorkspace({
					height: configPrams.panelHeight,
					mapUrl: mapUrl,
					session: session,
					viewConfig: configPrams,
					callbackHooks: callbackHooks
				});						
				}
			}
			else {
				de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.VIEW_CONFIGURATION_FAILURE);
			}
		},
		failure: function() {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
		}
	});
});
