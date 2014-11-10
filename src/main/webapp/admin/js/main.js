/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
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
/**
 * Application startup script
 */
Ext.QuickTips.init();
Ext.onReady(function() {
	// load the configuration
	de.ingrid.mapclient.Configuration.load({
		success: function() {
			// Theme selection
			if(document.getElementById("theme-all")){
				document.getElementById("theme-all").disabled  = true;
			}
			if(document.getElementById("theme-gray")){
				document.getElementById("theme-gray").disabled  = true;
			}
			if(document.getElementById("theme-neptune")){
				document.getElementById("theme-neptune").disabled  = true;
			}
			if(document.getElementById("theme-access")){
				document.getElementById("theme-access").disabled  = true;
			}
			
			var defaultTheme = de.ingrid.mapclient.Configuration.getSettings("defaultTheme");
			if(defaultTheme == undefined){
				defaultTheme = "all";
			}else if(defaultTheme.trim() != "all" 
				&&  defaultTheme.trim() != "gray" 
				&&  defaultTheme.trim() != "neptune" 
				&&  defaultTheme.trim() != "access"){
				defaultTheme = "all";
			}
			
			Ext.themeName = defaultTheme.trim() == "" ? "all" : defaultTheme.trim();
			Ext.getBody().addCls(Ext.baseCSSPrefix + 'theme-' + Ext.themeName);
			
			if(document.getElementById("theme-" + Ext.themeName)){
				document.getElementById("theme-" + Ext.themeName).disabled  = false;
			}
			
			// build the gui after the configuration is loaded
			new de.ingrid.mapclient.admin.AdminWorkspace();
		},
		failure: function() {
			de.ingrid.mapclient.Message.showError('Das Laden der Konfiguration ist fehlgeschlagen.');
		}
	});
});
