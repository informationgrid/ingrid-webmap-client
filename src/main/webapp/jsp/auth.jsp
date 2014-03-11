var mapUserId = "<%=request.getUserPrincipal()  == null ? "" : request.getUserPrincipal().getName() %>";

if(mapUserId == ""){
	mapUserId = undefined;
}

function getParameter (name){
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
	var regexS = "[\\?&]"+name+"=([^&#]*)";  
	var regex = new RegExp( regexS );  
	var results = regex.exec( window.location.href ); 
	if(results == null)    
		return;  
	else    
		return results[1];
}

if(typeof languageCode == "undefined"){
	var languageCode = "<%=request.getLocale()  == null ? "" : request.getLocale().getLanguage() %>";
	var lang = getParameter("lang");
	if(lang){
		languageCode = lang;
	}
}

if(typeof viewConfiguration == "undefined"){
	var config = getParameter("config");
	if(config){
		var viewConfiguration = config;
	}
}

if(typeof wms == "undefined"){
	var wmsUrl = getParameter("wms_url");
	if(wmsUrl){
		var wms = wmsUrl;
	}
}
