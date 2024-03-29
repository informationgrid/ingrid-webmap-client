goog.provide('ga_share_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_permalink');
goog.require('ga_urlutils_service');
goog.require('ga_window_service');

(function() {

  var module = angular.module('ga_share_directive', [
    'ga_browsersniffer_service',
    'ga_permalink',
    'ga_urlutils_service',
    'ga_window_service',
    'pascalprecht.translate'
  ]);

  // INGRID: Add param 'gaGlobalOptions'
  module.directive('gaShare', function($rootScope, $timeout, $translate,
      $window, gaPermalink, gaUrlUtils, gaWindow, gaBrowserSniffer,
      gaGlobalOptions) {
    return {
      restrict: 'A',
      scope: {
        active: '=gaShareActive',
        options: '=gaShareOptions'
      },
      templateUrl: 'components/share/partials/share.html',
      link: function(scope, element, attrs) {
        var permalinkInput = $('.ga-share-permalink input');

        scope.qrcodegeneratorPath = scope.options.qrcodegeneratorPath;
        scope.showMore = false;
        scope.showWhatsapp = !!gaBrowserSniffer.ios || gaBrowserSniffer.android;

        $('.ga-share-icon').tooltip({
          placement: 'bottom'
        });

        // INGRID: Enable share facebook
        scope.enableShareFacebook = gaGlobalOptions.enableShareFacebook;
        // INGRID: Enable share mail
        scope.enableShareMail = gaGlobalOptions.enableShareMail;
        // INGRID: Enable share google
        scope.enableShareGoogle = gaGlobalOptions.enableShareGoogle;
        // INGRID: Enable share twitter
        scope.enableShareTwitter = gaGlobalOptions.enableShareTwitter;
        // INGRID: Enable share iFrame
        scope.enableShareIFrame = gaGlobalOptions.enableShareIFrame;
        // INGRID: Enable share link
        scope.enableShareLink = gaGlobalOptions.enableShareLink;
        // INGRID: Enable share QR
        scope.enableShareQR = gaGlobalOptions.enableShareQR;
        // INGRID: Enable share QR
        scope.enableShareWhatsapp = gaGlobalOptions.enableShareWhatsapp;

        // Store in the scope the permalink value which is bound to
        // the input field
        scope.encodedDocumentTitle = encodeURIComponent(
            $translate.instant('page_title'));
        scope.urlShortened = false;
        // Listen to permalink change events from the scope.
        scope.$on('gaPermalinkChange', function(event) {
          scope.active = false;
        });

        scope.updateUrl = function() {
          // INGRID: Check iFrame location
          scope.permalinkValue = gaPermalink.getHref(undefined,
              gaGlobalOptions.isParentIFrame);
          // INGRID: Check iFrame location
          scope.encodedPermalinkHref =
              encodeURIComponent(gaPermalink.getHref(undefined,
                  gaGlobalOptions.isParentIFrame));
          // assuming document.title never change
          scope.embedValue = gaPermalink.getEmbedHref();
          // INGRID: Add embedAlt
          scope.embedAlt = $translate.instant('iframe_alt');
        };

        // Function to shorten url
        // Make an asynchronous request to url shortener
        scope.shortenUrl = function() {
          scope.encodedDocumentTitle = encodeURIComponent(
              $translate.instant('page_title'));
          gaUrlUtils.shorten(scope.permalinkValue).then(function(shortUrl) {
            // INGRID: Return href if no shorturl exists
            scope.permalinkValue = shortUrl || scope.permalinkValue;
            scope.urlShortened = true;
            scope.$applyAsync(function() {
              // Auto-select the shortened permalink (not on mobiles)
              if (gaWindow.isWidth('>s')) {
                permalinkInput.trigger('focus');
              }
            });
          });
        };

        // Watching opening and closing more options menu
        var iframeInput;
        scope.showMoreClick = function() {
          if (!scope.showMore) {
            $timeout(function() {
              // When we open the show more panel we scroll the parent
              // div then we put the focus on the input text
              element.parent().scrollTop(140);
              if (!iframeInput) {
                iframeInput = $('.ga-share-embed input');
              }
              iframeInput.trigger('focus');
            }, 0, false);
          }
          scope.showMore = !scope.showMore;
        };

        scope.openEmbedModal = function() {
          $rootScope.$broadcast('gaShareEmbedActive');
        };

        // Be able to disable some widgets on homescreen
        scope.homescreen = $window.navigator.standalone;

        var activate = function() {
          // URL is shortened only when menu share is active
          scope.updateUrl();
          scope.shortenUrl();
        };

        scope.$watch('active', function(newVal, oldVal) {
          if (newVal === true) {
            activate();
          }
        });
      }
    };
  });
})();
