goog.provide('ga_main_controller');

goog.require('ga_background_service');
goog.require('ga_cesium');
goog.require('ga_layers_service');
goog.require('ga_map_load_service');
goog.require('ga_maputils_service');
goog.require('ga_networkstatus_service');
goog.require('ga_storage_service');
goog.require('ga_topic_service');
goog.require('ga_translation_service');
goog.require('ga_window_service');

(function() {

  var module = angular.module('ga_main_controller', [
    'pascalprecht.translate',
    'ga_map',
    'ga_map_load_service',
    'ga_networkstatus_service',
    'ga_storage_service',
    'ga_background_service',
    'ga_topic_service',
    'ga_window_service',
    'ga_translation_service'
  ]);

  /**
   * The application's main controller.
   */
  module.controller('GaMainController', function($rootScope, $scope, $timeout,
      $translate, $window, $document, $q, gaBrowserSniffer, gaHistory, $compile,
      gaPermalinkFeaturesManager, gaPermalinkLayersManager, gaMapUtils,
      gaRealtimeLayersManager, gaNetworkStatus, gaPermalink, gaStorage,
      gaGlobalOptions, gaBackground, gaTime, gaLayers, gaTopic,
      gaOpaqueLayersManager, gaMapLoad, gaWindow, gaLang) {

    var createMap = function() {
      var toolbar = $('#zoomButtons')[0];
      var defaultProjection = ol.proj.get(gaGlobalOptions.defaultEpsg);

      // INGRID: Disable defaultProjection extent
      if (!defaultProjection.getExtent()) {
        defaultProjection.setExtent(ol.proj.
            transformExtent(gaGlobalOptions.defaultEpsgExtent, 'EPSG:4326',
                gaGlobalOptions.defaultEpsg));
      }

      // INGRID: Add zoom to extent button
      var zoomToExtentButton = $('#zoomToExtentButton')[0];
      var zoomIn = '<span translate-attr="{title: \'zoom_in\'}">' +
        '<i class="fa fa-ga-circle-bg"></i>' +
        '<i class="fa fa-ga-circle"></i>' +
        '<i class="fa fa-ga-zoom-plus"></i>' +
      '</span>';

      var zoomOut = '<span translate-attr="{title: \'zoom_out\'}">' +
        '<i class="fa fa-ga-circle-bg"></i>' +
        '<i class="fa fa-ga-circle"></i>' +
        '<i class="fa fa-ga-zoom-minus"></i>' +
      '</span>';

      var map = new ol.Map({
        moveTolerance: 5,
        controls: ol.control.util.defaults({
          attribution: false,
          rotate: false,
          zoomOptions: {
            target: toolbar,
            zoomInLabel: $compile(zoomIn)($scope)[0],
            zoomOutLabel: $compile(zoomOut)($scope)[0]
          }
        // INGRID: Configuration of zoom to extent button
        }).extend([
          new ol.control.ZoomToExtent({
            target: zoomToExtentButton,
            extent: ol.proj.transformExtent(gaMapUtils.defaultExtent,
                'EPSG:4326', gaGlobalOptions.defaultEpsg),
            tipLabel: 'Zoom to extent',
            label: $compile('<span translate-attr="{title: ' +
                   '\'zoom_to_extent_tiplabel\'}">' +
                   '<i class="fa fa-ga-circle-bg"></i>' +
                   '<i class="fa fa-ga-circle"></i>' +
                   '<i class="fa fa-resize-horizontal"></i>' +
                   '<i class="fa fa-resize-vertical"></i>' +
                   '</span>')($scope)[0],
            className: 'ol-zoom-extent'
          })
        ]),
        interactions: ol.interaction.defaults({
          altShiftDragRotate: true,
          touchRotate: false,
          keyboard: false
        }),
        renderer: 'canvas',
        view: new ol.View({
          // INGRID: Configuration of map
          projection: defaultProjection,
          // extent: gaMapUtils.defaultExtent,
          center: ol.proj.transform(ol.extent.getCenter(gaMapUtils.
              defaultExtent), 'EPSG:4326', gaGlobalOptions.defaultEpsg),
          // INGRID: Disabled resolution
          // resolution: gaMapUtils.defaultResolution,
          // INGRID: Get resolutions from config
          resolutions: gaMapUtils.viewResolutions.length > 0 ?
            gaMapUtils.viewResolutions : undefined
        }),
        logo: false
      });

      return map;
    };

    // Determines if the window has a height <= 550
    var win = $($window);

    // The main controller creates the OpenLayers map object. The map object
    // is central, as most directives/components need a reference to it.
    $scope.map = createMap();
    // Only active if debug=true is specified
    if (gaPermalink.getParams().debug === 'true') {
      gaMapLoad.init($scope);
    }

    // Set up 3D
    var startWith3D = false;

    if (gaGlobalOptions.dev3d && gaBrowserSniffer.webgl) {

      if (gaPermalink.getParams().lon !== undefined &&
          gaPermalink.getParams().lat !== undefined) {
        startWith3D = true;
      }

      var onRenderError = function(scene, error) {
        $scope.globals.is3dActive = undefined;
        $window.alert($translate.instant('3d_render_error'));
        $window.console.error(error.stack);
        // Avoid the alert comes twice
        $scope.ol3d.getCesiumScene().renderError.removeEventListener(
            onRenderError);
      };

      var cesium = new GaCesium($scope.map, gaPermalink, gaLayers,
          gaGlobalOptions, gaBrowserSniffer, $q, $translate, $rootScope,
          gaBackground, $window);

      cesium.loaded().then(function(ol3d) {
        $scope.ol3d = ol3d;
        if (!$scope.ol3d) {
          $scope.globals.is3dActive = undefined;
        } else {
          $scope.ol3d.getCesiumScene().renderError.addEventListener(
              onRenderError);
        }
      });

      if (startWith3D) {
        cesium.suspendRotation();
        cesium.enable(true);
      }

      $scope.map.on('change:target', function(event) {
        if ($scope.map.getTargetElement()) {

          $scope.$watch('globals.is3dActive', function(active) {
            if (active || $scope.ol3d) {
              cesium.enable(active);
            }
          });
        }
      });
    }

    // We add manually the keyboard interactions to have the possibility to
    // specify a condition
    var keyboardPan = new ol.interaction.KeyboardPan({
      condition: function() {
        return (!gaTime.get());
      }
    });
    $scope.map.addInteraction(keyboardPan);
    $scope.map.addInteraction(new ol.interaction.KeyboardZoom());

    // Start managing global time parameter, when all permalink layers are
    // added.
    gaTime.init($scope.map);

    // Load the background if the "bgLayer" parameter exist.
    gaBackground.init($scope.map);

    // Activate the "layers" parameter permalink manager for the map.
    gaPermalinkLayersManager($scope.map);

    // Activate the "features" permalink manager for the map.
    gaPermalinkFeaturesManager($scope.map);

    gaRealtimeLayersManager($scope.map);

    // Optimize performance by hiding non-visible layers
    gaOpaqueLayersManager($scope);

    var initWithPrint = /print/g.test(gaPermalink.getParams().widgets);
    var initWithFeedback = /feedback/g.test(gaPermalink.getParams().widgets);
    var initWithDraw = /draw/g.test(gaPermalink.getParams().widgets) ||
        !!(gaPermalink.getParams().adminId);
    gaPermalink.deleteParam('widgets');

    var onTopicsLoaded = function() {
      if (gaPermalink.getParams().layers !== undefined) {
        $scope.globals.catalogShown = false;
        $scope.globals.selectionShown = true;
        // INGRID: Show import
        var externalService = gaPermalink.getParams().layers;
        if (gaMapUtils.isExternalService(externalService)) {
          var externalServiceInfos = externalService.split('||');
          if (externalServiceInfos.length > 1) {
            var importExtService = externalServiceInfos[1];
            var importExtLayerIdent;
            if (externalServiceInfos.length > 2) {
              importExtLayerIdent = externalServiceInfos[2];
            }
            $scope.globals.importPopupShown = true;
            $scope.globals.importExtService = importExtService;
            if (importExtLayerIdent && importExtLayerIdent.length > 0) {
              $scope.globals.importExtLayerIdent = importExtLayerIdent;
            }
          }
        }
      } else {
        $scope.globals.catalogShown = true;
        $scope.globals.selectionShown = false;
      }
    };

    var onTopicChange = function(event, topic) {
      $scope.topicId = topic.id;

      // iOS 7 minimal-ui meta tag bug
      if (gaBrowserSniffer.ios) {
        $window.scrollTo(0, 0);
      }

      if (topic.activatedLayers.length &&
          !gaPermalink.getParams().layers) {
        $scope.globals.selectionShown = true;
        $scope.globals.catalogShown = false;
      } else if (topic.selectedLayers.length &&
          !gaPermalink.getParams().layers) {
        $scope.globals.catalogShown = true;
        $scope.globals.selectionShown = false;
      } else {
        if (event === null) {
          onTopicsLoaded();
        } else {
          $scope.globals.catalogShown = true;
        }
      }
    };

    gaTopic.loadConfig().then(function() {
      $scope.topicId = gaTopic.get().id;

      if (initWithPrint) {
        $scope.globals.isPrintActive = true;
      } else if (initWithFeedback) {
        $scope.globals.feedbackPopupShown = initWithFeedback;
      } else if (initWithDraw) {
        $scope.globals.isDrawActive = initWithDraw;
      } else {
        onTopicChange(null, gaTopic.get());
      }
      $rootScope.$on('gaTopicChange', onTopicChange);
    });

    $rootScope.$on('$translateChangeEnd', function() {
      $scope.langId = gaLang.get();
    });

    $scope.time = gaTime.get();
    $rootScope.$on('gaTimeChange', function(event, time) {
      $scope.time = time; // Used in embed page
    });

    // Create switch device url
    var switchToMobile = '' + !gaBrowserSniffer.mobile;
    // INGRID: Fix switch device mode
    if (!gaBrowserSniffer.embed) {
      if (window.parent.location.pathname) {
        if (!window.parent.location.pathname.indexOf('mobile.html') > -1) {
          switchToMobile = 'true';
        }
      }
    }
    $scope.host = {url: $window.location.host}; // only use in embed.html
    $scope.toMainHref = gaPermalink.getMainHref();
    $scope.deviceSwitcherHref = gaPermalink.getHref({mobile: switchToMobile});
    $rootScope.$on('gaPermalinkChange', function() {
      $scope.toMainHref = gaPermalink.getMainHref();
      $scope.deviceSwitcherHref = gaPermalink.getHref({mobile: switchToMobile});
    });

    $scope.globals = {
      dev3d: gaGlobalOptions.dev3d,
      searchFocused: false,
      homescreen: false,
      webkit: gaBrowserSniffer.webkit,
      ios: gaBrowserSniffer.ios,
      animation: gaBrowserSniffer.animation,
      offline: gaNetworkStatus.offline,
      desktop: gaBrowserSniffer.desktop,
      mobile: gaBrowserSniffer.mobile,
      embed: gaBrowserSniffer.embed,
      pulldownShown: false,
      catalogShown: false,
      selectionShown: false,
      feedbackPopupShown: false,
      settingsShown: false,
      queryShown: false,
      isShareActive: false,
      isDrawActive: false,
      isFeatureTreeActive: false,
      isPrintActive: false,
      isSwipeActive: false,
      is3dActive: startWith3D,
      isFpsActive: false,
      // INGRID: Add 'isParentIFrame'
      isParentIFrame: gaGlobalOptions.isParentIFrame,
      // INGRID: Add 'isHideCatalog'
      isHideCatalog: gaGlobalOptions.isHideCatalog,
      // INGRID: Add 'isHideDraw'
      isHideDraw: gaGlobalOptions.isHideDraw,
      // INGRID: Add 'isHideEpsgSelection'
      isHideEpsgSelection: gaGlobalOptions.isHideEpsgSelection,
      // INGRID: Add 'isHideCompare'
      isHideCompare: gaGlobalOptions.isHideCompare,
      // INGRID: Add 'serviceAnnouncement'
      serviceAnnouncement: gaGlobalOptions.serviceAnnouncement,
      // INGRID: Add 'serviceAnnouncementUrl'
      serviceAnnouncementUrl: gaGlobalOptions.serviceAnnouncementUrl,
      // INGRID: Add 'serviceHelpUrl'
      serviceHelpUrl: gaGlobalOptions.serviceHelpUrl,
      // INGRID: Add 'serviceHelpFooter'
      enableHelpFooter: gaGlobalOptions.enableHelpFooter,
      // INGRID: Add 'accessibilityUrl'
      accessibilityUrl: gaGlobalOptions.accessibilityUrl,
      // INGRID: Add 'accessibilityFooter'
      enableAccessibilityFooter: gaGlobalOptions.enableAccessibilityFooter,
      hostIsProd: gaGlobalOptions.hostIsProd
    };

    // gaWindow is efficient only after the dom is ready
    $scope.$applyAsync(function() {
      $scope.globals.searchFocused = gaWindow.isWidth('>xs');
      $scope.globals.pulldownShown = gaWindow.isWidth('>s') &&
           gaWindow.isHeight('>s');
      $scope.globals.settingsShown = gaWindow.isWidth('<=m');
      $scope.globals.queryShown = gaWindow.isWidth('>m');
    });

    $scope.hidePulldownOnXSmallScreen = function() {
      if (gaWindow.isWidth('xs')) {
        $scope.globals.pulldownShown = false;
      }
    };

    // INGRID: Check has layers
    $scope.hasAddedLayers = function() {
      var hasAddedLayers = false
      $scope.map.getLayers().getArray().forEach(function(layer) {
        if (layer.displayInLayerManager) {
          hasAddedLayers = true;
        }
      });
      return hasAddedLayers;
    };

    // INGRID: Add remove all layers
    $scope.removeLayers = function(evt) {
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }
      var layers = $scope.map.getLayers().getArray();
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (!layer.background) {
          $scope.map.removeLayer(layer);
          i--;
        }
      }
    };

    // INGRID: Check has activated layers
    $scope.hasAllActivatedLayers = {
      active: function(isActive) {
        var layers = $scope.map.getLayers().getArray();
        if (arguments.length) {
          for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (!layer.background) {
              layer.visible = isActive;
            }
          }
          return isActive;
        }
        var hasAllActivatedLayers = true
        $scope.map.getLayers().getArray().forEach(function(layer) {
          if (!layer.background && !layer.visible) {
            hasAllActivatedLayers = false;
          }
        });
        return hasAllActivatedLayers;
      }
    };

    // Deactivate all tools when draw is opening
    $scope.$watch('globals.isDrawActive', function(active) {
      if (active) {
        $scope.globals.feedbackPopupShown = false;
        $scope.globals.isFeatureTreeActive = false;
        $scope.globals.isSwipeActive = false;
      }
    });
    // Deactivate all tools when 3d is opening
    $scope.$watch('globals.is3dActive', function(active) {
      if (active) {
        $scope.globals.feedbackPopupShown = false;
        $scope.globals.isFeatureTreeActive = false;
        $scope.globals.isSwipeActive = false;
        $scope.globals.isDrawActive = false;
        $scope.globals.isShareActive = false;
      }
    });
    // Activate share tool when menu is opening.
    $scope.$watch('globals.pulldownShown', function(active) {
      if (active && !$scope.globals.isDrawActive &&
          !$scope.globals.isShareActive && gaWindow.isWidth('xs')) {
        // INGRID: Set 'isShareActive' to false
        $scope.globals.isShareActive = false;
      }
    });

    $rootScope.$on('gaNetworkStatusChange', function(evt, offline) {
      $scope.globals.offline = offline;
    });

    // Only iOS Safari
    if (!$window.navigator.standalone && gaBrowserSniffer.ios &&
        gaBrowserSniffer.safari && !gaStorage.getItem('homescreen')) {
      $timeout(function() {
        $scope.globals.homescreen = true;
        $scope.globals.tablet = gaWindow.isWidth('s');
        $scope.$watch('globals.homescreen', function(newVal) {
          if (newVal === false) {
            gaStorage.setItem('homescreen', 'none');
          }
        });
      }, 2000);
    }

    // Manage exit of draw mode
    // Exit Draw mode when pressing ESC or Backspace button
    $document.on('keydown', function(evt) {
      if (evt.which === 8) {
        if (!/^(input|textarea)$/i.test(evt.target.tagName)) {
          evt.preventDefault();
        } else {
          return;
        }
      }
      if ((evt.which === 8 || evt.which === 27) &&
          $scope.globals.isDrawActive) {
        $scope.globals.isDrawActive = false;
        $scope.$digest();
      }
    });

    // Browser back button management
    $scope.$watch('globals.isDrawActive', function(isActive) {
      if (isActive && gaHistory) {
        gaHistory.replaceState({
          isDrawActive: false
        }, '', gaPermalink.getHref());

        gaHistory.pushState(null, '', gaPermalink.getHref());
      }
    });
    $window.onpopstate = function(evt) {
      // When we go to full screen evt.state is null
      if (evt.state && evt.state.isDrawActive === false) {
        $scope.globals.isDrawActive = false;
        gaPermalink.refresh();
        $scope.$digest();
      }
    };

    // Management of panels display (only on screen bigger than 480px)
    win.on('resize', function() {
      // Hide catalog panel if height is too small
      if (gaWindow.isHeight('<=m')) {
        if ($scope.globals.catalogShown) {
          $scope.$applyAsync(function() {
            $scope.globals.catalogShown = false;
          });
        }
      }

      // Open share panel by default on phone
      if ($scope.globals.pulldownShown && !$scope.globals.isShareActive &&
          !$scope.globals.isDrawActive && gaWindow.isWidth('xs')) {
        $scope.$applyAsync(function() {
          // INGRID: Set 'isShareActive' to false
          $scope.globals.isShareActive = false;
        });
      }

      // Display settings panel
      if ((gaWindow.isWidth('<=m') && !$scope.globals.settingsShown) ||
         (gaWindow.isWidth('>m') && $scope.globals.settingsShown)) {
        $scope.$applyAsync(function() {
          $scope.globals.settingsShown = !$scope.globals.settingsShown;
        });
      }

      // Display query tool
      if ((gaWindow.isWidth('<=m') && $scope.globals.queryShown) ||
         (gaWindow.isWidth('>m') && !$scope.globals.queryShown)) {
        $scope.$applyAsync(function() {
          $scope.globals.queryShown = !$scope.globals.queryShown;
          if (!$scope.globals.queryShown) {
            $scope.globals.isFeatureTreeActive = false;
          }
        });
      }
    });

    // INGRID: Check params
    if (!$scope.globals.embed) {
      if (window.parent.onpopstate !== undefined) {
        window.parent.onpopstate = function(event) {
          var easting, northing, zoom;
          window.parent.isBackHistory = true;
          var url = new URL(window.parent.location.href);
          easting = url.searchParams.get('E');
          northing = url.searchParams.get('N');
          zoom = url.searchParams.get('zoom');
          if (easting && northing) {
            easting = parseFloat(easting.replace(/,/g, '.'));
            northing = parseFloat(northing.replace(/,/g, '.'));
            $scope.map.getView().setCenter([easting, northing]);
          }
          if (zoom) {
            $scope.map.getView().setZoom(zoom);
          }
        };
      }
    }

    // Hide a panel clicking on its heading
    var hidePanel = function(id) {
      if ($('#' + id).hasClass('in')) {
        $('#' + id + 'Heading').trigger('click');
      }
    };

    var hideAccordionPanels = function() {
      hidePanel('share');
      hidePanel('print');
      hidePanel('tools');
    };

    $('#catalog').on('shown.bs.collapse', function() {
      if (gaWindow.isWidth('xs')) {
        return;
      }
      // Close accordion
      hideAccordionPanels();

      if (gaWindow.isHeight('<=s')) {
        // Close selection
        hidePanel('selection');
      }
    });

    $('#selection').on('shown.bs.collapse', function() {
      if (gaWindow.isWidth('xs')) {
        return;
      }
      // Close accordion
      hideAccordionPanels();

      if (gaWindow.isHeight('<=s')) {
        // Close catalog
        hidePanel('catalog');
      }
    });

    // INGRID: Add print map resolution on console
    var isMouseClick = false;
    var timeout;
    $('#footer').on('mousedown', function() {
      isMouseClick = true;
      timeout = setTimeout(function() {
        if(isMouseClick) {
          console.log('Resolution: ' +
            $scope.map.getView().getResolution());
        }
      }, 3000);
    });
    $('#footer').on('mouseup', function() {
      clearTimeout(timeout);
      isMouseClick = false;
    });

    // Load new appcache file if available.
    if ($window.applicationCache) {
      $window.applicationCache.addEventListener('obsolete', function(e) {
        // setTimeout is needed for correct appcache update on Firefox
        setTimeout(function() {
          $window.location.reload(true);
        });
      });
    }
  });
})();
