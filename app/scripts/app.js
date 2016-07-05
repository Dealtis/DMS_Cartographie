'use strict';

/**
 * @ngdoc overview
 * @name dmsCartoApp
 * @description
 * # dmsCartoApp
 *
 * Main module of the application.
 */
angular
  .module('dmsCartoApp', [
    'ngAnimate',
    'ngRoute',
    'ngMaterial',
    'ngCookies',
    'ngSanitize',
    'uiGmapgoogle-maps',
    'angular.filter',
    'cgBusy',
    'vAccordion'
  ])
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      v: '3.20',
      libraries: 'weather,geometry,visualization'
    });
  });
