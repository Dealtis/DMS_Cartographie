'use strict';

/**
 * @ngdoc service
 * @name dmsCartoApp.listChauffeurs
 * @description
 * # listChauffeurs
 * Service in the dmsCartoApp.
 */
angular.module('dmsCartoApp')
  .service('apiDMSCARTO', function($http, $cookies) {
    var url = 'https://dms.jeantettransport.com/api/';

    //$cookies.get('SOCID')
    this.loadChauffeurs = function(idsoc) {
      //return $http.get(url+'dmssalarie?val='+$cookies.get('SOCID'));
      return $http.get(url + 'dmssalarie?val=' + idsoc);
    };
    this.loadSocposition = function(idsoc) {
      //return $http.get(url+'dmscenter?val='+$cookies.get('SOCID'));
      return $http.get(url + 'dmscenter?val=' + idsoc);
    };
    this.loadPositionsLivraions = function(chauffeur, date) {
      return $http.get(url + 'dmsposlivraison?val=' + chauffeur + "&date=" + date);
    };
    this.loadPositionsGPS = function(chauffeur, date) {
      return $http.get(url + 'dmsposgps?val=' + chauffeur + "&date=" + date);
    };
    this.loadLastPos = function(chauffeur, date) {
      return $http.get(url + 'dmslastposgps?val=' + chauffeur + "&date=" + date);
    };
    this.loadLastPosOther = function(chauffeur, chauffeurs) {
      return $http.get(url + 'dmslastposgpsother?val=' + chauffeur + "&chauffeurs=" + chauffeurs);
    };
    this.loadInfosGrp = function(chauffeur) {
      return $http.get(url + 'dmsInfoGrp?val=' + chauffeur);
    };
    this.getGeocode = function(nom, adr, cp, ville) {
      return $http.get("https://maps.googleapis.com/maps/api/geocode/json?address=" + _.replace(nom, new RegExp(" ", "g"), "+") + "," + _.replace(adr, new RegExp(" ", "g"), "+") + "," + cp + "," + _.replace(ville, new RegExp(" ", "g"), "+"));
    };

  });
