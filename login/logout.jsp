<!doctype html>
<%@ page session="true"%>
<html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Logout - InGrid Webmap Client Admin-GUI</title>
    
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="icon" type="image/x-icon" href="/ingrid-webmap-client/frontend/prd/favicon.ico">
      <link href="/ingrid-webmap-client/frontend/prd/style/app.css" rel="stylesheet">
    </head>
<body>
<% 
session.invalidate();
request.getSession(false); 
%>
      <div class="content" style="padding: 100px 0 0 0; max-width:500px; margin: auto auto !important;">
        <div>
          <div class="panel-body ng-scope" style="border: 1px solid #eee;">
            <h3 style="text-align:center">InGrid Webmap Client Admin-GUI</h3>
            <hr>
            <p><b>Sie sind nun von der Admin-GUI abgemeldet!</b></p>
            <p>Melden Sie sich &uuml;ber den Button 'Erneut anmelden' wieder an ...</p>
            <hr>
            <a class="btn btn-default col-xs-12 ng-scope" href="/ingrid-webmap-client/admin">Erneut anmelden</a>
          </div>
         </div>
      </div>
    </body>
</html>