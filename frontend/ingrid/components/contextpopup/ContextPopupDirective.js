goog.provide('ga_contextpopup_directive');

goog.require('ga_event_service');
goog.require('ga_permalink');
goog.require('ga_height_service');
goog.require('ga_measure_service');
goog.require('ga_networkstatus_service');
goog.require('ga_reframe_service');
goog.require('ga_what3words_service');
goog.require('ga_window_service');

(function() {

  var module = angular.module('ga_contextpopup_directive', [
    'ga_event_service',
    'ga_networkstatus_service',
    'ga_permalink',
    'ga_height_service',
    'ga_measure_service',
    'ga_reframe_service',
    'ga_window_service',
    'ga_what3words_service',
    'pascalprecht.translate'
  ]);

  // INGRID: Add 'gaUrlUtils', '$translate', '$sce'
  module.directive('gaContextPopup',
      function($http, $q, $timeout, $window, $rootScope, gaBrowserSniffer,
          gaNetworkStatus, gaPermalink, gaGlobalOptions, gaLang, gaWhat3Words,
          gaReframe, gaEvent, gaWindow, gaHeight, gaMeasure, gaUrlUtils,
          $translate, $sce) {
        return {
          restrict: 'A',
          replace: true,
          templateUrl: 'components/contextpopup/partials/contextpopup.html',
          scope: {
            map: '=gaContextPopupMap',
            options: '=gaContextPopupOptions',
            isActive: '=gaContextPopupActive'
          },
          link: function(scope, element, attrs) {
            var qrcodeUrl = scope.options.qrcodeUrl;
            var holdPromise, isPopoverShown = false;
            var reframeCanceler = $q.defer();
            var heightCanceler = $q.defer();
            var map = scope.map;
            var view = map.getView();
            var clickCoord, coord4326;
            var proj = map.getView().getProjection();
            // INGRID: Add BwaStrLocator
            var bwaLocatorUrl = scope.options.bwaLocatorUrl;

            // INGRID: Add tabs
            scope.currentTab = 1;
            // INGRID: Enable w3w
            scope.enableW3W = gaGlobalOptions.enableW3W;

            // Tabs management stuff
            scope.activeTab = function(numTab) {
              scope.currentTab = numTab;
            };
            scope.getTabClass = function(numTab) {
              return (numTab === scope.currentTab) ? 'active' : '';
            };

            var overlay = new ol.Overlay({
              element: element[0],
              stopEvent: true
            });
            map.addOverlay(overlay);

            // INGRID: Add 'showBWaStrLocator'
            scope.showBWaLocator = function() {
              if (gaGlobalOptions.searchBwaLocatorStationUrl) {
                return true;
              }
              return false;
            };

            var coordinatesFormatUTM = function(coordinates, zone) {
              var coord = ol.coordinate.toStringXY(coordinates, 0).
                  replace(/\B(?=(\d{3})+(?!\d))/g, "'");
              return coord + ' ' + zone;
            };

            var updateW3W = function() {
              gaWhat3Words.getWords(coord4326[1],
                  coord4326[0]).then(function(res) {
                scope.w3w = res;
              }, function(response) {
                if (response.status !== -1) { // Error
                  scope.w3w = '-';
                }
              });
            };

            var cancelRequests = function() {
              // Cancel last requests
              heightCanceler.resolve();
              reframeCanceler.resolve();
              heightCanceler = $q.defer();
              reframeCanceler = $q.defer();
              gaWhat3Words.cancel();
            };

            var handler = function(event) {
              if (!scope.isActive) {
                return;
              }
              event.stopPropagation();
              event.preventDefault();

              // On Mac, left-click with ctrlKey also fires
              // the 'contextmenu' event. But this conflicts
              // with selectByRectangle feature (in featuretree
              // directive). So we bail out here if
              // ctrlKey is pressed
              if (event.ctrlKey) {
                return;
              }

              clickCoord = (event.originalEvent) ?
                map.getEventCoordinate(event.originalEvent) :
                event.coordinate;
              clickCoord[0] = parseFloat(clickCoord[0].toFixed(1));
              clickCoord[1] = parseFloat(clickCoord[1].toFixed(1));
              coord4326 = ol.proj.transform(clickCoord, proj, 'EPSG:4326');
              // INGRID: Add projections
              var coord3857 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:3857');
              var coord31466 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:31466');
              var coord31467 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:31467');
              var coord31468 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:31468');
              var coord31469 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:31469');
              var coord25832 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:25832');
              var coord25833 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:25833');
              var coord2166 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:2166');
              var coord2167 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:2167');
              var coord2168 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:2168');

              scope.coord4326 = ol.coordinate.format(coord4326, '{y}, {x}', 5);
              var coord4326String = ol.coordinate.toStringHDMS(coord4326, 3).
                  replace(/ /g, '');
              // INGRID: Add Decimal Minutes Format
              var coord4326StringDME = parseInt(coord4326[0]) + '°'
                  + ((coord4326[0] - parseInt(coord4326[0])) * 60).toFixed(3)
                  + '\'E';
              var coord4326StringDMN = parseInt(coord4326[1]) + '°'
                  + ((coord4326[1] - parseInt(coord4326[1])) * 60).toFixed(3)
                  + '\'N';
              var coord4326StringDM = coord4326StringDMN + ', '
                  + coord4326StringDME;
              scope.coordiso4326 = coord4326String.replace(/N/g, 'N ');
              scope.coord2056 = gaMeasure.formatCoordinates(clickCoord, 1);
              if (coord4326[0] < 6 && coord4326[0] >= 0) {
                var utm31t = ol.proj.transform(coord4326,
                    'EPSG:4326', 'EPSG:32631');
                scope.coordutm = coordinatesFormatUTM(utm31t, '(zone 31T)');
              } else if (coord4326[0] < 12 && coord4326[0] >= 6) {
                var utm32t = ol.proj.transform(coord4326,
                    'EPSG:4326', 'EPSG:32632');
                scope.coordutm = coordinatesFormatUTM(utm32t, '(zone 32T)');
              } else {
                scope.coordutm = '-';
              }

              // INGRID: Add coordinates
              var projections = [{
                value: 'EPSG:3857',
                label: $sce.trustAsHtml($translate.instant('projection_3857')),
                coordinates: $sce.trustAsHtml(ol.coordinate.format(coord3857,
                    '{y}, {x}', 2))
              }, {
                value: 'EPSG:4326',
                label: $sce.trustAsHtml($translate.instant('projection_4326')),
                coordinates: $sce.trustAsHtml(ol.coordinate.format(coord4326,
                      '{y}, {x}', 5)
                    + ' <br> ' +
                      coord4326StringDM
                    + ' <br> ' +
                      coord4326String.replace(/N/g, 'N, '))
              }, {
                value: 'EPSG:31466',
                label: $sce.trustAsHtml($translate.instant('projection_31466')),
                coordinates: $sce.trustAsHtml(ol.coordinate.format(coord31466,
                    '{x}, {y}', 2))
              }, {
                value: 'EPSG:31467',
                label: $sce.trustAsHtml($translate.instant('projection_31467')),
                coordinates: $sce.trustAsHtml(ol.coordinate.format(coord31467,
                    '{x}, {y}', 2))
              }, {
                value: 'EPSG:31468',
                label: $sce.trustAsHtml($translate.instant('projection_31468')),
                coordinates: $sce.trustAsHtml(ol.coordinate.format(coord31468,
                    '{x}, {y}', 2))
              }, {
                value: 'EPSG:31469',
                label: $sce.trustAsHtml($translate.instant('projection_31469')),
                coordinates: $sce.trustAsHtml(ol.coordinate.format(coord31469,
                    '{x}, {y}', 2))
              }, {
                value: 'EPSG:25832',
                label: $sce.trustAsHtml($translate.instant('projection_25832')),
                coordinates: $sce.trustAsHtml(ol.coordinate.format(coord25832,
                    '{x}, {y}', 2))
              }, {
                value: 'EPSG:25833',
                label: $sce.trustAsHtml($translate.instant('projection_25833')),
                coordinates: $sce.trustAsHtml(ol.coordinate.format(coord25833,
                    '{x}, {y}', 2))
              }, {
                value: 'EPSG:2166',
                label: $sce.trustAsHtml($translate.instant('projection_2166')),
                coordinates: ol.coordinate.format(coord2166,
                    '{x}, {y}', 2)
              }, {
                value: 'EPSG:2167',
                label: $sce.trustAsHtml($translate.instant('projection_2167')),
                coordinates: ol.coordinate.format(coord2167,
                    '{x}, {y}', 2)
              }, {
                value: 'EPSG:2168',
                label: $sce.trustAsHtml($translate.instant('projection_2168')),
                coordinates: ol.coordinate.format(coord2168,
                    '{x}, {y}', 2)
              }];
              var sortProjections = [];
              var gp, p, projection;
              for (gp in gaGlobalOptions.defaultMouseProjections) {
                var gaProj = gaGlobalOptions.defaultMouseProjections[gp];
                for (p in projections) {
                  projection = projections[p];
                  if (gaProj === projection.value) {
                    sortProjections.push(projection);
                    break;
                  }
                }
              }
              scope.projections = sortProjections;

              // set coord label and coords for bwastr dependent from
              // default CRS
              for (p in projections) {
                projection = projections[p];
                if (gaGlobalOptions.defaultEpsg === projection.value) {
                  scope.bwastr_label = projection.label;
                  scope.bwastr_coords = projection.coordinates;
                  break;
                }
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
              scope.$applyAsync(function() {

                /* INGRID: Disable height
                gaHeight.get(scope.map, clickCoord, heightCanceler.promise).
                    then(function(height) {
                      scope.altitude = height;
                    }, function(response) {
                      if (response.status !== -1) { // Error
                        scope.altitude = '-';
                      }
                    });

                gaReframe.get95To03(clickCoord, reframeCanceler.promise).
                    then(function(coords) {
                      scope.coord21781 = gaMeasure.formatCoordinates(coords, 2);
                    }, function() {
                      var coords = ol.proj.transform(clickCoord, proj,
                          'EPSG:21781');
                      scope.coord21781 = gaMeasure.formatCoordinates(coords, 2);
                    });
                */

                updateW3W();
              });

              updatePopupLinks();

              // INGRID: Add get 'BWaStrLocator' data
              if (gaGlobalOptions.searchBwaLocatorStationUrl) {
                getBWaLocatorData();
              }

              if (gaWindow.isWidth('xs') || gaWindow.isHeight('xs')) {
                view.animate({
                  center: clickCoord,
                  duration: 200
                }, hidePopoverOnNextChange);

              } else {
                hidePopoverOnNextChange();
              }

              overlay.setPosition(clickCoord);
              element.show();
              // We use a boolean instead of  jquery .is(':visible') selector
              // because that doesn't work with phantomJS.
              isPopoverShown = true;
            };

            if ('oncontextmenu' in $window) {
              $(map.getViewport()).on('contextmenu', function(event) {
                if (isPopoverShown) {
                  scope.hidePopover();
                }
                $timeout.cancel(holdPromise);
                handler(event);
              });
              element.on('contextmenu', 'a', function(e) {
                e.stopPropagation();
              });
            }

            // IE manage contextmenu event also with touch so no need to add
            // pointers events too.
            if (!gaBrowserSniffer.msie) {
              // On touch devices and browsers others than ie10, display the
              // context popup after a long press (300ms)
              map.on('pointerdown', function(event) {
                if (gaEvent.isMouse(event)) {
                  return;
                }
                $timeout.cancel(holdPromise);
                holdPromise = $timeout(function() {
                  handler(event);
                }, 300, false);
              });
              map.on('pointerup', function(event) {
                if (gaEvent.isMouse(event)) {
                  return;
                }
                $timeout.cancel(holdPromise);
              });
              map.on('pointermove', function(event) {
                if (gaEvent.isMouse(event)) {
                  return;
                }
                if (event.dragging) {
                  $timeout.cancel(holdPromise);
                }
              });
            }

            $rootScope.$on('$translateChangeEnd', function() {
              if (isPopoverShown) {
                updateW3W();
              }
            });

            // Listen to permalink change events from the scope.
            scope.$on('gaPermalinkChange', function(event) {
              if (angular.isDefined(clickCoord) && isPopoverShown) {
                updatePopupLinks();
              }
            });

            scope.hidePopover = function(evt) {
              if (evt) {
                evt.stopPropagation();
              }
              cancelRequests();
              element.hide();
              isPopoverShown = false;
            };

            function hidePopoverOnNextChange() {
              view.once('change:center', scope.hidePopover);
            }

            function updatePopupLinks() {
              var p = {
                E: Math.round(clickCoord[0], 1),
                N: Math.round(clickCoord[1], 1)
              };
              // INGRID: Create href with portal layout
              scope.contextPermalink = gaPermalink.getHref(p,
                  gaGlobalOptions.isParentIFrame);
              scope.crosshairPermalink = gaPermalink.getHref(
                  angular.extend({crosshair: 'marker'}, p),
                  gaGlobalOptions.isParentIFrame);

              scope.qrcodeUrl = null;
              if (!gaNetworkStatus.offline && gaWindow.isWidth('>=s') &&
                  gaWindow.isHeight('>s')) {
                gaUrlUtils.shorten(scope.contextPermalink).
                    then(function(shortUrl) {
                      // INGRID: Return href if no shorturl exists
                      var url = shortUrl || scope.contextPermalink;
                      scope.qrcodeUrl = qrcodeUrl + '?url=' +
                        escape(url);
                    });
              }
            }

            // INGRID: Get 'BWaStrLocator' data
            function getBWaLocatorData() {
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
                X: clickCoord[1].toFixed(2),
                Y: clickCoord[0].toFixed(2)
              };
              var content = '';
              content = '{"limit":200,"queries":[' +
                '{"qid":1,"geometry":{"type":"Point","coordinates":[' +
                p.Y +
                ',' +
                p.X +
                '],"spatialReference":{"wkid":' +
                gaGlobalOptions.defaultEpsg.split(':')[1] + '}}}' +
                ']}';

              $http.get(bwaLocatorUrl + '&data=' + content, {
                params: {
                  'url': gaGlobalOptions.searchBwaLocatorStationUrl,
                  'data': content
                }
              }).then(function(response) {
                updateBWaLocatorData(response);
              });
            }

            function updateBWaLocatorData(response) {
              var result = response.data.result[0];
              if (result) {
                if (result.error === undefined) {
                  scope.bwastr_id = result.bwastrid;
                  scope.bwastr_name = result.bwastr_name;
                  scope.bwastr_typ = result.strecken_name;
                  scope.bwastr_km = result.stationierung.km_wert;
                  scope.bwastr_distance = result.stationierung.
                      offset.toFixed(2);
                } else {
                  scope.bwastr_error = result.error.message;
                }
              }
            }
          }
        };
      });
})();
