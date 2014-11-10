<%--
  **************************************************-
  InGrid Web Map Client
  ==================================================
  Copyright (C) 2014 wemove digital solutions GmbH
  ==================================================
  Licensed under the EUPL, Version 1.1 or – as soon they will be
  approved by the European Commission - subsequent versions of the
  EUPL (the "Licence");
  
  You may not use this work except in compliance with the Licence.
  You may obtain a copy of the Licence at:
  
  http://ec.europa.eu/idabc/eupl5
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the Licence is distributed on an "AS IS" basis,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the Licence for the specific language governing permissions and
  limitations under the Licence.
  **************************************************#
  --%>
var mapUserId = "<%=request.getUserPrincipal()  == null ? "" : request.getUserPrincipal().getName() %>";

if(mapUserId == ""){
	mapUserId = "<%=request.getHeader("REMOTE_USER") == null ? "" : request.getHeader("REMOTE_USER") %>";
}

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

if(typeof inBbox  == "undefined"){
    var reqBbox = getParameter("BBOX");
    if(reqBbox){
        var inBbox = reqBbox;
    }
}
if(typeof inSrs  == "undefined"){
    var reqSrs = getParameter("SRS");
    if(reqSrs){
        var inSrs = reqSrs;
    }
}
