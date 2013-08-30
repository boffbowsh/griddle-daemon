"use strict";

var should  = require("chai").should(),
    redis   = require("redis").createClient();

var Formation = require("../../lib/models")(redis).Formation;

before(function(done) {
  redis.select(10, function(){
    redis.flushdb(done);
  });
});

afterEach(function(done) {
  redis.flushdb(done);
});

describe("Formation", function() {
  var formation;

  beforeEach(function() {
    formation = new Formation("hello_world");
  });

  describe("property", function() {
    var formation;

    beforeEach(function() {
      formation = new Formation("hello_world");
    });

    describe("#_appName", function() {
      it("contains the app name the Formation was instantiated with", function() {
        formation._appName.should.equal("hello_world");
      });

      it("is readonly", function() {
        (function() {formation._appName = "goodbye_world";}).should.throw(/read only/);
      });

      it("is not enumerable", function() {
        Object.keys(formation).should.not.include("_appName");
      });
    });

    describe("#web", function() {
      beforeEach(function() {
        formation.web = 1;
      });

      it("is creatable", function() {
        formation.web.should.equal(1);
      });

      it("is overwritable", function() {
        formation.web = 2;
        formation.web.should.equal(2);
      });

      it("is enumerable", function() {
        Object.keys(formation).should.include("web");
      });
    });
  });

  describe("#load()", function() {
    describe("with an empty formation", function() {
      it("defines no properties", function(done) {
        formation.load(function() {
          Object.keys(formation).length.should.equal(0);
          done();
        });
      });
    });

    describe("with a web formation setting present", function() {
      beforeEach(function(done) {
        redis.hset("griddle:apps:hello_world:formation", "web", 1, done);
      });

      it("defines the web property", function(done) {
        formation.load(function() {
          formation.web.should.equal(1);
          done();
        });
      });

      it("allows the web property to be enumerated", function(done) {
        formation.load(function() {
          Object.keys(formation).should.include("web");
          done();
        });
      });

      it("allows the web property to be changed", function(done) {
        formation.load(function() {
          formation.web = 2;
          formation.web.should.equal(2);
          done();
        });
      });
    });
  });

  describe("#save()", function() {
    describe("with a previously-empty formation", function() {
      describe("with an empty formation", function() {
        it("doesn't create the redis key", function(done) {
          formation.save(function() {
            redis.exists("griddle:apps:hello_world:formation", function(err, res) {
              res.should.equal(0);
              done();
            });
          });
        });
      });

      describe("with the web process set", function() {
        beforeEach(function() {
          formation.web = 1;
        });

        it("creates the redis key", function(done) {
          formation.save(function() {
            redis.exists("griddle:apps:hello_world:formation", function(err, res) {
              res.should.equal(1);
              done();
            });
          });
        });

        it("puts the web variable into redis", function(done) {
          formation.save(function() {
            redis.hget("griddle:apps:hello_world:formation", "web", function(err, res) {
              res.should.equal("1");
              done();
            });
          });
        });

        it("puts no other values into redis", function(done) {
          formation.save(function() {
            redis.hlen("griddle:apps:hello_world:formation", function(err, res) {
              res.should.equal(1);
              done();
            });
          });
        });
      });

      describe("with the web and worker processes set", function() {
        beforeEach(function() {
          formation.web = 1;
          formation.worker = 2;
        });

        it("creates the redis key", function(done) {
          formation.save(function() {
            redis.exists("griddle:apps:hello_world:formation", function(err, res) {
              res.should.equal(1);
              done();
            });
          });
        });

        it("puts the web variable into redis", function(done) {
          formation.save(function() {
            redis.hget("griddle:apps:hello_world:formation", "web", function(err, res) {
              res.should.equal("1");
              done();
            });
          });
        });

        it("puts the worker variable into redis", function(done) {
          formation.save(function() {
            redis.hget("griddle:apps:hello_world:formation", "worker", function(err, res) {
              res.should.equal("2");
              done();
            });
          });
        });

        it("puts no other values into redis", function(done) {
          formation.save(function() {
            redis.hlen("griddle:apps:hello_world:formation", function(err, res) {
              res.should.equal(2);
              done();
            });
          });
        });
      });
    });

    describe("with web already set", function() {
      beforeEach(function(done) {
        redis.hset("griddle:apps:hello_world:formation", "web", 1, function() {
          formation.load(done);
        });
      });

      describe("when overwriting web", function() {
        beforeEach(function() {
          formation.web = 2;
        });

        it("puts the web variable into redis", function(done) {
          formation.save(function() {
            redis.hget("griddle:apps:hello_world:formation", "web", function(err, res) {
              res.should.equal("2");
              done();
            });
          });
        });

        it("puts no other values into redis", function(done) {
          formation.save(function() {
            redis.hlen("griddle:apps:hello_world:formation", function(err, res) {
              res.should.equal(1);
              done();
            });
          });
        });
      });

      describe("when adding worker", function() {
        beforeEach(function() {
          formation.worker = 2;
        });

        it("retains the web variable in redis", function(done) {
          formation.save(function() {
            redis.hget("griddle:apps:hello_world:formation", "web", function(err, res) {
              res.should.equal("1");
              done();
            });
          });
        });

        it("puts the worker variable into redis", function(done) {
          formation.save(function() {
            redis.hget("griddle:apps:hello_world:formation", "worker", function(err, res) {
              res.should.equal("2");
              done();
            });
          });
        });

        it("puts no other values into redis", function(done) {
          formation.save(function() {
            redis.hlen("griddle:apps:hello_world:formation", function(err, res) {
              res.should.equal(2);
              done();
            });
          });
        });
      });

      describe("when deleting web", function() {
        beforeEach(function() {
          delete formation.web;
        });

        it("has no variables in redis", function(done){
          formation.save(function() {
            redis.hlen("griddle:apps:hello_world:formation", function(err, res) {
              res.should.equal(0);
              done();
            });
          });
        });
      });
    });
  });
});