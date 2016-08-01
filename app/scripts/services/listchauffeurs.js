'use strict';

/**
 * @ngdoc service
 * @name dmsCartoApp.listChauffeurs
 * @description
 * # listChauffeurs
 * Service in the dmsCartoApp.
 */
angular.module('dmsCartoApp')
  .service('apiDMSCARTO', function ($http,$cookies) {
    var url = 'https://dms.jeantettransport.com/api/';


    // var chauffeurs = ['PDELATTRE','PGRUPALLO','PSWANN','SLOPEZ','GKARTNER','AINGLESE','AROUXFACCHINO','MAMEUR'];
    // var center = {"SocCenter":[{"pos": "45.6438255,5.1716331"}]};
    // var livraisons = {"dmssuiviliv":[{"DMSUIVIOTSNUM":"16^06041259","DMSUIVICODEANO":"LIVCFM","DMSUIVILIBANO":"","DMSUIVILIBANO":"liv effectuer avec hayon plus tp ","DMSSUIVIIMPORTDATE":"16/06/2016 08:22:11","DMSSUIVIANDSOFT":"16/06/2016 08:27:02","DMSSUIVIVOYBDX":"GR1601542246","DMSPOSGPS":"45,6693168;4,89845031"},{"DMSUIVIOTSNUM":"1606041233","DMSUIVICODEANO":"LIVCFM","DMSUIVILIBANO":"","DMSUIVILIBANO":"","DMSSUIVIIMPORTDATE":"16/06/2016 09:13:41","DMSSUIVIANDSOFT":"16/06/2016 09:17:08","DMSSUIVIVOYBDX":"GR1601542246","DMSPOSGPS":"45,59982032;4,78055359"}]};
    // var posgps = {"dmsposgps":[{"DGPCOND":"SLOPEZ","DGPPOSITION":"45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,76964203;4,96839012|45,72441563;4,97463407|45,69380597;4,96924426|45,6744722;4,97199277|45,65221006;5,01691464|45,63866297;5,05535687|45,64674515;5,10965065|45,6441449;5,14763755|45,62711349;5,16464572|45,61763301;5,19055027|45,59729231;5,27763153|45,56935893;5,3373403|45,53890072;5,39179491|45,48680409;5,39865376|45,44185146;5,4068112|45,40028767;5,46489498|45,35705476;5,52057012|45,33673419;5,57986805|45,30461349;5,6060901|45,29251191;5,53274076|45,26002238;5,51345234|45,21432816;5,47346558|45,19452818;5,41747462|45,15482248;5,3582052|45,13445531;5,32141219|45,11320581;5,25824111|45,06901874;5,20758096|45,0626412;5,21763493|45,07137611;5,24618595|45,07117521;5,24658301|45,07045707;5,24878198|45,07126392;5,24536143|45,0712649;5,24536235|45,07126779;5,24536453|45,07127159;5,24536668|45,07127247;5,24536579|45,07127147;5,24536626|45,07126898;5,24536808|45,07126875;5,24537037|45,07127046;5,24537388|45,07142538;5,24578555|45,07100078;5,24380121|45,06590074;5,22871168|45,04862062;5,17061993|45,03766117;5,12661689|45,04145938;5,0837995|45,0579833;5,06283233","DGPHEUREPOS":"00:05:09|00:12:58|00:20:10|00:27:09|00:34:19|00:36:23|00:38:23|00:42:08|00:49:23|00:56:15|01:01:59|01:09:27|01:17:27|01:24:37|01:31:42|01:39:37|01:46:30|01:53:14|02:00:24|02:08:25|08:02:43|08:06:28|08:10:44|08:16:00|08:20:11|08:26:23|08:30:41|08:34:26|08:37:13|08:42:06|08:46:15|08:50:41|08:55:52|09:00:07|09:04:51|09:09:25|09:13:02|09:18:01|09:22:09|09:24:54|09:29:05|09:32:39|09:37:12|09:39:47|09:43:36|09:48:11|09:52:51|09:56:55|10:01:21|10:05:50|10:09:31|10:11:31|10:13:31|10:17:48|10:23:07|10:30:50|10:38:19|10:46:30|10:53:12|10:56:15|11:02:00|11:04:49|11:08:32|11:12:38|11:16:26|11:20:54"}]};

    //$cookies.get('SOCID')
    this.loadChauffeurs = function (idsoc) {
      // return $http.get(url+'?getSal='+$cookies.get('SOCID'));
      //return $http.get(url+'dmssalarie?val='+$cookies.get('SOCID'));
      return $http.get(url+'dmssalarie?val='+idsoc);
    };
    this.loadSocposition = function (idsoc) {
      // return $http.get(url+'?getCenter='+$cookies.get('SOCID')+'&o');
      //return $http.get(url+'dmscenter?val='+$cookies.get('SOCID'));
      //console.log(url+'dmscenter?val='+idsoc);
      return $http.get(url+'dmscenter?val='+idsoc);
    };
    this.loadPositionsLivraions = function (chauffeur,date) {
      // console.log(url+'dmsposlivraison?val='+chauffeur+"&date="+date);
      //console.log(url+'dmsposlivraison?val='+chauffeur+"&date="+date);
      console.log(url+'dmsposlivraison?val='+chauffeur+"&date="+date);
      return $http.get(url+'dmsposlivraison?val='+chauffeur+"&date="+date);
    };
    this.loadPositionsGPS = function (chauffeur,date) {
      //console.log(url+'dmsposgps?val='+chauffeur+"&date="+date);
      return $http.get(url+'dmsposgps?val='+chauffeur+"&date="+date);
    };
    this.loadLastPos = function (chauffeur,date) {
      //console.log(url+'dmslastposgps?val='+chauffeur+"&date="+date);
      return $http.get(url+'dmslastposgps?val='+chauffeur+"&date="+date);
    };
    this.loadInfosGrp = function (chauffeur) {
      //console.log(url+'dmslastposgps?val='+chauffeur+"&date="+date);
      return $http.get(url+'dmsInfoGrp?val='+chauffeur);
    };
  }); 
