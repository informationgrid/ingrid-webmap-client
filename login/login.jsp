<!doctype html>
<html>
    <head>
      <meta charset="utf-8">
      <title>Login - InGrid Webmap Client Admin-GUI</title>
    
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
            <form class="form-horizontal ng-pristine ng-valid" method="POST" action="j_security_check">
              <div class="form-group">
                <label class="col-xs-4 control-label ng-scope" translate="">Name:</label>
                <div class="col-xs-8">
                    <input name="j_username" class="form-control ng-pristine ng-untouched ng-valid ng-empty" placeholder="Name ..." autofocus/>
                </div>
              </div>
              <div class="form-group">
                <label class="col-xs-4 control-label ng-scope" translate="">Passwort:</label>
                <div class="col-xs-8">
                    <input type="password" name="j_password" class="form-control ng-pristine ng-untouched ng-valid ng-empty" placeholder="Passwort ..." />
                </div>
              </div> 
              <hr>
              <button type="submit" class="btn btn-default col-xs-12 ng-scope" value="login">Anmelden</button>
            </form>
          </div>
         </div>
      </div>
    </body>
</html>