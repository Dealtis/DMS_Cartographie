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
    'uiGmapgoogle-maps',
    'angular.filter'
  ])
  .config(function ($routeProvider) {
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
      libraries: 'geometry,visualization'
    });
  });
