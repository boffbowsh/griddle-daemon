"use strict";

var should  = require("chai").should(),
    redis   = require("redis").createClient();

var App = require("../../lib/models")(redis).App;

before(function(done) {
  redis.select(10, function(){
    redis.flushdb(done);
  });
});

afterEach(function(done) {
  redis.flushdb(done);
});

describe("App", function() {
  describe(".all", function() {
    beforeEach(function(done) {
      redis.sadd("griddle:apps", "foobar", "bazqux", done);
    });

    it("yields 2 apps", function(done) {
      App.all(function(err, apps) {
        apps.should.to.have.length(2);
        done();
      });
    });

    it("populates the apps", function(done) {
      App.all(function(err, apps) {
        apps.map(function(app) {
          return app.name;
        }).should.include.members(["bazqux", "foobar"]);
        done();
      });
    });
  });
});