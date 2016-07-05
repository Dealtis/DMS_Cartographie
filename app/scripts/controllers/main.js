'use strict';

var LoadingScreen = window.pleaseWait({
  logo: 'images/ICO/ico_home.svg',
  backgroundColor: '#4CDEBA',
  loadingHtml: "<div class='sk-wave'><div class='sk-rect sk-rect1'></div><div class='sk-rect sk-rect2'></div><div class='sk-rect sk-rect3'></div><div class='sk-rect sk-rect4'></div><div class='sk-rect sk-rect5'></div></div>"
});
/**
 * @ngdoc function
 * @name dmsCartoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dmsCartoApp
 */
angular.module('dmsCartoApp')
  .controller('MainCtrl', function($scope, $mdToast, apiDMSCARTO) {
    $scope.map = {
      center: {
        latitude: 45,
        longitude: -73
      },
      zoom: 8
    };
    $scope.date = new Date();
    var addmarker;
    //init
    angular.fromJson(apiDMSCARTO.loadChauffeurs('24'))
      .then(function(response) {
        $scope.chauffeurs = response.data;
      });
    var gpsSocPos = [];
    var gpsSocPosLong = [];
    $scope.markers = [];
    $scope.TrajetPath = [];
    $scope.boundsMarkers = new google.maps.LatLngBounds();
    angular.fromJson(apiDMSCARTO.loadSocposition('24'))
      .then(function(response) {
        var socPosition = response.data;
        gpsSocPos = socPosition[0].SOCGOOGLEMAP.split(",");
        gpsSocPosLong = gpsSocPos[1].split("|");
        $scope.map = {
          center: {
            latitude: gpsSocPos[0],
            longitude: gpsSocPosLong[0]
          },
          zoom: 8,
          markerHome: {
            id: Date.now(),
            coords: {
              latitude: gpsSocPos[0],
              longitude: gpsSocPosLong[0]
            },
            options: {
              icon: {
                url: 'images/ICO/ico_home.svg'
              }
            }
          }
        };
        $scope.clusterOptions = {
          gridSize: 25,
          maxZoom: 15,
          styles: [{
            height: 100,
            url: "images/ICO/ico_liv_v_m.svg",
            width: 100
          }]
        }
        $scope.homepos = new google.maps.LatLng(gpsSocPos[0], gpsSocPosLong[0]);
        LoadingScreen.finish();
      }, function errorCallback(response) {
        console.log("error api" + response);
        $scope.map = {
          center: {
            latitude: 45,
            longitude: 6
          },
          zoom: 8
        };
      });


    $scope.clearSearchTerm = function() {
      $scope.searchTerm = '';
    };


    $scope.$watch('selectedChauffeur', function() {
      if ($scope.selectedChauffeur === null) {} else {
        //reset de la map
        $scope.markers = [];
        $scope.polylines = [];
        $scope.boundsMarkers = new google.maps.LatLngBounds();
        //si des checkbox sont cochés
        if ($scope.cb1) {
          $scope.getPositionsLivraisons($scope.selectedChauffeur, $scope.cb1, $scope.date);
        }
        if ($scope.cb2) {
          $scope.getTrajetLivraison($scope.selectedChauffeur, $scope.cb2);
        }
      }
    });

    angular.element(document).find('input').on('keydown', function(ev) {
      ev.stopPropagation();
    });
    //POSTIONS LIVRAIONS
    $scope.getPositionsLivraisons = function(chauffeur, bool, date) {
      try {
        if (bool) {
          $scope.markers = [];
          var prevpos;
          var currentpos;
          //foramt date
          function convertDate(inputFormat) {
            function pad(s) {
              return (s < 10) ? '0' + s : s;
            }
            var d = new Date(inputFormat);
            return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join('/');
          }
          var dateformat = convertDate(date);
          angular.fromJson(apiDMSCARTO.loadPositionsLivraions(chauffeur.SALCODE, dateformat))
            .then(function(response) {
              if (response.data.length === 0) {
                var toast = $mdToast.simple()
                  .textContent('Pas de données de livraisons')
                  .action('X')
                  .highlightAction(true) // Accent is used by default, this just demonstrates the usage.
                  .position('top right');
                $mdToast.show(toast).then(function() {});
                console.log("Pas de données de livraisons");
              } else {
                var i = 1;
                var f = 1;
                angular.forEach(response.data, function(marker) {
                  var dist;
                  if (marker.DMSPOSGPS === "") {
                    console.log("Pas de donnée GPS " + marker.DMSUIVIOTSNUM);
                  } else {
                    //traitement sur le format gps
                    var gpst = marker.DMSPOSGPS.replace(",", ".").replace(",", ".");
                    var markersplit = gpst.split(";");

                    if (f === 1) {
                      currentpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                      prevpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                      f++;
                    } else {
                      currentpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                      dist = google.maps.geometry.spherical.computeDistanceBetween(currentpos, prevpos);
                      prevpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                    }
                    addmarker = {
                      showList: true,
                      showMap: true,
                      color: getClassColor(marker.DMSUIVICODEANO, marker.DMSSUIVIANDSOFT),
                      id: Date.now(),
                      coords: {
                        latitude: markersplit[0],
                        longitude: markersplit[1]
                      },
                      options: {
                        icon: {
                          url: getImg(marker.DMSUIVICODEANO)
                        },
                        animation: google.maps.Animation.DROP,
                        labelClass: 'labels',
                        labelAnchor: '6 35',
                        labelContent: '<p>' + i + '</p>',
                      },
                      infowindows: {
                        info: {
                          data: "<h4>" + marker.DMSUIVIOTSNUM + "</h4><p>" + getTime(marker.DMSSUIVIANDSOFT) + " " + marker.DMSUIVICODEANO + "</p><p>" + marker.DMSUIVIMEMO + "</p>",
                          num: marker.DMSUIVIOTSNUM,
                          ico: getIco(marker.DMSUIVICODEANO)
                        }
                      }
                    };
                    $scope.markers.push(addmarker);
                    $scope.boundsMarkers.extend(currentpos);
                    i++;
                    sleep(1);
                  }
                });
                //$scope.boundsMarkers.extend($scope.homepos);
                $scope.bounds = {
                  northeast: {
                    latitude: $scope.boundsMarkers.f.b,
                    longitude: $scope.boundsMarkers.b.f,
                  },
                  southwest: {
                    latitude: $scope.boundsMarkers.f.f,
                    longitude: $scope.boundsMarkers.b.b,
                  }
                };
              }
            });
        } else {
          $scope.markers = [];
          $scope.boundsMarkers = new google.maps.LatLngBounds();
        }
      } catch (e) {
        console.log(e);
      }

      function getImg(codeAno) {
        var output;
        switch (codeAno) {
          case "LIVCFM":
            output = 'images/ICO/ico_liv_v.svg';
            break;
          case "RAMCFM":
            output = 'images/ICO/ico_ram_v.svg';
            break;
          default:
            output = 'images/ICO/ico_liv_a.svg';
        }
        return output;
      }
      function getTime(date) {
        var part = date.split(' ');
        var partstime = part[1].split(':');
        return partstime[0]+":"+partstime[1];
      }

      function getClassColor(codeAno, date) {
        var output;
        var part = date.split(' ');
        var parts = part[0].split('/');
        var partstime = part[1].split(':');
        var mydate = new Date(parts[2], parts[0], parts[1] - 1, partstime[0], partstime[1], partstime[2]);

        var today = new Date();
        var diff = Math.abs(today - mydate);
        var minutes = Math.floor((diff / 1000) / 60);
        if (minutes > 30) {
          switch (codeAno) {
            case "LIVCFM":
              output = 'green';
              break;
            case "RAMCFM":
              output = 'green';
              break;
            case "pack":
              output = 'purple';
              break;
            default:
              output = 'red';
          }
        } else {
          switch (codeAno) {
            case "LIVCFM":
              output = 'green underline';
              break;
            case "RAMCFM":
              output = 'green underline';
              break;
            case "pack":
              output = 'purple underline';
              break;
            default:
              output = 'red underline';
          }
        }



        return output;
      }

      function getIco(codeAno) {
        var output;
        switch (codeAno) {
          case "LIVCFM":
            output = '<i class="fa fa-check" aria-hidden="true"></i> ';
            break;
          case "RAMCFM":
            output = '<i class="fa fa-check" aria-hidden="true"></i> ';
            break;
          case "pack":
            output = '<i class="fa fa-suitcase" aria-hidden="true"></i> ';
            break;
          case "nogps":
            output = '<i class="fa fa-map" aria-hidden="true"></i> ';
            break;
          default:
            output = '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i> ';
        }
        return output;
      }

      function sleep(delay) {
        var start = new Date().getTime();
        while (new Date().getTime() < start + delay);
      }
    };

    // POS GPS
    $scope.getTrajetLivraison = function(chauffeur, bool) {
      if (bool) {
        //loadPositionsGPS
        angular.fromJson(apiDMSCARTO.loadPositionsGPS(chauffeur.SALCODE))
          .then(function(response) {
            angular.forEach(response.data, function(datagps) {
              var gpsSplit = datagps.DGPPOSITION.split("|");
              var posgpsSplit = [];
              for (var j = 0; j < gpsSplit.length; j++) {
                posgpsSplit.push(gpsSplit[j].replace(",", ".").replace(",", "."));
              }
              $scope.TrajetPath = [];
              angular.forEach(posgpsSplit, function(gps) {
                var gpsSplitSplit = gps.split(";");
                addmarker = {
                  latitude: gpsSplitSplit[0],
                  longitude: gpsSplitSplit[1]
                };
                var itemBound = new google.maps.LatLng(gpsSplitSplit[0], gpsSplitSplit[1]);
                $scope.boundsMarkers.extend(itemBound);
                $scope.TrajetPath.push(addmarker);
              });
            });
            //$scope.boundsMarkers.extend($scope.homepos);

            $scope.bounds = {
              northeast: {
                latitude: $scope.boundsMarkers.f.b,
                longitude: $scope.boundsMarkers.b.f,
              },
              southwest: {
                latitude: $scope.boundsMarkers.f.f,
                longitude: $scope.boundsMarkers.b.b,
              }
            };

            $scope.polylines = [{
              id: 1,
              path: $scope.TrajetPath,
              stroke: {
                color: '#6060FB',
                weight: 2.5
              },
              editable: false,
              draggable: false,
              geodesic: false,
              visible: true,
              icons: [{
                icon: {
                  path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW
                },
                offset: '25px',
                repeat: '200px'
              }]
            }];
          });
      } else {
        $scope.polylines = [];
        $scope.boundsMarkers = new google.maps.LatLngBounds();
      }
    };
    $scope.test = function(id) {
      $scope.accordion.toggle(id);
      $scope.$apply();
    };
    //controller end
  });
