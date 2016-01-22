(function() {
  goog.provide('ga_searchtool_controller');

  var module = angular.module('ga_searchtool_controller', [
    'pascalprecht.translate',
    'ga_styles_service'
  ]);

  module.controller('GaSearchtoolController',
      function($rootScope, $scope, $translate, gaGlobalOptions, gaStyleFactory) {
        
        $scope.$on('gaPopupFocusChange', function(evt, isFocus) {
          $scope.options.hasPopupFocus = isFocus;
        });

        $scope.options = $scope.options || {};

        // Defines directive options
        $scope.options.translate = $translate; // For translation of ng-options

        $scope.options.text = '';

        $scope.options.tools = [
          {id: 'point',   iconClass: 'icon-ga-point'},
          {id: 'area',    iconClass: 'icon-ga-area'}
        ];

        // Define tools identifiers
        for (var i = 0, ii = $scope.options.tools.length; i < ii; i++) {
          var tool = $scope.options.tools[i];
          tool.activeKey = 'is' + tool.id.charAt(0).toUpperCase() + tool.id.slice(1) + 'Active';
          tool.cssClass = 'ga-searchtool-' + tool.id + '-bt';
          tool.title = 'searchtool_' + tool.id;
          tool.description = 'searchtool_' + tool.id + '_description';
          tool.instructions = 'searchtool_' + tool.id + '_instructions';
        }
      });
})();
