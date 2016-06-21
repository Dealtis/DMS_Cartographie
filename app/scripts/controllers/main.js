'use strict';

/**
 * @ngdoc function
 * @name dmsCartoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dmsCartoApp
 */
angular.module('dmsCartoApp')
  .controller('MainCtrl', function($scope, $mdToast, apiDMSCARTO, uiGmapGoogleMapApi) {
    $scope.map = {
      center: {
        latitude: 45,
        longitude: -73
      },
      zoom: 8
    };
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
        $scope.homepos = new google.maps.LatLng(gpsSocPos[0], gpsSocPosLong[0]);
        loading_screen.finish();
      }, function errorCallback(response) {
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
          $scope.getPositionsLivraisons($scope.selectedChauffeur, $scope.cb1);
        }
        if ($scope.cb2) {
          $scope.getTrajetLivraison($scope.selectedChauffeur, $scope.cb2);
        }
      }
    })

    angular.element(document).find('input').on('keydown', function(ev) {
      ev.stopPropagation();
    });
    //POSTIONS LIVRAIONS
    $scope.getPositionsLivraisons = function(chauffeur, bool) {
      if (bool) {
        var prevpos;
        var currentpos;
        angular.fromJson(apiDMSCARTO.loadPositionsLivraions(chauffeur.SALCODE))
          .then(function(response) {
            if (response.data.length == 0) {              
                var toast = $mdToast.simple()
                  .textContent('Pas de données de livraisons')
                  .action('X')
                  .highlightAction(true)// Accent is used by default, this just demonstrates the usage.
                  .position('top right');
                $mdToast.show(toast).then(function(response) {
                  if (response == 'ok') {
                    alert('You clicked the \'UNDO\' action.');
                  }
                });
              console.log("Pas de données de livraisons");
            } else {
              var i = 1;
              var f = 1;
              angular.forEach(response.data, function(marker) {
                //if gps null mettre un toast
                if (marker.DMSPOSGPS == "") {
                  // var addmarker = {
                  //   showList: false,
                  //   showMap: false,
                  //   color: getClassColor(marker.DMSUIVICODEANO),
                  //   id: Date.now(),
                  //   infowindows: {
                  //     info: {
                  //       num: marker.DMSUIVIOTSNUM,
                  //       date: marker.DMSSUIVIANDSOFT,
                  //       grp: marker.DMSSUIVIVOYBDX,
                  //       codeano: marker.DMSUIVICODEANO,
                  //       memo: marker.DMSUIVIMEMO
                  //     }
                  //   }
                  // };
                  // $scope.markers.push(addmarker);
                  // i++;
                  console.log("Pas de donnée GPS " + marker.DMSUIVIOTSNUM);
                } else {
                  //traitement sur le format gps
                  var gpst = marker.DMSPOSGPS.replace(",", ".").replace(",", ".");
                  var markersplit = gpst.split(";");

                  if (f == 1) {
                    currentpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                    prevpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                    f++;
                  } else {
                    currentpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                    var dist = google.maps.geometry.spherical.computeDistanceBetween(currentpos, prevpos);
                    prevpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                  }
                  if (dist < 100) {
                    var addmarker = {
                      showList: false,
                      showMap: false,
                      color: getClassColor(marker.DMSUIVICODEANO),
                      id: Date.now(),
                      coords: {
                        latitude: markersplit[0],
                        longitude: markersplit[1]
                      },
                      options: {
                        visible: false,
                        enum: 3
                      },
                      infowindows: {
                        info: {
                          num: marker.DMSUIVIOTSNUM,
                          date: marker.DMSSUIVIANDSOFT,
                          grp: marker.DMSSUIVIVOYBDX,
                          codeano: marker.DMSUIVICODEANO,
                          memo: marker.DMSUIVIMEMO
                        }
                      }
                    };
                    console.log("<100");
                    $scope.markers.push(addmarker);

                    if ($scope.markers[i - 2].options.visible == false) {
                      var num = $scope.markers[i - 2].options.enum;
                      console.log(num);
                      $scope.markers[i - num].infowindows.info.num += " " + marker.DMSUIVIOTSNUM;
                      $scope.markers[i - 1].options.enum = num + 1;
                    } else {
                      $scope.markers[i - 2].options.icon.url = 'images/ICO/ico_liv_v_m.svg';
                      $scope.markers[i - 2].infowindows.info.num += " " + marker.DMSUIVIOTSNUM;
                    }



                  } else {
                    var addmarker = {
                      showList: true,
                      showMap: true,
                      color: getClassColor(marker.DMSUIVICODEANO),
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
                          num: marker.DMSUIVIOTSNUM,
                          date: marker.DMSSUIVIANDSOFT,
                          grp: marker.DMSSUIVIVOYBDX,
                          codeano: marker.DMSUIVICODEANO,
                          memo: marker.DMSUIVIMEMO
                        }
                      }
                    };
                    $scope.markers.push(addmarker);
                  }
                  $scope.boundsMarkers.extend(currentpos);
                  i++;
                }
              });
              $scope.boundsMarkers.extend($scope.homepos);
              $scope.bounds = {
                northeast: {
                  latitude: $scope.boundsMarkers.H.j,
                  longitude: $scope.boundsMarkers.j.H,
                },
                southwest: {
                  latitude: $scope.boundsMarkers.H.H,
                  longitude: $scope.boundsMarkers.j.j,
                }
              };
            }
          });
      } else {
        $scope.markers = [];
        $scope.boundsMarkers = new google.maps.LatLngBounds();
      }

      function getImg(codeAno) {
        switch (codeAno) {
          case "LIVCFM":
            return 'images/ICO/ico_liv_v.svg';
            break;
          case "RAMCFM":
            return 'images/ICO/ico_ram_v.svg';
            break;
          default:
            return 'images/ICO/ico_liv_a.svg';
        }
      }

      function getClassColor(codeAno) {
        switch (codeAno) {
          case "LIVCFM":
            return 'green';
            break;
          case "RAMCFM":
            return 'green';
            break;
          default:
            return 'red';
        }
      }
    };

    // POS GPS
    $scope.getTrajetLivraison = function(chauffeur, bool) {
      if (bool) {
        //loadPositionsGPS
        console.log(uiGmapGoogleMapApi.promiseStatus);
        angular.fromJson(apiDMSCARTO.loadPositionsGPS(chauffeur.SALCODE))
          .then(function(response) {
            angular.forEach(response.data, function(datagps) {
              var gpsSplit = datagps.DGPPOSITION.split("|");
              var posgpsSplit = [];
              for (var i = 0; i < gpsSplit.length; i++) {
                posgpsSplit.push(gpsSplit[i].replace(",", ".").replace(",", "."));
              }
              $scope.TrajetPath = [];
              angular.forEach(posgpsSplit, function(gps) {
                var gpsSplitSplit = gps.split(";");
                var addmarker = {
                  latitude: gpsSplitSplit[0],
                  longitude: gpsSplitSplit[1]
                }
                var itemBound = new google.maps.LatLng(gpsSplitSplit[0], gpsSplitSplit[1]);
                $scope.boundsMarkers.extend(itemBound);
                $scope.TrajetPath.push(addmarker);
              });
            });
            $scope.boundsMarkers.extend($scope.homepos);

            $scope.bounds = {
              northeast: {
                latitude: $scope.boundsMarkers.H.j,
                longitude: $scope.boundsMarkers.j.H,
              },
              southwest: {
                latitude: $scope.boundsMarkers.H.H,
                longitude: $scope.boundsMarkers.j.j,
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
      }
      //controller end
  });
