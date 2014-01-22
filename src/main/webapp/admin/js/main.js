/**
 * Application startup script
 */
Ext.QuickTips.init();
Ext.onReady(function() {
	// load the configuration
	de.ingrid.mapclient.Configuration.load({
		success: function() {
			// build the gui after the configuration is loaded
			new de.ingrid.mapclient.admin.AdminWorkspace();
		},
		failure: function() {
			de.ingrid.mapclient.Message.showError('Das Laden der Konfiguration ist fehlgeschlagen.');
		}
	});
});
