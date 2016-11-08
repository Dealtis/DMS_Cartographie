'use strict';


/**
 * @ngdoc function
 * @name dmsCartoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dmsCartoApp
 */
angular.module('dmsCartoApp')
  .controller('MainCtrl', function($scope, $mdToast, uiGmapGoogleMapApi, $q, $interval, $location, $mdDialog, apiDMSCARTO, $cookies) {
    $scope.splashscreen = "<div class='sk-wave'><div class='sk-rect sk-rect1'></div><div class='sk-rect sk-rect2'></div><div class='sk-rect sk-rect3'></div><div class='sk-rect sk-rect4'></div><div class='sk-rect sk-rect5'></div></div>";

    // // //TODO
    // if ($cookies.get('SOCID') == undefined) {
    //   $scope.splashscreen = "Merci de vous connecter à Andsoft";
    //   var LoadingScreen = window.pleaseWait({
    //     logo: 'images/ICO/ico_home.svg',
    //     backgroundColor: '#4CDEBA',
    //     loadingHtml: $scope.splashscreen
    //   });
    //   throw console.error("Pas de soc ID");
    // }

    var LoadingScreen = window.pleaseWait({
      logo: 'images/ICO/ico_home.svg',
      backgroundColor: '#26c6da',
      loadingHtml: $scope.splashscreen
    });

    //init
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
    angular.fromJson(apiDMSCARTO.loadChauffeurs('16'))
      .then(function(response) {
        $scope.chauffeurs = response.data;
      });
    var gpsSocPos = [];
    var gpsSocPosLong = [];
    $scope.markers = [];
    $scope.markersRam = [];
    $scope.boxesRight = [];
    $scope.otherLastPos = [];
    $scope.TrajetPath = [];
    $scope.loadingPrdict = false;
    $scope.boundsMarkers = new google.maps.LatLngBounds();
    angular.fromJson(apiDMSCARTO.loadSocposition('16'))
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
          markersControl: {},
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
        $scope.clusterChauffeurOptions = {
          gridSize: 20,
          maxZoom: 15,
          styles: [{
            height: 75,
            url: "images/ICO/ico_truck_other.svg",
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
        $scope.map.panTo(new google.maps.LatLng(-34, 151));
      }
    }

    $scope.clearSearchTerm = function() {
      $scope.searchTerm = '';
    };

    //watcher selectedChauffeur
    $scope.$watch('selectedChauffeur', function() {
      if ($scope.selectedChauffeur === undefined) {} else {
        //reset de la map
        $scope.markers = [];
        $scope.boxesRight = [];
        $scope.polylines = [];
        $scope.boundsMarkers = new google.maps.LatLngBounds();

        $scope.getLastPos($scope.selectedChauffeur, $scope.date);
        $scope.setInfoTournee($scope.selectedChauffeur, $scope.date);
        //si des checkbox sont cochés
        if ($scope.cb1) {
          $scope.getPositionsLivraisons($scope.selectedChauffeur, $scope.cb1, $scope.date);
        }
        if ($scope.cb2) {
          $scope.getTrajetLivraison($scope.selectedChauffeur, $scope.cb2, $scope.date);
        }
        if ($scope.cb3) {
          $scope.getLastPosOther($scope.selectedChauffeur, $scope.cb3);
        }
      }
    });

    $scope.dateChange = function() {
      if ($scope.selectedChauffeur === undefined) {} else {
        //reset de la map
        $scope.markers = [];
        $scope.markersRam = [];
        $scope.boxesRight = [];
        $scope.polylines = [];
        $scope.boundsMarkers = new google.maps.LatLngBounds();

        $scope.getLastPos($scope.selectedChauffeur, $scope.date);
        //si des checkbox sont cochés
        if ($scope.cb1) {
          $scope.getPositionsLivraisons($scope.selectedChauffeur, $scope.cb1, $scope.date);
        }
        if ($scope.cb4) {
          $scope.getPositionsRamasses($scope.selectedChauffeur, $scope.cb4, $scope.date);
        }
        if ($scope.cb2) {
          $scope.getTrajetLivraison($scope.selectedChauffeur, $scope.cb2, $scope.date);
        }
        if ($scope.cb3) {
          $scope.getLastPosOther($scope.selectedChauffeur, $scope.cb3);
        }
      }
    }

    angular.element(document).find('input').on('keydown', function(ev) {
      ev.stopPropagation();
    });

    //get Livraisons du chauffeur
    $scope.getPositionsLivraisons = function(chauffeur, bool, date) {
      $scope.markers = [];
      $scope.positions = [];
      try {
        if (bool) {
          $scope.boxesGauge = [];
          var dateformat = convertDate(date);
          console.log(chauffeur.SALCODE.substring(1, chauffeur.SALCODE.length));
          $scope.loading = angular.fromJson(apiDMSCARTO.loadPositionsLivraions((chauffeur.SALCODE.substring(1, chauffeur.SALCODE.length)).substring(0, 7), dateformat))
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
                  //predictPos($scope.markers);
                }
              } else {
                angular.forEach(response.data, function(pos) {
                  if (pos.POSGPS === "") {
                    console.log("Pas de donnée GPS " + pos.NUM);
                  } else {
                    //traitement sur le format gps
                    console.log(pos.CODEANO);
                    if (pos.CODEANO != "PARTIC") {
                      var gpst = pos.POSGPS.replace(",", ".").replace(",", ".");
                      var markersplit = gpst.split(";");
                      var heureSplit = pos.DATESUIVI.split(" ");
                      var position = {
                        id: pos.ID,
                        numpos: pos.NUM,
                        coords: {
                          latitude: markersplit[0],
                          longitude: markersplit[1]
                        },
                        design: {
                          color: getClassColor(pos.CODEANO),
                          ico: getIco(pos.CODEANO)
                        },
                        options: {
                          icon: {
                            url: getImg(pos.CODEANO)
                          },
                          labelContent: heureSplit[1],
                          labelAnchor: '20 40',
                          labelClass: "labels"
                        },
                        info: {
                          codeano: pos.CODEANO,
                          libano: pos.LIBANO,
                          memo: pos.MEMO,
                          datesuivi: pos.DATESUIVI,
                          livnom: pos.LIVNOM,
                          nomclient: pos.NOMCLIENT,
                          expnom: pos.EXPNOM,
                          micode: pos.MICODE,
                          voydbx: pos.VOYBDX,
                          livadr: pos.LIVADR,
                          livcp: pos.LIVVILCP,
                          livville: pos.LIVVILLIB,
                          expadr: pos.EXPADR,
                          expcp: pos.EXPVILCP,
                          expville: pos.EXPVILLIB
                        }
                      };
                      $scope.positions.push(position);
                      $scope.boundsMarkers.extend(new google.maps.LatLng(markersplit[0], markersplit[1]));
                    }
                  }
                });
                $scope.positions.forEach(function(pos) {
                  var find;
                  if (pos.micode == "L") {
                    find = _.find(boxRight, {
                      'title': pos.info.livnom
                    });
                    pos.data = pos.info.expnom + ", " + pos.info.expadr + pos.info.expcp + " " + pos.info.expville;
                    traitBox(box, pos.info.livnom);
                    pos.idClick = pos.info.livnom;
                    $scope.markers.push(pos);
                  } else {
                    find = _.find($scope.boxesRight, {
                      'title': pos.info.expnom
                    });
                    pos.idClick = pos.info.expnom;
                    pos.data = pos.info.livnom + ", " + pos.info.livadr + pos.info.livcp + " " + pos.info.livville;
                    traitBox(find, pos.info.expnom);
                  }

                  function traitBox(find, title) {
                    if (find == undefined) {
                      var newbox = {
                        id: Date.now(),
                        title: title,
                        positions: []
                      }
                      newbox.positions.push(pos);
                      $scope.boxesRight.push(newbox);
                    } else {
                      find.positions.push(pos);
                    }
                  }
                  $scope.markers.push(pos);
                });

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
                  //predictPos($scope.markers);
                }
              }
            });
        } else {
          $scope.markers = [];
          $scope.boxesRight = [];
          $scope.boundsMarkers = new google.maps.LatLngBounds();
          if ($scope.cb3) {
            $scope.getLastPosOther($scope.selectedChauffeur,true)
          }
        }
      } catch (e) {
        console.log(e);
      }

      function predictPos(listeMarkers) {
        $scope.loadingPrdict = true;
        angular.fromJson(apiDMSCARTO.loadInfoPos(chauffeur.SALCODE))
          .then(function(response) {
            angular.forEach(response.data, function(pos) {
              var schpos = _.find(listeMarkers, {
                'numpos': pos.OTPOTSNUM
              });
              if (schpos == undefined) {
                //req api maps
                if (pos.OTPTRSCODE == "LIV") {
                  dataGeocode(pos.OTPARRNOM, pos.OTPARRADR1, pos.OTPARRUSRVILCP, pos.OTPARRUSRVILLIB);
                } else {
                  dataGeocode(pos.OTPDEPNOM, pos.OTPDEPADR1, pos.OTPDEPUSRVILCP, pos.OTPDEPUSRVILLIB);
                }

                function dataGeocode(nom, adr, cp, ville) {
                  angular.fromJson(apiDMSCARTO.getGeocode(nom, adr, cp, ville))
                    .then(function(response) {
                      if (nom == "") {
                        nom = "Inconnu";
                      }
                      if (response.data.results[0] != undefined) {
                        var position = {
                          id: pos.OTPID,
                          numpos: pos.OTPOTSNUM,
                          coords: {
                            latitude: response.data.results[0].geometry.location.lat,
                            longitude: response.data.results[0].geometry.location.lng
                          },
                          design: {
                            color: "blue",
                            ico: getIco(pos.CODEANO)
                          },
                          options: {
                            icon: {
                              url: "images/ICO/ico_pre.svg"
                            },
                            //animation: google.maps.Animation.DROP
                          },
                          info: {
                            nom: nom,
                            adr: adr,
                            cp: cp,
                            ville: ville
                          }
                        }

                        $scope.boundsMarkers.extend(new google.maps.LatLng(response.data.results[0].geometry.location.lat, response.data.results[0].geometry.location.lng));

                        position.idClick = nom;
                        pos.data = nom + ", " + adr + cp + " " + ville;
                        $scope.markers.push(position);

                        var find = _.find($scope.boxRight, {
                          'title': nom
                        });
                        if (find == undefined) {
                          var newbox = {
                            id: Date.now(),
                            title: nom,
                            positions: []
                          }
                          newbox.positions.push(pos);
                          $scope.boxesRight.push(newbox);
                        } else {
                          find.positions.push(pos);
                        }
                      }
                    });
                }
              }
            });
            $scope.loadingPrdict = false;
            $scope.recadre();
          });
      }
    };

    //get Ramasses du chauffeur
    $scope.getPositionsRamasses = function(chauffeur, bool, date) {
      $scope.markersRam = [];
      $scope.positions = [];
      try {
        if (bool) {
          $scope.boxesGauge = [];
          var dateformat = convertDate(date);
          console.log(chauffeur.SALCODE.substring(1, chauffeur.SALCODE.length));
          $scope.loading = angular.fromJson(apiDMSCARTO.loadPositionsRamasses(chauffeur.SALCODE.substring(1, chauffeur.SALCODE.length), dateformat))
            .then(function(response) {
              if (response.data.length === 0) {
                var toast = $mdToast.simple()
                  .textContent('Pas de données de ramasses')
                  .action('X')
                  .highlightAction(true) // Accent is used by default, this just demonstrates the usage.
                  .position('top right');
                $mdToast.show(toast).then(function() {});
                console.log("Pas de données de ramasses");
                var diff = dateDiff(date, Date.now());
                if (diff.day == 0) {
                  //predictPos($scope.markers);
                }
              } else {
                angular.forEach(response.data, function(pos) {
                  if (pos.POSGPS === "") {
                    console.log("Pas de donnée GPS " + pos.NUM);
                  } else {
                    //traitement sur le format gps
                    var gpst = pos.POSGPS.replace(",", ".").replace(",", ".");
                    var markersplit = gpst.split(";");

                    var position = {
                      id: pos.ID,
                      numpos: pos.NUM,
                      coords: {
                        latitude: markersplit[0],
                        longitude: markersplit[1]
                      },
                      design: {
                        color: getClassColor(pos.CODEANO),
                        ico: getIco(pos.CODEANO)
                      },
                      options: {
                        icon: {
                          url: getImg(pos.CODEANO)
                        },
                        // animation: google.maps.Animation.DROP,
                      },
                      info: {
                        codeano: pos.CODEANO,
                        libano: pos.LIBANO,
                        memo: pos.MEMO,
                        datesuivi: pos.DATESUIVI,
                        livnom: pos.LIVNOM,
                        nomclient: pos.NOMCLIENT,
                        expnom: pos.EXPNOM,
                        micode: pos.MICODE,
                        voydbx: pos.VOYBDX,
                        livadr: pos.LIVADR,
                        livcp: pos.LIVVILCP,
                        livville: pos.LIVVILLIB,
                        expadr: pos.EXPADR,
                        expcp: pos.EXPVILCP,
                        expville: pos.EXPVILLIB
                      }
                    };

                    $scope.positions.push(position);
                    $scope.boundsMarkers.extend(new google.maps.LatLng(markersplit[0], markersplit[1]));
                  }
                });
                $scope.positions.forEach(function(pos) {
                  var find;
                  if (pos.micode == "L") {
                    find = _.find(boxRight, {
                      'title': pos.info.nomclient
                    });
                    pos.data = pos.info.expnom + ", " + pos.info.expadr + pos.info.expcp + " " + pos.info.expville;
                    traitBox(box, pos.info.nomclient);
                    pos.idClick = pos.info.nomclient;
                    $scope.markersRam.push(pos);
                  } else {
                    find = _.find($scope.boxesRight, {
                      'title': pos.info.nomclient
                    });
                    pos.idClick = pos.info.nomclient;
                    pos.subtitle = pos.info.livville;
                    pos.data = pos.info.livnom + ", " + pos.info.livadr + pos.info.livcp + " " + pos.info.livville;
                    traitBox(find, pos.info.nomclient);
                  }

                  function traitBox(find, title) {
                    if (find == undefined) {
                      var newbox = {
                        id: Date.now(),
                        title: title,
                        positions: []
                      }
                      newbox.positions.push(pos);
                      $scope.boxesRight.push(newbox);
                    } else {
                      find.positions.push(pos);
                    }
                  }
                  $scope.markersRam.push(pos);
                });

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
                  //predictPos($scope.markers);
                }
              }
            });
        } else {
          $scope.markersRam = [];
          $scope.boxesRight = [];
          $scope.boundsMarkers = new google.maps.LatLngBounds();
        }
      } catch (e) {
        console.log(e);
      }

      function predictPos(listeMarkers) {
        $scope.loadingPrdict = true;
        angular.fromJson(apiDMSCARTO.loadInfoPos(chauffeur.SALCODE))
          .then(function(response) {
            angular.forEach(response.data, function(pos) {
              var schpos = _.find(listeMarkers, {
                'numpos': pos.OTPOTSNUM
              });
              if (schpos == undefined) {
                //req api maps
                if (pos.OTPTRSCODE == "LIV") {
                  dataGeocode(pos.OTPARRNOM, pos.OTPARRADR1, pos.OTPARRUSRVILCP, pos.OTPARRUSRVILLIB);
                } else {
                  dataGeocode(pos.OTPDEPNOM, pos.OTPDEPADR1, pos.OTPDEPUSRVILCP, pos.OTPDEPUSRVILLIB);
                }

                function dataGeocode(nom, adr, cp, ville) {
                  angular.fromJson(apiDMSCARTO.getGeocode(nom, adr, cp, ville))
                    .then(function(response) {
                      if (nom == "") {
                        nom = "Inconnu";
                      }
                      if (response.data.results[0] != undefined) {
                        var position = {
                          id: pos.OTPID,
                          numpos: pos.OTPOTSNUM,
                          coords: {
                            latitude: response.data.results[0].geometry.location.lat,
                            longitude: response.data.results[0].geometry.location.lng
                          },
                          design: {
                            color: "blue",
                            ico: getIco(pos.CODEANO)
                          },
                          options: {
                            icon: {
                              url: "images/ICO/ico_pre.svg"
                            },
                            //animation: google.maps.Animation.DROP
                          },
                          info: {
                            nom: nom,
                            adr: adr,
                            cp: cp,
                            ville: ville
                          }
                        }

                        $scope.boundsMarkers.extend(new google.maps.LatLng(response.data.results[0].geometry.location.lat, response.data.results[0].geometry.location.lng));

                        position.idClick = nom;
                        pos.data = nom + ", " + adr + cp + " " + ville;
                        $scope.markers.push(position);

                        var find = _.find($scope.boxRight, {
                          'title': nom
                        });
                        if (find == undefined) {
                          var newbox = {
                            id: Date.now(),
                            title: nom,
                            positions: []
                          }
                          newbox.positions.push(pos);
                          $scope.boxesRight.push(newbox);
                        } else {
                          find.positions.push(pos);
                        }
                      }
                    });
                }
              }
            });
            $scope.loadingPrdict = false;
            $scope.recadre();
          });
      }
    };

    //get Trajet du chauffeur
    $scope.getTrajetLivraison = function(chauffeur, bool, date) {
      if (bool) {
        var dateformat = convertDate(date);
        //loadPositionsGPS
        $scope.loading = angular.fromJson(apiDMSCARTO.loadPositionsGPS(chauffeur.SALCODE, dateformat))
          .then(function(response) {
            angular.forEach(response.data, function(datagps) {
              var gpsSplit = datagps.DGPPOSITION.split("|");
              var posgpsSplit = [];
              for (var j = 0; j < gpsSplit.length; j++) {
                if (gpsSplit[j] != "") {
                  posgpsSplit.push(gpsSplit[j].replace(",", ".").replace(",", "."));
                }
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

    //get dernière position du chauffeur
    $scope.getLastPos = function(chauffeur) {
      $scope.loading = angular.fromJson(apiDMSCARTO.loadLastPos(chauffeur.SALCODE))
        .then(function(response) {
          angular.forEach(response.data, function(datagps) {
            var posGps = datagps.DGPDERNIEREPOS.replace(",", ".").replace(",", ".");
            $scope.lastPosChauff = [];
            var gpsSplitSplit = posGps.split(";");
            var heureSplit = datagps.DGPDERNIEREHEURE.split(" ");

            $scope.map.lastPos = {
              coords: {
                latitude: gpsSplitSplit[0],
                longitude: gpsSplitSplit[1]
              },
              options: {
                icon: {
                  url: 'images/ICO/ico_truck.svg'
                },
                labelContent: heureSplit[1],
                labelAnchor: '20 40',
                labelClass: "labels", // the CSS class for the label
                labelStyle: {
                  opacity: 0.75
                }
              }
            };
            var itemBound = new google.maps.LatLng(gpsSplitSplit[0], gpsSplitSplit[1]);
            $scope.boundsMarkers.extend(itemBound);
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
        });
    }

    //set info tournee
    $scope.setInfoTournee = function(chauffeur, date) {
      var dateformat = convertDate(date);
      angular.fromJson(apiDMSCARTO.getInfoTournee((chauffeur.SALCODE.substring(1, chauffeur.SALCODE.length)).substring(0, 7), dateformat))
        .then(function(response) {
          $scope.infoTournee = {
            livTot: 0,
            ramTot: 0
          };
          angular.forEach(response.data, function(gauge) {
            console.log(gauge);
            if (gauge.typeMission == "LIV") {
              $scope.infoTournee.liv = gauge.nbFait,
                $scope.infoTournee.livTot = gauge.nbPos,
                $scope.infoTournee.livPercent = (parseInt(gauge.nbFait) * 100) / parseInt(gauge.nbPos)
            } else {
              $scope.infoTournee.ram = gauge.nbFait,
                $scope.infoTournee.ramTot = gauge.nbPos,
                $scope.infoTournee.ramPercent = (parseInt(gauge.nbFait) * 100) / parseInt(gauge.nbPos)
            }
          });
        });
    }

    //get lastpos if all chauffeur
    $scope.getLastPosOther = function(selectedChauffeur, bool) {
      //get info de position
      function asyncFunc(selectedChauffeur, bool) {
        return $q(function(resolve, reject) {
          $scope.otherLastPos = [];
          $scope.boundsMarkers = new google.maps.LatLngBounds();
          var chauffSalcode;
          if (selectedChauffeur == null) {
            chauffSalcode = null;
          } else {
            chauffSalcode = selectedChauffeur.SALCODE
          }
          if (bool) {
            var chauffeurs = "";
            angular.forEach($scope.chauffeurs, function(chauffeur) {
              chauffeurs = chauffeurs + ",%27" + chauffeur.SALCODE + "%27";
            });
            $scope.loading = angular.fromJson(apiDMSCARTO.loadLastPosOther(chauffSalcode, chauffeurs.substring(1)))
              .then(function(response) {
                angular.forEach(response.data, function(poschauffeur) {
                  var posGps = poschauffeur.DGPDERNIEREPOS.replace(",", ".").replace(",", ".");
                  var gpsSplitSplit = posGps.split(";");
                  var heureSplit = poschauffeur.DGPDERNIEREHEURE.split(" ");

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
                      //animation: google.maps.Animation.DROP,
                      labelContent: poschauffeur.DGPCOND + " " + heureSplit[1],
                      labelAnchor: '20 40',
                      labelClass: "labels"
                    }
                  };

                  var itemBound = new google.maps.LatLng(gpsSplitSplit[0], gpsSplitSplit[1]);
                  $scope.boundsMarkers.extend(itemBound);
                  $scope.otherLastPos.push(addmarker);
                  sleep(5);
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
                resolve($scope.otherLastPos);
              });
          }
        })
      }
      var promise = asyncFunc(selectedChauffeur, bool)
        .then(function(data) {
          setTimeout(function() {
            angular.forEach($scope.map.markersControl.getChildMarkers().dict, function(item) {
              angular.forEach(item.gManager.clusterer.clusters_, function(row) {
                var chauff = "";
                angular.forEach(row.markers_.dict, function(line) {
                  chauff = chauff + "" + line.labelContent + "<br>";
                });
                if (row.clusterIcon_.div_.innerHTML != "") {
                  row.clusterIcon_.div_.innerHTML = '<img src="images/ICO/ico_truck_other.svg" style="position: absolute; top: 0px; left: 0px; clip: rect(0px, 75px, 75px, 0px);"><div class="labels" style="position: absolute;top: 0px;left: 0px;color: black;font-size: 11px;font-family: Arial,sans-serif;font-weight: bold;font-style: normal;text-decoration: none;text-align: center;">' + chauff + '</div>';
                }
              })
            })
          }, 800);
        }, function(reason) {
          alert('Failed: ' + reason);
        });
      //si chauffeur only checkbox
      if ($scope.cb1 != true && $scope.cb2 != true && $scope.cb3 == true && $scope.cb4 != true) {
        angular.fromJson(apiDMSCARTO.getInfoTourneeSociete('16', (new Date(Date.now()).toLocaleString().substring(0, 10))))
          .then(function(response) {
            $scope.boxesGauge = [];
            console.log(response.data);

            angular.forEach(response.data, function(gauge) {
              var find = _.find($scope.boxesGauge, {
                'chauff': gauge.codeChauffeur
              });
              if (find == undefined) {
                var newbox = {
                  chauff: gauge.codeChauffeur,
                  gauges: {
                    liv: 0,
                    livTot: 0,
                    ram: 0,
                    ramTot: 0
                  }
                }
                if (gauge.typeMission == "LIV") {
                  newbox.gauges.liv = gauge.nbFait,
                    newbox.gauges.livTot = gauge.nbPos,
                    newbox.gauges.livPercent = (parseInt(gauge.nbFait) * 100) / parseInt(gauge.nbPos)
                } else {
                  newbox.gauges.ram = gauge.nbFait,
                    newbox.gauges.ramTot = gauge.nbPos,
                    newbox.gauges.ramPercent = (parseInt(gauge.nbFait) * 100) / parseInt(gauge.nbPos)
                }
                $scope.boxesGauge.push(newbox);

              } else {
                if (gauge.typeMission == "LIV") {
                  find.gauges.liv = gauge.nbFait,
                  find.gauges.livTot = gauge.nbPos,
                  find.gauges.livPercent = (parseInt(gauge.nbFait) * 100) / parseInt(gauge.nbPos)
                }
                else {
                  find.gauges.ram = gauge.nbFait,
                  find.gauges.ramTot = gauge.nbPos,
                  find.gauges.ramPercent = (parseInt(gauge.nbFait) * 100) / parseInt(gauge.nbPos)
                }
              }
            });
            console.log($scope.boxesGauge);
          });
      }else {
        $scope.boxesGauge = [];
      }
    }

    $scope.reloadAuto = function(selectedChauffeur, cb1, cb2, cb3, sw1, date) {
      var reloadRoutine;
      if (sw1) {
        $scope.interval = $interval(function() {
          $scope.boxesRight = [];
          if ($scope.cb1) {
            $scope.getPositionsLivraisons($scope.selectedChauffeur, true, date);
          }
          if ($scope.cb2) {
            $scope.getTrajetLivraison($scope.selectedChauffeur, true, date);
          }
          if ($scope.cb4) {
            $scope.getPositionsRamasses($scope.selectedChauffeur, $scope.cb4, $scope.date);
          }
          if ($scope.cb3) {
            $scope.getLastPosOther($scope.selectedChauffeur, true, date);
          }
          console.log("reload");
        }, 10000);
      } else {
        console.log("out " + $scope.interval);
        $interval.cancel($scope.interval);
      }
    }

    $scope.markersClick = function(id) {
      console.log(id);
      $scope.accordion.toggle(id);
      $scope.$apply();
    }

    $scope.boxClick = function(title) {
      if (title == "Inconnu") {
        var toast = $mdToast.simple()
          .textContent('Position inconnu')
          .action('X')
          .highlightAction(true)
          .position('top right');
        $mdToast.show(toast).then(function() {});
      } else {
        find = _.find($scope.markers, {
          'idClick': title
        });

        $scope.map.center = {
          latitude: find.coords.latitude,
          longitude: find.coords.longitude
        };
        $scope.map.zoom = 18;
      }
    }

    $scope.clickEventsObject = {
      mouseover: markerMouseOver
    };

    $scope.clusterEventsObject = {};

    function markerMouseOver(marker, e) {}

    function cluserMouseOver(marker, e) {
      function asyncFunc(markers) {
        return $q(function(resolve, reject) {
          var chauff = "";
          angular.forEach(markers, function(item, key) {
            chauff = chauff + "" + item.model.chauffeur + "<br>";
          });
          resolve(chauff);
        });
      }

      var promise = asyncFunc(marker.markers_.dict)
        .then(function(chauff) {
          marker.clusterIcon_.div_.innerHTML = '<img src="images/ICO/ico_truck_other.svg" style="position: absolute; top: 0px; left: 0px; clip: rect(0px, 75px, 75px, 0px);"><div class="labels" style="position: absolute;top: 0px;left: 0px;color: black;font-size: 11px;font-family: Arial,sans-serif;font-weight: bold;font-style: normal;text-decoration: none;text-align: center;">' + chauff + '</div>';
        }, function(reason) {
          alert('Failed: ' + reason);
        });
    }

    function setClusterInfo(data) {
      uiGmapGoogleMapApi.then(function(map, data) {
        marker.setMap(map.getMap());
        var markerCluster = new MarkerClusterer(map, $scope.otherLastPos);
      });
    }

    //Func divers
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

    function convertDate(inputFormat) {
      function pad(s) {
        return (s < 10) ? '0' + s : s;
      }
      var d = new Date(inputFormat);
      return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join('/');
    }

    $scope.recadre = function() {
      $scope.getLastPos($scope.selectedChauffeur, $scope.date);
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

    $scope.toggleFullscreen = function() {
      $location.path("/full");
    }

    function sleep(delay) {
      var start = new Date().getTime();
      while (new Date().getTime() < start + delay);
    }

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
          $scope.getTrajetLivraison($scope.selectedChauffeur, $scope.cb2, $scope.date);
        }
        if ($scope.cb3) {
          $scope.getLastPosOther($scope.selectedChauffeur, $scope.cb3);
        }
      }
    }

    var originatorEv;
    $scope.openMenu = function($mdOpenMenu, ev) {
      originatorEv = ev;
      $mdOpenMenu(ev);
    };
  });
