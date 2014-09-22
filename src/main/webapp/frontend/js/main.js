
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
				||  defaultTheme.trim() != "gray" 
				||  defaultTheme.trim() != "neptune" 
				||  defaultTheme.trim() != "access"){
				defaultTheme = "all";
			}
			
			Ext.themeName = defaultTheme.trim() == "" ? "all" : defaultTheme.trim();
			Ext.getBody().addCls(Ext.baseCSSPrefix + 'theme-' + Ext.themeName);
			
			if(document.getElementById("theme-" + Ext.themeName)){
				document.getElementById("theme-" + Ext.themeName).disabled  = false;
			}
			
			// inject call back hooks from outer application
			var callbackHooks = {};
			if (!(typeof mapClientCallbackHooks === "undefined")) {
				callbackHooks = mapClientCallbackHooks;
   			} else if ( window.parent != window && !(typeof window.parent.mapClientCallbackHooks === "undefined")) {
   				// check if map is IFRAME embedded and callback was defined outside
    			var callbackHooks = window.parent.mapClientCallbackHooks;
    			// check for definition in parent window in case we a in IFRAME 
    			if(window.parent.viewConfiguration) {
    				viewConfiguration = window.parent.viewConfiguration;
    			}
			}
			var callbackAreaId = {};
			if (!(typeof mapClientCallbackAreaId === "undefined")) {
				callbackAreaId = mapClientCallbackAreaId;
   			} else if ( window.parent != window && !(typeof window.parent.mapClientCallbackAreaId === "undefined")) {
   				// check if map is IFRAME embedded and callback was defined outside
    			var callbackAreaId = window.parent.mapClientCallbackAreaId;
    			// check for definition in parent window in case we a in IFRAME 
    			if(window.parent.viewConfiguration) {
    				viewConfiguration = window.parent.viewConfiguration;
    			}
			}			

			var mapUrl = de.ingrid.mapclient.Configuration.getUrlParameter('mapUrl') || null;

			// create the session and personalize it, if an user id is given in the userId GET parameter
			var userId = de.ingrid.mapclient.Configuration.getUrlParameter('userId') || null;
			if(typeof mapUserId === 'undefined'){
			var session = new de.ingrid.mapclient.frontend.data.Session({
				userId: userId
			});
			mapUserId = null;
			}else if(mapUserId != 'NoId'){				
			var session = new de.ingrid.mapclient.frontend.data.Session({
				userId: mapUserId
			});				
			}else{
				var session = new de.ingrid.mapclient.frontend.data.Session({
				userId: userId
			});
			}

			// determine the view configuration from the viewConfig GET parameter
			// if there isn't one defined in the template
			var viewConfig;
			if (typeof viewConfiguration === "undefined") {
				viewConfig = de.ingrid.mapclient.Configuration.getUrlParameter('viewConfig') || 'default';
			} else {
				viewConfig = viewConfiguration;
			}

			// build the gui with the given configuration
			if(viewConfig){
				var config = null;
				
				if(viewConfig  == "search"){
					config = {
						height: parseInt(de.ingrid.mapclient.Configuration.getSettings("searchPanelHeight").trim()),
						mapUrl: mapUrl,
						session: session,
						viewConfig: viewConfig,
						callbackHooks: callbackHooks,
						callbackAreaId: callbackAreaId
					};
					Ext.create('Ext.panel.Panel', {
						renderTo:'openlayersDiv',
						layout: 'fit',
					    items: [Ext.create('de.ingrid.mapclient.frontend.Workspace', config)]
					});
				}else if(viewConfig  == "search-facets"){
					config = {
						height: parseInt(de.ingrid.mapclient.Configuration.getSettings("searchPanelHeightFacets").trim()),
						mapUrl: mapUrl,
						session: session,
						viewConfig: viewConfig,
						callbackHooks: callbackHooks,
						callbackAreaId: callbackAreaId
					};
					Ext.create('Ext.panel.Panel', {
						renderTo:'openlayersDiv',
						layout: 'fit',
					    items: [Ext.create('de.ingrid.mapclient.frontend.Workspace', config)]
					});
				}else {
					config = {
						mapUrl: mapUrl,
						viewConfig: viewConfig,
						session: session,
						callbackHooks: callbackHooks
					}
					var northPanel = Ext.create('Ext.panel.Panel', {
						region : 'north',
						baseCls : '',
						height : de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop") && viewConfig != "default" ? parseInt(de.ingrid.mapclient.Configuration.getSettings("viewSpacerTop").trim()) : 0
					});
					
					var centerPanel = Ext.create('Ext.panel.Panel', {
						region : 'center',
						layout : 'fit',
						items : Ext.create('de.ingrid.mapclient.frontend.Workspace', config)
					});
					Ext.create('Ext.container.Viewport', {
					    layout: 'border',
					    monitorResize : true,
					    items: [northPanel, centerPanel]
					});
				}
			}
			
			if(typeof endLoadIcon !== 'undefined')
			endLoadIcon();
		},
		failure: function() {
			de.ingrid.mapclient.Message.showError(de.ingrid.mapclient.Message.LOAD_CONFIGURATION_FAILURE);
		}
	});
});
