<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Problem: Anmelden - InGrid Webmap Client Admin-GUI</title>

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/ingrid-webmap-client/frontend/prd/favicon.ico">
  <link href="/ingrid-webmap-client/frontend/prd/style/app.css" rel="stylesheet">
</head>
<body>
  <div class="content" style="padding: 100px 0 0 0; max-width:500px; margin: auto auto !important;">
    <div>
      <div class="panel-body ng-scope" style="border: 1px solid #eee;">
        <h3 style="text-align:center">InGrid Webmap Client Admin-GUI</h3>
        <hr>
        <p><b>Benutzer '<%=request.getRemoteUser()%>' existiert nicht!</b></p>
        <p>Bitte melden Sie sich &uuml;ber den Button 'Abmelden' ab ...</p>
        <hr>
        <a class="btn btn-default col-xs-12 ng-scope" href="/ingrid-webmap-client/login/logout.jsp">Abmelden</a>
      </div>
     </div>
  </div>
</body>
</html>