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
<<<<<<< HEAD
    'ngRoute',
    'ngMaterial',
    'uiGmapgoogle-maps',
    'angular.filter',
    'cgBusy',
    'vAccordion'
  ])
  .config(function($routeProvider) {
=======
    'ngRoute'
  ])
  .config(function ($routeProvider) {
>>>>>>> e0f8a53580a3095f27ada966bdae212fdf89b7fa
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
<<<<<<< HEAD
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

window.loading_screen = window.pleaseWait({
  logo :'images/ICO/ico_home.svg',
  backgroundColor: '#4CDEBA',
  loadingHtml: "<div class='sk-wave'><div class='sk-rect sk-rect1'></div><div class='sk-rect sk-rect2'></div><div class='sk-rect sk-rect3'></div><div class='sk-rect sk-rect4'></div><div class='sk-rect sk-rect5'></div></div>"
});
=======
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
>>>>>>> e0f8a53580a3095f27ada966bdae212fdf89b7fa
