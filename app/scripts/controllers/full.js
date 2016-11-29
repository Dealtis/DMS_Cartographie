'use strict';

/**
 * @ngdoc function
 * @name dmsCartoApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the dmsCartoApp
 */
angular.module('dmsCartoApp')
  .controller('FullCtrl', function($scope, $q, $interval, apiDMSCARTO) {
    var LoadingScreen = window.pleaseWait({
      logo: 'images/ICO/ico_home.svg',
      backgroundColor: '#26c6da',
      loadingHtml: $scope.splashscreen
    });

    $scope.map = {
      center: {
        latitude: 45,
        longitude: -73
      },
      zoom: 8
    };
    var gpsSocPos = [];
    var gpsSocPosLong = [];
    $scope.otherLastPos = [];

    angular.fromJson(apiDMSCARTO.loadChauffeurs('3'))
      .then(function(response) {
        $scope.chauffeurs = response.data;
        $scope.getLastPosOther(null, true);
        //$scope.reloadAuto();
      });

    function convertDate(inputFormat) {
      function pad(s) {
        return (s < 10) ? '0' + s : s;
      }
      var d = new Date(inputFormat);
      return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join('/');
    }

    function chunk(arr, size) {
      var newArr = [];
      for (var i = 0; i < arr.length; i += size) {
        newArr.push(arr.slice(i, i + size));
      }
      return newArr;
    }

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
      })

    $scope.getLastPosOther = function(selectedChauffeur, bool) {
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

                  var addmarker = {
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

      angular.fromJson(apiDMSCARTO.getInfoTourneeSociete('3', convertDate(Date.now())))
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
              } else {
                find.gauges.ram = gauge.nbFait,
                  find.gauges.ramTot = gauge.nbPos,
                  find.gauges.ramPercent = (parseInt(gauge.nbFait) * 100) / parseInt(gauge.nbPos)
              }
            }
          });
          $scope.chunkedboxesGauge = chunk($scope.boxesGauge, 8);
          console.log($scope.chunkedboxesGauge);
        });
    }
    $scope.reloadAuto = function() {
      var reloadRoutine;
      $scope.interval = $interval(function() {
        $scope.getLastPosOther(null, true);
      }, 10000);
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

    function sleep(delay) {
      var start = new Date().getTime();
      while (new Date().getTime() < start + delay);
    }
  });
