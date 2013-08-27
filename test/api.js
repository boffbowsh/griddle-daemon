"use strict";

var should  = require("chai").should(),
    express = require("express"),
    request = require("supertest"),
    sinon   = require("sinon"),
    rewire  = require("rewire");

var api = express();
var App = sinon.spy();
var models = {App: App};

require("../lib/routes")(api, models);

describe("GET /apps", function() {
  describe("with an app", function() {
    beforeEach(function() {
      App.all = sinon.stub().yields(null, [{name: "foobar"}]);
    });

    it("returns a list", function(done) {
      request(api)
        .get("/apps")
        .expect("Content-Type", "application/json")
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
        .expect("Content-Type", "application/json")
        .expect(200, [{name: "foobar"}, {name: "bazfoo"}], done);
    });
  });

  describe("with no apps", function() {
    beforeEach(function() {
      App.all = sinon.stub().yields(null, []);
    });

    it("returns an empty", function(done) {
      request(api)
        .get("/apps")
        .expect("Content-Type", "application/json")
        .expect(200, [], done);
    });
  });
});
