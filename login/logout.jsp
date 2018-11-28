<%@ page session="true"%>

User '<%=request.getRemoteUser()%>' has been logged out.

<% 
session.invalidate();
request.getSession(false); 
String redirectURL = "/ingrid-webmap-client/admin";
response.sendRedirect(redirectURL);
%>