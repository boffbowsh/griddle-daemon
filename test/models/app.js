var should  = require("chai").should(),
    redis   = require("redis").createClient();

var App = require("../../lib/models")(redis).App;

before(function(done) {
  redis.select(10, function(){
    redis.flushdb(done)
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
        App.find("boofar", function(app) {
          app.should.be.an.instanceof(App);
          done();
        });
      });
      it("populates the name", function(done) {
        App.find("boofar", function(app) {
          app.name.should.equal("boofar");
          done();
        });
      });
    });

    describe("for a non-existant app", function() {
      it("yields NotFound", function(done) {
        App.find("foobar", function(app) {
          app.constructor.name.should.eql("NotFound");
          done();
        });
      });
    });
  });
});