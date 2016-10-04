'use strict';


/**
 * @ngdoc function
 * @name dmsCartoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dmsCartoApp
 */
angular.module('dmsCartoApp')
  .controller('MainCtrl', function($scope, $mdToast, apiDMSCARTO, $cookies) {
    $scope.splashscreen = "<div class='sk-wave'><div class='sk-rect sk-rect1'></div><div class='sk-rect sk-rect2'></div><div class='sk-rect sk-rect3'></div><div class='sk-rect sk-rect4'></div><div class='sk-rect sk-rect5'></div></div>";


    // if ($cookies.get('SOCID') == undefined) {
    //   $scope.splashscreen = "Merci de vous connecter à Andsoft";
    //   var LoadingScreen = window.pleaseWait({
    //     logo: 'images/ICO/ico_home.svg',
    //     backgroundColor: '#4CDEBA',
    //     loadingHtml: $scope.splashscreen
    //   });
    //
    //   throw console.error("Pas de soc ID");
    // }

    var LoadingScreen = window.pleaseWait({
      logo: 'images/ICO/ico_home.svg',
      backgroundColor: '#4CDEBA',
      loadingHtml: $scope.splashscreen
    });

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
    angular.fromJson(apiDMSCARTO.loadChauffeurs('3'))
      .then(function(response) {
        $scope.chauffeurs = response.data;
      });
    var gpsSocPos = [];
    var gpsSocPosLong = [];
    $scope.markers = [];
    $scope.TrajetPath = [];
    $scope.boundsMarkers = new google.maps.LatLngBounds();
    angular.fromJson(apiDMSCARTO.loadSocposition('3'))
      .then(function(response) {
        var socPosition = response.data;
        gpsSocPos = socPosition[0].SOCGOOGLEMAP.split(",");
        gpsSocPosLong = gpsSocPos[1].split("|");
        $scope.map = {
          center: {
            latitude: gpsSocPos[0],
            longitude: gpsSocPosLong[0]
          },
          events: $scope.events,
          zoom: 8,
          control: {},
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
          gridSize: 20,
          maxZoom: 15,
          styles: [{
            height: 75,
            url: "images/ICO/ico_liv_v_m.svg",
            width: 75
          }]
        }
        $scope.homepos = new google.maps.LatLng(gpsSocPos[0], gpsSocPosLong[0]);
        LoadingScreen.finish();
      }, function errorCallback(response) {
        console.log("error api");
        console.log(response);
        $scope.map = {
          center: {
            latitude: 45,
            longitude: 6
          },
          zoom: 8
        };
      });

    $scope.setCenter = function(bool, coods) {
      if (bool) {
        // $scope.map.center = {
        //   latitude: coods.latitude,
        //   longitude: coods.longitude
        // };
        // $scope.map.panTo = {
        //   lat: coods.latitude,
        //   lng: coods.longitude
        // };
        // $scope.map.panTo(new google.maps.LatLng({
        //   lat: -34,
        //   lng: 151
        // }));
        $scope.map.panTo(new google.maps.LatLng(-34, 151));

        console.log(coods.latitude);
        console.log(coods.longitude);
        //$scope.map.zoom = 18;
      }
    }

    $scope.clearSearchTerm = function() {
      $scope.searchTerm = '';
    };


    $scope.$watch('selectedChauffeur', function() {
      if ($scope.selectedChauffeur === undefined) {} else {
        //reset de la map
        $scope.markers = [];
        $scope.polylines = [];
        $scope.boundsMarkers = new google.maps.LatLngBounds();

        $scope.getLastPos($scope.selectedChauffeur, $scope.date);
        //si des checkbox sont cochés
        if ($scope.cb1) {
          $scope.getPositionsLivraisons($scope.selectedChauffeur, $scope.cb1, $scope.date);
        }
        if ($scope.cb2) {
          $scope.getTrajetLivraison($scope.selectedChauffeur, $scope.cb2);
        }
        if ($scope.cb3) {
          $scope.getLastPosOther($scope.selectedChauffeur, $scope.cb3);
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
                var diff = dateDiff(date, Date.now());
                if (diff.day == 0) {
                  predictPos($scope.markers);
                }
              } else {
                // var i = 1;
                // var f = 1;
                angular.forEach(response.data, function(marker) {
                  var dist;
                  if (marker.DMSPOSGPS === "") {
                    console.log("Pas de donnée GPS " + marker.DMSUIVIOTSNUM);
                  } else {
                    //traitement sur le format gps
                    var gpst = marker.DMSPOSGPS.replace(",", ".").replace(",", ".");
                    var markersplit = gpst.split(";");

                    addmarker = {
                      showList: true,
                      showMap: true,
                      numpos: marker.DMSUIVIOTSNUM,
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
                        labelContent: '<p></p>',
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
                    currentpos = new google.maps.LatLng(markersplit[0], markersplit[1]);
                    $scope.boundsMarkers.extend(currentpos);
                    // i++;
                    sleep(0.5);
                    //$scope.$apply();
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
                var diff = dateDiff(date, Date.now());
                if (diff.day == 0) {
                  predictPos($scope.markers);
                }
              }
            });
        } else {
          $scope.markers = [];
          $scope.boundsMarkers = new google.maps.LatLngBounds();
        }
      } catch (e) {
        console.log(e);
      }

      function dateDiff(date1, date2) {
        var diff = {} // Initialisation du retour
        var tmp = date2 - date1;

        tmp = Math.floor(tmp / 1000); // Nombre de secondes entre les 2 dates
        diff.sec = tmp % 60; // Extraction du nombre de secondes

        tmp = Math.floor((tmp - diff.sec) / 60); // Nombre de minutes (partie entière)
        diff.min = tmp % 60; // Extraction du nombre de minutes

        tmp = Math.floor((tmp - diff.min) / 60); // Nombre d'heures (entières)
        diff.hour = tmp % 24; // Extraction du nombre d'heures

        tmp = Math.floor((tmp - diff.hour) / 24); // Nombre de jours restants
        diff.day = tmp;

        return diff;
      }

      function predictPos(listeMarkers) {
        $scope.loading = true;
        angular.fromJson(apiDMSCARTO.loadInfosGrp(chauffeur.SALCODE))
          .then(function(response) {
            angular.forEach(response.data, function(pos) {
              var schpos = _.find(listeMarkers, {
                'numpos': pos.OTPOTSNUM
              });
              if (schpos == undefined) {
                //req api maps
                angular.fromJson(apiDMSCARTO.getGeocode(pos.OTPARRNOM, pos.OTPARRADR1, pos.OTPARRUSRVILCP, pos.OTPARRUSRVILLIB))

                .then(function(response) {

                  if (response.data.results[0] != undefined) {
                    addmarker = {
                      showList: true,
                      showMap: true,
                      color: 'blue',
                      id: Date.now(),
                      coords: {
                        latitude: response.data.results[0].geometry.location.lat,
                        longitude: response.data.results[0].geometry.location.lng
                      },
                      options: {
                        icon: {
                          url: 'images/ICO/ico_pre.svg'
                        },
                        animation: google.maps.Animation.DROP,
                        labelClass: 'labels',
                        labelAnchor: '6 35',
                        labelContent: '<p></p>',
                      },
                      infowindows: {
                        info: {
                          data: "<h4>" + pos.OTPOTSNUM + "</h4>",
                          num: pos.OTPOTSNUM,
                          ico: '<i class="fa fa-info" aria-hidden="true"></i> '
                        }
                      }
                    };
                    $scope.markers.push(addmarker);

                    currentpos = new google.maps.LatLng(response.data.results[0].geometry.location.lat, response.data.results[0].geometry.location.lng);
                    $scope.boundsMarkers.extend(currentpos);
                    sleep(0.5);


                  } else {
                    //   console.log("C'EST BEAU");
                    //   addmarker = {
                    //     showList: true,
                    //     showMap: false,
                    //     color: 'blue',
                    //     id: Date.now(),
                    //     coords: {
                    //       latitude: '0',
                    //       longitude: '0'
                    //     },
                    //     options: {
                    //       icon: {
                    //         url: 'images/ICO/ico_pre.svg'
                    //       },
                    //       animation: google.maps.Animation.DROP,
                    //       labelClass: 'labels',
                    //       labelAnchor: '6 35',
                    //       labelContent: '<p></p>',
                    //     },
                    //     infowindows: {
                    //       info: {
                    //         data: "<h4>" + pos.OTPOTSNUM + "</h4>",
                    //         num: pos.OTPOTSNUM,
                    //         ico: '<i class="fa fa-info" aria-hidden="true"></i> '
                    //       }
                    //     }
                    //   };
                    //   $scope.markers.push(addmarker);
                    //   sleep(0.5);
                  }
                });
              }

            });
            $scope.loading = false;
            $scope.recadre();
          });
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
        try {
          var part = date.split(' ');
          var partstime = part[1].split(':');
          return partstime[0] + ":" + partstime[1];

        } catch (e) {
          return "#error";
        }
      }

      function getClassColor(codeAno, date) {
        var output;
        // var part = date.split(' ');
        // var parts = part[0].split('/');
        // var partstime = part[1].split(':');
        // var mydate = new Date(parts[2], parts[0], parts[1] - 1, partstime[0], partstime[1], partstime[2]);
        //
        // var today = new Date();
        // var diff = Math.abs(today - mydate);
        // var minutes = Math.floor((diff / 1000) / 60);
        // if (minutes > 30) {
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
        // } else {
        //   switch (codeAno) {
        //     case "LIVCFM":
        //       output = 'green underline';
        //       break;
        //     case "RAMCFM":
        //       output = 'green underline';
        //       break;
        //     case "pack":
        //       output = 'purple underline';
        //       break;
        //     default:
        //       output = 'red underline';
        //   }
        // }



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
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
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

    $scope.getLastPos = function(chauffeur) {
      angular.fromJson(apiDMSCARTO.loadLastPos(chauffeur.SALCODE))
        .then(function(response) {
          angular.forEach(response.data, function(datagps) {
            var posGps = datagps.DGPDERNIEREPOS.replace(",", ".").replace(",", ".");
            $scope.lastPosChauff = [];
            var gpsSplitSplit = posGps.split(";");
            addmarker = {
              latitude: gpsSplitSplit[0],
              longitude: gpsSplitSplit[1]
            };
            var itemBound = new google.maps.LatLng(gpsSplitSplit[0], gpsSplitSplit[1]);
            $scope.boundsMarkers.extend(itemBound);
            $scope.lastPosChauff.push(addmarker);
          });
          $scope.boundsMarkers.extend($scope.homepos);

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
          console.log($scope.lastPosChauff[0]);

          $scope.map.lastPos = {
            coords: $scope.lastPosChauff,
            options: {
              icon: {
                url: 'images/ICO/ico_truck.svg'
              }
            }
          };
        });
    }

    $scope.getLastPosOther = function(selectedChauffeur, bool) {
      $scope.otherLastPos = [];
      if (bool) {
        var chauffeurs = "";
        angular.forEach($scope.chauffeurs, function(chauffeur) {
          chauffeurs = chauffeurs + ",%27" + chauffeur.SALCODE + "%27";
        });
        angular.fromJson(apiDMSCARTO.loadLastPosOther(selectedChauffeur.SALCODE, chauffeurs.substring(1)))
          .then(function(response) {
            angular.forEach(response.data, function(poschauffeur) {
              var posGps = poschauffeur.DGPDERNIEREPOS.replace(",", ".").replace(",", ".");
              var gpsSplitSplit = posGps.split(";");
              addmarker = {
                id: Date.now(),
                chauffeur: poschauffeur.DGPCOND,
                coords: {
                  latitude: gpsSplitSplit[0],
                  longitude: gpsSplitSplit[1]
                },
                options: {
                  icon: {
                    url: 'images/ICO/ico_truck_other.svg'
                  },
                  labelClass: 'labels',
                  labelAnchor: '18 40',
                  labelContent: poschauffeur.DGPCOND
                }
              };
              var itemBound = new google.maps.LatLng(gpsSplitSplit[0], gpsSplitSplit[1]);
              $scope.boundsMarkers.extend(itemBound);
              $scope.otherLastPos.push(addmarker);

            })
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
          });
      }
    }

    $scope.recadre = function() {
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
    };

    $scope.refresh = function() {
        if ($scope.selectedChauffeur === undefined) {} else {
          //reset de la map
          $scope.markers = [];
          $scope.polylines = [];
          $scope.boundsMarkers = new google.maps.LatLngBounds();

          $scope.getLastPos($scope.selectedChauffeur, $scope.date);
          //si des checkbox sont cochés
          if ($scope.cb1) {
            $scope.getPositionsLivraisons($scope.selectedChauffeur, $scope.cb1, $scope.date);
          }
          if ($scope.cb2) {
            $scope.getTrajetLivraison($scope.selectedChauffeur, $scope.cb2);
          }
          if ($scope.cb3) {
            $scope.getLastPosOther($scope.selectedChauffeur, $scope.cb3);
          }
        }
      }
      //controller end
  });
