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
  describe(".all()", function() {
    describe("with 2 apps", function() {
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

    describe("with no apps", function() {
      it("yields no apps", function(done) {
        App.all(function(err, apps) {
          apps.should.to.have.length(0);
          done();
        });
      });
    });
  });

  describe("#save()", function() {
    it("adds the app name to the set", function(done) {
      var app = new App("foobar");
      app.save(function(err) {
        should.not.exist(err);
        redis.sismember("griddle:apps", "foobar", function(err, result) {
          result.should.equal(1);
          done();
        });
      });
    });
  });


  describe("property", function() {
    describe("#name", function() {
      it("contains the name the App was instantiated with", function() {
        var app = new App("foobar");
        app.name.should.equal("foobar");
      });

      it("is readonly", function() {
        var app = new App("foobar");
        (function() {app.name = "barfoo";}).should.throw(/read ?only/);
      });
    });
  });
});