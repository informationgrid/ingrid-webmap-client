/**
 * Application startup script
 */
Ext.QuickTips.init();
Ext.onReady(function() {
	// load the configuration
	de.ingrid.mapclient.Configuration.load({
		success: function() {
			// Theme selection
			document.getElementById("theme-all").disabled  = true;
			document.getElementById("theme-gray").disabled  = true;
			document.getElementById("theme-neptune").disabled  = true;
			document.getElementById("theme-access").disabled  = true;
			
			var defaultTheme = de.ingrid.mapclient.Configuration.getSettings("defaultTheme");
			if(defaultTheme == undefined){
				defaultTheme = "all";
			}
			
			Ext.themeName = defaultTheme.trim() == "" ? "all" : defaultTheme.trim();
			Ext.getBody().addCls(Ext.baseCSSPrefix + 'theme-' + Ext.themeName);
			
			document.getElementById("theme-" + Ext.themeName).disabled  = false;
			
			// build the gui after the configuration is loaded
			new de.ingrid.mapclient.admin.AdminWorkspace();
		},
		failure: function() {
			de.ingrid.mapclient.Message.showError('Das Laden der Konfiguration ist fehlgeschlagen.');
		}
	});
});
