
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

			// build the gui with the given configuration
			var configPrams = de.ingrid.mapclient.VIEW_CONFIG[viewConfig];
//			console.debug("window.location: "+window.location.toString());
			if (configPrams != undefined) {
				var loc = window.location.toString();
				var pos = loc.indexOf("main-maps");
				var pos2 = loc.indexOf("kartendienste");
				if(pos > -1 || pos2 > -1){
				new de.ingrid.mapclient.frontend.Workspace({
					mapUrl: mapUrl,
					session: session,
					viewConfig: configPrams
					//callbackHooks: callbackHooks
				});			
				}else if(loc.indexOf("webmap-client") > -1 ){
				new de.ingrid.mapclient.frontend.PanelWorkspace({
					height:500,	
					mapUrl: mapUrl,
					session: session,
					viewConfig: configPrams,
					callbackHooks: callbackHooks
				});						
				}
				else{
				new de.ingrid.mapclient.frontend.PanelWorkspace({
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
