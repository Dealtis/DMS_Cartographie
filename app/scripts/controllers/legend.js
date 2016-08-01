'use strict';

angular.module('dmsCartoApp')
  .controller('LegendCtrl', function($scope, $mdToast, apiDMSCARTO) {
    $scope.toggle = function functionName() {
      angular.element(".legende>ul").toggleClass("visible");
    }
  });
