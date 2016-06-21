'use strict';

describe('Service: listChauffeurs', function () {

  // load the service's module
  beforeEach(module('dmsCartoApp'));

  // instantiate service
  var listChauffeurs;
  beforeEach(inject(function (_listChauffeurs_) {
    listChauffeurs = _listChauffeurs_;
  }));

  it('should do something', function () {
    expect(!!listChauffeurs).toBe(true);
  });

});
