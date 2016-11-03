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
    var url = 'https://andsoft.jeantettransport.com/dms/api/';
    this.loadChauffeurs = function(idsoc) {
      return $http.get(url + 'dmsSalarie?val=' + idsoc);
    };
    this.loadSocposition = function(idsoc) {
      return $http.get(url + 'dmsCenter?val=' + idsoc);
    };
    this.loadPositionsLivraions = function (chauffeur,date) {
      console.log(url+'dmsPos?val='+chauffeur+"&date="+date);
      return $http.get(url+'dmsPos?val='+chauffeur+"&date="+date);
    };
    this.loadPositionsRamasses = function (chauffeur,date) {
      return $http.get(url+'dmsRam?val='+chauffeur+"&date="+date);
    };
    this.loadPositionsGPS = function(chauffeur, date) {
      return $http.get(url + 'dmsTrajet?val=' + chauffeur + "&date=" + date);
    };
    this.loadLastPos = function(chauffeur, date) {
      return $http.get(url + 'dmsLastPosGps?val=' + chauffeur + "&date=" + date);
    };
    this.loadLastPosOther = function (chauffeur,chauffeurs) {
      return $http.get(url+'dmsOtherChauffeur?val='+chauffeur+"&chauffeurs="+chauffeurs);
    };
    this.loadInfoPos = function (chauffeur) {
      return $http.get(url+'dmsInfoPos?val='+chauffeur);
    };
    this.getGeocode = function (nom, adr, cp, ville) {
      return $http.get("https://maps.googleapis.com/maps/api/geocode/json?address="+_.replace(nom,new RegExp(" ","g"),"+")+","+_.replace(adr,new RegExp(" ","g"),"+")+","+cp+","+_.replace(ville,new RegExp(" ","g"),"+"));
    };

  });
