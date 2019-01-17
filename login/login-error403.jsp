<%@ page session="true"%>
<% 
session.invalidate();
request.getSession(false);

String url = "/ingrid-webmap-client/admin/";
response.sendRedirect(url);
%>
