'use strict';

/**
 * @ngdoc function
 * @name dmsCartoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dmsCartoApp
 */
angular.module('dmsCartoApp')
  .controller('MainCtrl', function($scope, apiDMSCARTO) {

    //init
    angular.fromJson(apiDMSCARTO.loadChauffeurs('24'))
    .then(function(response) {
      $scope.chauffeurs = response;
      console.log(response.data);
    });

    var gpsSocPos = [];
    angular.fromJson(apiDMSCARTO.loadSocposition('24'))
    .then(function(response) {
      var socPosition = response.data;
      gpsSocPos = socPosition[0].pos.split(",");
      console.log(response.data);
    });
    $scope.markers = [];
    $scope.boundsMarkers = new google.maps.LatLngBounds();

    $scope.map = {
      center: {
        latitude: gpsSocPos[0],
        longitude: gpsSocPos[1]
      },
      zoom: 8,
      markerHome: {
        id: Date.now(),
        coords: {
          latitude: gpsSocPos[0],
          longitude: gpsSocPos[1]
        },
        options: {
          icon: {
            url: '../../images/ICO/ico_home.svg'
          }
        }
      }
    };

    // Select with research
    $scope.searchTerm;
    $scope.clearSearchTerm = function() {
      $scope.searchTerm = '';
    };

    angular.element(document).find('input').on('keydown', function(ev) {
      ev.stopPropagation();
    });

    $scope.getPositionsLivraisons = function(chauffeur) {
      $scope.positionsLivraisons = angular.fromJson(apiDMSCARTO.loadPositionsLivraions(chauffeur));
      // .then(function(response) {
      angular.forEach($scope.positionsLivraisons, function(marker) {

      });
      // });

      function getImg(codeAno) {
        switch (codeAno) {
          case "LIVCFM":
            return '../../images/ICO/ico_liv_v.svg';
            break;
          case "RAMCFM":
            return '../../images/ICO/ico_ram_v.svg';
            break;
          default:
            return '../../images/ICO/ico_liv_a.svg';
        }
      }
    };

    // .then(function(response) {
    //   $scope.chauffeurs = response.data.chauffeur;
    //
    // });
  });
