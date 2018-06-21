var mapUserId = "<%=request.getUserPrincipal()  == null ? "" : request.getUserPrincipal().getName() %>";

if(mapUserId == ""){
    mapUserId = "<%=request.getHeader("REMOTE_USER") == null ? "" : request.getHeader("REMOTE_USER") %>";
}

if(mapUserId == ""){
    mapUserId = undefined;
}