"use strict";

var should  = require("chai").should(),
    redis   = require("redis").createClient();

var Env = require("../../lib/models")(redis).Env;

before(function(done) {
  redis.select(10, function(){
    redis.flushdb(done);
  });
});

afterEach(function(done) {
  redis.flushdb(done);
});

describe("Env", function() {
  var env;

  beforeEach(function() {
    env = new Env("hello_world");
  });

  describe("properties", function() {
    describe("#appName", function() {
      var env;

      beforeEach(function() {
        env = new Env("hello_world");
      });

      it("contains the app name the App was instantiated with", function() {
        env.appName.should.equal("hello_world");
      });

      it("is readonly", function() {
        (function() {env.appName = "goodbye_world";}).should.throw(/read only/);
      });

      it("is not enumerable", function() {
        Object.keys(env).should.not.include("appName");
      });
    });
  });

  describe("#load()", function() {
    describe("with an empty env", function() {
      it("defines no properties", function(done) {
        env.load(function() {
          Object.keys(env).length.should.equal(0);
          done();
        });
      });
    });

    describe("with a FOO env setting present", function() {
      beforeEach(function(done) {
        redis.hset("griddle:apps:hello_world:env", "FOO", "bar", done);
      });

      it("defines the FOO property", function(done) {
        env.load(function() {
          env.FOO.should.equal("bar");
          done();
        });
      });

      it("allows the FOO property to be enumerated", function(done) {
        env.load(function() {
          Object.keys(env).should.include("FOO");
          done();
        });
      });
    });
  });
});