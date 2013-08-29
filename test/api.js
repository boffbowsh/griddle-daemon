"use strict";

var should  = require("chai").should(),
    express = require("express"),
    request = require("supertest"),
    sinon   = require("sinon"),
    rewire  = require("rewire");

var api, App, models;

beforeEach(function() {
  api = express();
  App = sinon.stub();
  models = {App: App};
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
