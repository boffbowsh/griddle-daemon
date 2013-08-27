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
  describe(".find", function() {
    beforeEach(function(done){
      redis.sadd("griddle:apps", "boofar", done);
    });

    describe("for an existing app", function() {
      it("yields the app instance", function(done) {
        App.find("boofar", function(err, app) {
          app.should.be.an.instanceof(App);
          done();
        });
      });
      it("populates the name", function(done) {
        App.find("boofar", function(err, app) {
          app.name.should.equal("boofar");
          done();
        });
      });
      it("yields a null error", function(done) {
        App.find("boofar", function(err) {
          should.not.exist(err);
          done();
        });
      });
    });

    describe("for a non-existant app", function() {
      it("yields a NotFound error", function(done) {
        App.find("foobar", function(err) {
          err.should.equal("Not Found");
          done();
        });
      });
      it("yields no app", function(done) {
        App.find("foobar", function(err, app) {
          should.not.exist(app);
          done();
        });
      });
    });
  });

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