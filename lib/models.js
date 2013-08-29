"use strict";

var _ = require("lodash");

module.exports = function(redis) {
  var models = {};

  models.App = function(attrs) {
    _.extend(this, attrs);
  };

  models.App.prototype = {

  };

  _.extend(models.App, {
    all: function(cb) {
      redis.smembers("griddle:apps", function(err, res) {
        var apps = res.map(function(name) {
          return new models.App({name: name});
        });
        cb(null, apps);
      });
    }
  });

  return models;
};