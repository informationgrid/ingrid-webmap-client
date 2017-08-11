goog.provide('ga_permalink_service');

goog.require('ga_urlutils_service');
(function() {

  var module = angular.module('ga_permalink_service', [
    'ga_urlutils_service'
  ]);

  /**
   * The gaHistory service.
   *
   * A wrapper to the browser's window.history object.
   */
  module.provider('gaHistory', function() {
    this.$get = function($window, $sniffer, $document) {
      var doc = $document[0];
      var isFullScreen = function() {
        return (doc.fullscreenElement || doc.msFullscreenElement ||
            doc.mozFullScreen || doc.webkitIsFullScreen);
      };
      return {
        pushState: function(data, title, url) {
          if ($sniffer.history) {
            $window.history.pushState(data, title, url);
          }
        },
        replaceState: function(data, title, url) {
          if ($sniffer.history && !isFullScreen()) {
            $window.history.replaceState(data, title, url);
          }
        }
      };
    };
  });

  /**
   * The gaPermalink service.
   *
   * The service provides three functions:
   *
   * - getHref Get full permalink.
   * - getParams Get the search params.
   * - updateParams Update the search params.
   * - deleteParam Delete a search param.
   *
   * updateParams and deleteParam should be called during a digest cycle.
   * If the browser supports the history API the link in the address bar
   * is updated.
   */
  module.provider('gaPermalink', function() {
    this.$get = function($window, $rootScope, gaHistory, gaUrlUtils) {

        var Permalink = function(b, p) {
          var base = b;
          var params = p;

          // INGRID: Add param 'isParentIFrame'
          this.getHref = function(p, isParentIFrame) {
            var newParams = angular.extend({}, params);
            if (angular.isDefined(p)) {
              angular.extend(newParams, p);
            }

            // INGRID: Update URL outside of iFrame
            if (window.document.referrer.indexOf(window.location.host) > -1) {
                if (window.parent.onParamChange != undefined) {
                    // INGRID: Delete params from point coordinates
                    delete params['action'];
                    delete params['plugid'];
                    delete params['docid'];
                    window.parent.onParamChange(params);
                }
            }
            // INGRID: Check for iFrame parent location
            if (isParentIFrame) {
              if (window.parent) {
                  if (window.document.referrer.indexOf(window.location.host) >
                    -1) {
                      return window.parent.location.origin +
                      '' +
                      window.parent.location.pathname +
                      '?' +
                      gaUrlUtils.toKeyValue(newParams);
                  }
              }
            }
            return base + '?' + gaUrlUtils.toKeyValue(newParams);
          };

          this.getEmbedHref = function(p) {
            var newParams = angular.extend({}, params);
            if (angular.isDefined(p)) {
              angular.extend(newParams, p);
            }
            if (angular.isDefined(newParams.mobile)) {
              delete newParams.mobile;
            }
            // INGRID: Remove replace
            var baseEmbed = base.
                replace(/(index|mobile)\.html$/, 'embed.html');
            if (!/embed\.html$/.test(baseEmbed)) {
              if (!/\/$/.test(baseEmbed)) {
                baseEmbed += '/';
              }
              baseEmbed += 'embed.html';
            }
            return baseEmbed + '?' + gaUrlUtils.toKeyValue(newParams);
          };

          // The main href is the embed permalink but without the name of
          // the html page.
          this.getMainHref = function(p) {
            return this.getEmbedHref(p).replace(/\/embed\.html\?/, '/?');
          };

          this.getParams = function() {
            return params;
          };

          this.updateParams = function(p) {
            angular.extend(params, p);
          };

          this.deleteParam = function(key) {
             delete params[key];
          };

          this.refresh = function() {
             gaHistory.replaceState(null, '', this.getHref());
          };
        };

        var loc = $window.location;
        var port = loc.port;
        var protocol = loc.protocol;

        var base = protocol + '//' + loc.hostname +
            (port !== '' ? ':' + port : '') +
            loc.pathname;

        // INGRID: Get params from window parent
        var locSearch = loc.search;
        if (window.document.referrer.indexOf(loc.host) > -1) {
            if (window.parent.urlParams) {
                if (locSearch.startsWith('?')) {
                    locSearch = locSearch.replace('?', '');
                }
                if (locSearch.startsWith('&')) {
                    locSearch = locSearch.replace('&', '');
                }
                if (window.parent.urlParams.endsWith('&') == false) {
                    locSearch = window.parent.urlParams + '&' + locSearch;
                }else {
                    locSearch = window.parent.urlParams + '' + locSearch;
                }
            }
        }
        // INGRID: Change 'loc.search' to 'locSearch'
        var permalink = new Permalink(
            base, gaUrlUtils.parseKeyValue(locSearch.substring(1)));

        var lastHref = loc.href;
        $rootScope.$watch(function() {
          var newHref = permalink.getHref();
          if (lastHref !== newHref) {
            $rootScope.$evalAsync(function() {
              lastHref = newHref;
              gaHistory.replaceState(null, '', newHref);
              $rootScope.$broadcast('gaPermalinkChange');
            });
          }
        });

        return permalink;
      };
  });
})();
