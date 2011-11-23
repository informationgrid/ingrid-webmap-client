/**
 * Application startup script
 */
Ext.QuickTips.init();
Ext.onReady(function() {
	// load the configuration
	de.ingrid.mapclient.Configuration.load({
		success: function() {

			// determine the view configuration from the viewConfig GET parameter
			var viewConfig = de.ingrid.mapclient.Configuration.getUrlParameter('viewConfig') || 'default';

			var configPrams = de.ingrid.mapclient.VIEW_CONFIG[viewConfig];
			if (configPrams != undefined) {
				// build the gui with the given configuration
				new de.ingrid.mapclient.frontend.Workspace({
					viewConfig: configPrams
				});
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
