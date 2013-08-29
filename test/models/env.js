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
    var env;

    beforeEach(function() {
      env = new Env("hello_world");
    });

    describe("#_appName", function() {
      it("contains the app name the App was instantiated with", function() {
        env._appName.should.equal("hello_world");
      });

      it("is readonly", function() {
        (function() {env._appName = "goodbye_world";}).should.throw(/read only/);
      });

      it("is not enumerable", function() {
        Object.keys(env).should.not.include("_appName");
      });
    });

    describe("#FOO", function() {
      beforeEach(function() {
        env.FOO = "bar";
      });

      it("is creatable", function() {
        env.FOO.should.equal("bar");
      });

      it("is overwritable", function() {
        env.FOO = "baz";
        env.FOO.should.equal("baz");
      });

      it("is enumerable", function() {
        Object.keys(env).should.include("FOO");
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

      it("allows the FOO property to be changed", function(done) {
        env.load(function() {
          env.FOO = "baz";
          env.FOO.should.equal("baz");
          done();
        });
      });
    });
  });

  describe("#save()", function() {
    describe("with a previously-empty env", function() {
      describe("with an empty env", function() {
        it("doesn't create the redis key", function(done) {
          env.save(function() {
            redis.exists("griddle:apps:hello_world:env", function(err, res) {
              res.should.equal(0);
              done();
            });
          });
        });
      });

      describe("with the FOO variable set", function() {
        beforeEach(function() {
          env.FOO = "bar";
        });

        it("creates the redis key", function(done) {
          env.save(function() {
            redis.exists("griddle:apps:hello_world:env", function(err, res) {
              res.should.equal(1);
              done();
            });
          });
        });

        it("puts the FOO variable into redis", function(done) {
          env.save(function() {
            redis.hget("griddle:apps:hello_world:env", "FOO", function(err, res) {
              res.should.equal("bar");
              done();
            });
          });
        });

        it("puts no other values into redis", function(done) {
          env.save(function() {
            redis.hlen("griddle:apps:hello_world:env", function(err, res) {
              res.should.equal(1);
              done();
            });
          });
        });
      });

      describe("with the FOO and BAZ variables set", function() {
        beforeEach(function() {
          env.FOO = "bar";
          env.BAZ = "qux";
        });

        it("creates the redis key", function(done) {
          env.save(function() {
            redis.exists("griddle:apps:hello_world:env", function(err, res) {
              res.should.equal(1);
              done();
            });
          });
        });

        it("puts the FOO variable into redis", function(done) {
          env.save(function() {
            redis.hget("griddle:apps:hello_world:env", "FOO", function(err, res) {
              res.should.equal("bar");
              done();
            });
          });
        });

        it("puts the BAZ variable into redis", function(done) {
          env.save(function() {
            redis.hget("griddle:apps:hello_world:env", "BAZ", function(err, res) {
              res.should.equal("qux");
              done();
            });
          });
        });

        it("puts no other values into redis", function(done) {
          env.save(function() {
            redis.hlen("griddle:apps:hello_world:env", function(err, res) {
              res.should.equal(2);
              done();
            });
          });
        });
      });
    });

    describe("with FOO already set", function() {
      beforeEach(function(done) {
        redis.hset("griddle:apps:hello_world:env", "FOO", "bar", function() {
          env.load(done);
        });
      });

      describe("when overwriting FOO", function() {
        beforeEach(function() {
          env.FOO = "baz";
        });

        it("puts the FOO variable into redis", function(done) {
          env.save(function() {
            redis.hget("griddle:apps:hello_world:env", "FOO", function(err, res) {
              res.should.equal("baz");
              done();
            });
          });
        });

        it("puts no other values into redis", function(done) {
          env.save(function() {
            redis.hlen("griddle:apps:hello_world:env", function(err, res) {
              res.should.equal(1);
              done();
            });
          });
        });
      });

      describe("when adding BAZ", function() {
        beforeEach(function() {
          env.BAZ = "qux";
        });

        it("retains the FOO variable in redis", function(done) {
          env.save(function() {
            redis.hget("griddle:apps:hello_world:env", "FOO", function(err, res) {
              res.should.equal("bar");
              done();
            });
          });
        });

        it("puts the BAZ variable into redis", function(done) {
          env.save(function() {
            redis.hget("griddle:apps:hello_world:env", "BAZ", function(err, res) {
              res.should.equal("qux");
              done();
            });
          });
        });

        it("puts no other values into redis", function(done) {
          env.save(function() {
            redis.hlen("griddle:apps:hello_world:env", function(err, res) {
              res.should.equal(2);
              done();
            });
          });
        });
      });

      describe("when deleting FOO", function() {
        beforeEach(function() {
          delete env.FOO;
        });

        it("has no variables in redis", function(done){
          env.save(function() {
            redis.hlen("griddle:apps:hello_world:env", function(err, res) {
              res.should.equal(0);
              done();
            });
          });
        });
      });
    });
  });
});