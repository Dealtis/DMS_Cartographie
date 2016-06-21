'use strict';

/**
 * @ngdoc service
 * @name dmsCartoApp.listChauffeurs
 * @description
 * # listChauffeurs
 * Service in the dmsCartoApp.
 */
angular.module('dmsCartoApp')
  .service('apiDMSCARTO', function ($http) {
    var url = 'http://10.1.2.67/lib/asp/google/apiDMSCARTO/api.asp';
    this.loadChauffeurs = function (idsoc) {
      return $http.get(url+'?getSal='+idsoc);
    };
    this.loadSocposition = function (idsoc) {
      return $http.get(url+'?getCenter='+idsoc);
    };
    this.loadPositionsLivraions = function (chauffeur) {
      return $http.get('http://10.1.2.67/lib/asp/google/apiDMSCARTO/traitpos.asp?getPos='+chauffeur);
    };
  });
