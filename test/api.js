"use strict";

var should  = require("chai").should(),
    express = require("express"),
    request = require("supertest"),
    sinon   = require("sinon"),
    rewire  = require("rewire");

var api, App, Env, models;

beforeEach(function() {
  api = express();
  api.use(express.bodyParser());

  App = sinon.stub();
  Env = sinon.stub();
  models = {App: App, Env: Env};
  require("../lib/routes")(api, models);
});

describe("GET /apps", function() {
  describe("with an app", function() {
    beforeEach(function() {
      App.all = sinon.stub().yields(null, [{name: "foobar"}]);
    });

    it("returns a list", function(done) {
      request(api)
        .get("/apps")
        .expect("Content-Type", /json/)
        .expect(200, [{name: "foobar"}], done);
    });
  });

  describe("with some apps", function() {
    beforeEach(function() {
      App.all = sinon.stub().yields(null, [{name: "foobar"}, {name: "bazfoo"}]);
    });

    it("returns a list", function(done) {
      request(api)
        .get("/apps")
        .expect("Content-Type", /json/)
        .expect(200, [{name: "foobar"}, {name: "bazfoo"}], done);
    });
  });

  describe("with no apps", function() {
    beforeEach(function() {
      App.all = sinon.stub().yields(null, []);
    });

    it("returns an empty list", function(done) {
      request(api)
        .get("/apps")
        .expect("Content-Type", /json/)
        .expect(200, [], done);
    });
  });
});

describe("PUT /apps/:name", function(){
  var app;
  beforeEach(function() {
    app = sinon.spy();
    App.returns(app);
    app.save = sinon.spy();
  });

  it("rejects an app name containing a space", function(done) {
    request(api)
      .put("/apps/Foo Bar")
      .expect(422, done);
  });

  it("rejects an app name containing invalid characters", function(done) {
    request(api)
      .put("/apps/Micro$oft")
      .expect(422, done);
  });

  it("allows an app name containing valid characters", function(done) {
    request(api)
      .put("/apps/hello_World-1")
      .expect(201, done);
  });

  it("creates the application", function(done) {
    var app = sinon.spy();
    App.withArgs("hello-world").returns(app);
    app.save = sinon.spy();
    request(api)
      .put("/apps/hello-world")
      .expect(201, function(err) {
        app.save.calledOnce.should.equal(true);
        done();
      });
  });
});

describe("/apps/:name/env", function() {
  var env;
  beforeEach(function() {
    env = {load: sinon.stub().callsArg(0), save: sinon.stub().callsArg(0)};
    Env.withArgs("hello-world").returns(env);
  });

  describe("GET", function() {
    describe("with an empty env", function() {
      it("returns an empty object", function(done) {
        request(api)
          .get("/apps/hello-world/env")
          .expect(200, {}, done);
      });
    });

    describe("with an env containing FOO", function() {
      beforeEach(function() {
        env.FOO = "bar";
      });

      it("returns an object containing FOO => \"bar\"", function(done) {
        request(api)
          .get("/apps/hello-world/env")
          .expect(200, {FOO: "bar"}, done);
      });
    });
  });

  describe("PUT", function() {
    describe("when given an Object", function() {
      it("saves the object as the environment", function(done) {
        request(api)
          .put("/apps/hello-world/env")
          .send({FOO: "bar"})
          .end(function(err, res) {
            env.FOO.should.equal("bar");
            env.save.calledOnce.should.equal(true);
            done();
          });
      });

      it("doesn't load the existing environment first", function(done) {
        request(api)
          .put("/apps/hello-world/env")
          .send({FOO: "bar"})
          .end(function(err, res) {
            env.load.called.should.equal(false);
            done();
          });
      });
    });

    describe("when given an Array", function() {
      it("rejects the input", function(done) {
        request(api)
          .put("/apps/hello-world/env")
          .send(["foo"])
          .expect(422, done);
      });
    });
  });

  describe("PATCH", function() {
    describe("when given an Array", function() {
      it("rejects the input", function(done) {
        request(api)
          .patch("/apps/hello-world/env")
          .send(["foo"])
          .expect(422, done);
      });
    });

    describe("when given an Object", function() {
      describe("with an empty existing environment", function() {
        it("saves the object as the environment", function(done) {
          request(api)
            .patch("/apps/hello-world/env")
            .send({FOO: "bar"})
            .end(function(err, res) {
              env.FOO.should.equal("bar");
              env.save.calledOnce.should.equal(true);
              done();
            });
        });
      });

      describe("with an existing environment", function() {
        beforeEach(function() {
          env.FOO = "baz";
          env.MOO = "oink";
        });

        it("saves the object as the environment", function(done) {
          request(api)
            .patch("/apps/hello-world/env")
            .send({FOO: "bar"})
            .end(function(err, res) {
              env.FOO.should.equal("bar");
              env.save.calledOnce.should.equal(true);
              done();
            });
        });

        it("preserves the unchanged environment", function(done) {
          request(api)
            .patch("/apps/hello-world/env")
            .send({FOO: "bar"})
            .end(function(err, res) {
              env.MOO.should.equal("oink");
              done();
            });
        });

        it("deletes variables if set to null", function(done) {
          request(api)
            .patch("/apps/hello-world/env")
            .send({FOO: null})
            .end(function(err, res) {
              Object.keys(env).should.not.include("FOO");
              done();
            });
        });
      });
    });
  });
});