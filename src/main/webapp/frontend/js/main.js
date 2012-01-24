/**
 * Application startup script
 */
Ext.QuickTips.init();
Ext.onReady(function() {
	// load the configuration
	de.ingrid.mapclient.Configuration.load({
		success: function() {

			// check if there is an mapUrl GET parameter
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
			if (configPrams != undefined) {
				var loc = window.location.toString();
				var pos = loc.indexOf("env-place-map");
				if(pos > -1){
				new de.ingrid.mapclient.frontend.PanelWorkspace({
					mapUrl: mapUrl,
					session: session,
					viewConfig: configPrams
				});				
				}else{
				new de.ingrid.mapclient.frontend.Workspace({
					mapUrl: mapUrl,
					session: session,
					viewConfig: configPrams
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
