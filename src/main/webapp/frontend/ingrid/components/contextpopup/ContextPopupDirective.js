goog.provide('ga_contextpopup_directive');

goog.require('ga_networkstatus_service');
goog.require('ga_permalink');
(function() {

  var module = angular.module('ga_contextpopup_directive', [
    'ga_networkstatus_service',
    'ga_permalink',
    'pascalprecht.translate'
  ]);

  module.directive('gaContextPopup',
      function($rootScope, $http, $translate, $q, $timeout, $window,
          gaBrowserSniffer, gaNetworkStatus, gaPermalink, gaGlobalOptions) {
        return {
          restrict: 'A',
          replace: true,
          templateUrl: 'components/contextpopup/partials/contextpopup.html',
          scope: {
            map: '=gaContextPopupMap',
            options: '=gaContextPopupOptions',
            is3dActive: '=gaContextPopupIs3d'
          },
          link: function(scope, element, attrs) {
            var heightUrl = scope.options.heightUrl;
            var qrcodeUrl = scope.options.qrcodeUrl;
            // INGRID: Add BwaStrLocator
            var bwaLocatorUrl = scope.options.bwaLocatorUrl;
            var lv03tolv95Url = scope.options.lv03tolv95Url;

            scope.titleClose = $translate.instant('close');
            scope.currentTab = 1;
            
            // Tabs management stuff
            scope.activeTab = function(numTab) {
              scope.currentTab = numTab;
            };
            scope.getTabClass = function(numTab) {
              return (numTab === scope.currentTab) ? 'active' : '';
            };
            
            // The popup content is updated (a) on contextmenu events,
            // and (b) when the permalink is updated.

            var map = scope.map;
            var view = map.getView();

            // INGRID: Change 'coord21781' to 'coordDefault'
            var coordDefault;
            var popoverShown = false;

            var overlay = new ol.Overlay({
              element: element[0],
              stopEvent: true
            });
            map.addOverlay(overlay);

            scope.showQR = function() {
              return !gaBrowserSniffer.mobile && !gaNetworkStatus.offline;
            };
            
            // INGRID: Add 'showBWaStrLocator'
            scope.showBWaLocator = function() {
                if(gaGlobalOptions.searchBwaLocatorStationUrl){
                    return true;
                }
                return false;
            };
            
            var formatCoordinates = function(coord, prec, ignoreThousand) {
              var fCoord = ol.coordinate.toStringXY(coord, prec);
              if (!ignoreThousand) {
                fCoord = fCoord.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
              }
              return fCoord;
            };

            var coordinatesFormatUTM = function(coordinates, zone) {
              var coord = ol.coordinate.toStringXY(coordinates, 0).
                  replace(/\B(?=(\d{3})+(?!\d))/g, "'");
              return coord + ' ' + zone;
            };

            var handler = function(event) {
              if (scope.is3dActive) {
                return;
              }
              event.stopPropagation();
              event.preventDefault();

              //On Mac, left-click with ctrlKey also fires
              //the 'contextmenu' event. But this conflicts
              //with selectByRectangle feature (in featuretree
              //directive). So we bail out here if
              //ctrlKey is pressed
              if (event.ctrlKey) {
                return;
              }

              var pixel = (event.originalEvent) ?
                  map.getEventPixel(event.originalEvent) :
                  event.pixel;
              // INGRID: Change 'coord21781' to 'coordDefault'
              coordDefault = (event.originalEvent) ?
                  map.getEventCoordinate(event.originalEvent) :
                  event.coordinate;
              // INGRID: Change 'coord21781' to 'coordDefault'
              var coord4326 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:4326');
              // INGRID: Change 'coord21781' to 'coordDefault'
              var coord2056 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:2056');
              // INGRID: Add coordinates
              var coord31466 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:31466');
              var coord31467 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:31467');
              var coord31468 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:31468');
              var coord31469 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:31469');
              var coord25832 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:25832');
              var coord25833 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:25833');
                  
              // recenter on phones
              if (gaBrowserSniffer.phone) {
                var pan = ol.animation.pan({
                  duration: 200,
                  source: view.getCenter()
                });
                map.beforeRender(pan);
                // INGRID: Change 'coord21781' to 'coordDefault'
                view.setCenter(coordDefault);
              }

              // INGRID: Change 'coord21781' to 'coordDefault' and format coordDefault
              scope.coordDefault = ol.coordinate.format(coordDefault, '{y}, {x}', 2);
              scope.coord4326 = ol.coordinate.format(coord4326, '{y}, {x}', 5);
              var coord4326String = ol.coordinate.toStringHDMS(coord4326, 3).
                                   replace(/ /g, '');
              scope.coordiso4326 = coord4326String.replace(/N/g, 'N ');
              scope.coord2056 = formatCoordinates(coord2056, 2) + ' *';
              
              // INGRID: Add coordinates to scope
              scope.coord31466 = ol.coordinate.format(coord31466, '{y}, {x}', 2);
              scope.coord31467 = ol.coordinate.format(coord31467, '{y}, {x}', 2);
              scope.coord31468 = ol.coordinate.format(coord31468, '{y}, {x}', 2);
              scope.coord31469 = ol.coordinate.format(coord31469, '{y}, {x}', 2);
              scope.coord25832 = ol.coordinate.format(coord25832, '{y}, {x}', 2);
              scope.coord25833 = ol.coordinate.format(coord25833, '{y}, {x}', 2);
              
              if (coord4326[0] < 6 && coord4326[0] >= 0) {
                var utm_31t = ol.proj.transform(coord4326,
                    'EPSG:4326', 'EPSG:32631');
                scope.coordutm = coordinatesFormatUTM(utm_31t, '(zone 31T)');
              } else if (coord4326[0] < 12 && coord4326[0] >= 6) {
                var utm_32t = ol.proj.transform(coord4326,
                    'EPSG:4326', 'EPSG:32632');
                scope.coordutm = coordinatesFormatUTM(utm_32t, '(zone 32T)');
              } else {
                  // INGRID: Remove return '-'
                  // return '-';
              }

              coord4326['lon'] = coord4326[0];
              coord4326['lat'] = coord4326[1];
              scope.coordmgrs = $window.proj4.mgrs.forward(coord4326).
                  replace(/(.{5})/g, '$1 ');

              // A digest cycle is necessary for $http requests to be
              // actually sent out. Angular-1.2.0rc2 changed the $evalSync
              // function of the $rootScope service for exactly this. See
              // Angular commit 6b91aa0a18098100e5f50ea911ee135b50680d67.
              // We use a conservative approach and call $apply ourselves
              // here, but we instead could also let $evalSync trigger a
              // digest cycle for us.
              scope.$apply(function() {

                /* INGRID: Disable height
                $http.get(heightUrl, {
                  params: {
                    // INGRID: Change 'coord21781' to 'coordDefault'
                    easting: coordDefault[0],
                    northing: coordDefault[1],
                    elevation_model: gaGlobalOptions.defaultElevationModel
                  }
                }).success(function(response) {
                  scope.altitude = parseFloat(response.height);
                });
                
                $http.get(lv03tolv95Url, {
                  params: {
                    // INGRID: Change 'coord21781' to 'coordDefault'
                    easting: coordDefault[0],
                    northing: coordDefault[1]
                  }
                }).success(function(response) {
                  coord2056 = response.coordinates;
                  scope.coord2056 = formatCoordinates(coord2056, 2);
                });
                */

              });

              updatePopupLinks();

              // INGRID: Add get 'BWaStrLocator' data
              if(gaGlobalOptions.searchBwaLocatorStationUrl){
                  getBWaLocatorData();
              }
              
              view.once('change:center', function() {
                hidePopover();
              });

              // INGRID: Change 'coord21781' to 'coordDefault'
              overlay.setPosition(coordDefault);
              showPopover();
            };


            if (!gaBrowserSniffer.mobile && gaBrowserSniffer.events.menu) {
              $(map.getViewport()).on(gaBrowserSniffer.events.menu, handler);
              element.on(gaBrowserSniffer.events.menu, 'a', function(e) {
                e.stopPropagation();
              });

            } else {
              // On touch devices and browsers others than ie10, display the
              // context popup after a long press (300ms)
              var startPixel, holdPromise;
              map.on('pointerdown', function(event) {
                $timeout.cancel(holdPromise);
                startPixel = event.pixel;
                holdPromise = $timeout(function() {
                  handler(event);
                }, 300, false);
              });
              map.on('pointerup', function(event) {
                $timeout.cancel(holdPromise);
                startPixel = undefined;
              });
              map.on('pointermove', function(event) {
                if (startPixel) {
                  var pixel = event.pixel;
                  var deltaX = Math.abs(startPixel[0] - pixel[0]);
                  var deltaY = Math.abs(startPixel[1] - pixel[1]);
                  if (deltaX + deltaY > 6) {
                    $timeout.cancel(holdPromise);
                    startPixel = undefined;
                  }
                }
              });
            }

            $rootScope.$on('$translateChangeEnd', function() {
              scope.titleClose = $translate.instant('close');
            });

            // Listen to permalink change events from the scope.
            scope.$on('gaPermalinkChange', function(event) {
              // INGRID: Change 'coord21781' to 'coordDefault'
              if (angular.isDefined(coordDefault) && popoverShown) {
                updatePopupLinks();
              }
            });

            scope.hidePopover = function(evt) {
              if (evt) {
                evt.stopPropagation();
              }
              hidePopover();
            };

            function showPopover() {
              element.css('display', 'block');
              popoverShown = true;
            }

            function hidePopover() {
              element.css('display', 'none');
              popoverShown = false;
            }

            function updatePopupLinks() {
              var p = {
                // INGRID: Change 'coord21781' to 'coordDefault'
                X: Math.round(coordDefault[1], 1),
                Y: Math.round(coordDefault[0], 1)
              };

              // INGRID: Create href with portal layout
              var contextPermalink = gaPermalink.getHref(p, gaGlobalOptions.isParentIFrame);
              scope.contextPermalink = contextPermalink;

              scope.crosshairPermalink = gaPermalink.getHref(
                  angular.extend({crosshair: 'marker'}, p));

              if (!gaBrowserSniffer.mobile) {
                scope.qrcodeUrl = qrcodeUrl + '?url=' +
                    escape(contextPermalink);
              }
            }
            
            // INGRID: Get 'BWaStrLocator' data
            function getBWaLocatorData(){
              scope.bwastr_id = undefined;
              scope.bwastr_name = undefined;
              scope.bwastr_typ = undefined;
              scope.bwastr_lon = undefined;
              scope.bwastr_lat = undefined;
              scope.bwastr_km = undefined;
              scope.bwastr_distance = undefined;
              scope.bwastr_error = undefined;
              
              var p = {
                // INGRID: Change 'coord21781' to 'coordDefault'
                X: Math.round(coordDefault[1], 1),
                Y: Math.round(coordDefault[0], 1)
              };
              var content = "";
              content = content + '{"limit":200,"queries":[';
              content = content + '{"qid":1,"geometry":{"type":"Point","coordinates":[' + p.Y + ',' + p.X + '],"spatialReference":{"wkid":3857}}}';
              content = content + ']}';
              
              $http.get(bwaLocatorUrl + "&data=" + content, {
                  params: {
                    'url':  gaGlobalOptions.searchBwaLocatorStationUrl,
                    'data': content
                  }
                }).success(function(response) {
                    updateBWaLocatorData(response);
                }).error(function() {
              });
            }
            
            function updateBWaLocatorData(response){
                var result = response.result[0];
                if(result){
                    if(result.error == undefined){
                        scope.bwastr_id = result.bwastrid;
                        scope.bwastr_name = result.bwastr_name;
                        scope.bwastr_typ = result.strecken_name;
                        scope.bwastr_lon = result.geometry.coordinates[0];
                        scope.bwastr_lat = result.geometry.coordinates[1];
                        scope.bwastr_km = result.stationierung.km_wert;
                        scope.bwastr_distance = result.stationierung.offset;
                    }else{
                        scope.bwastr_error = result.error.message;
                    }
                }
            }
          }
        };
      });
})();