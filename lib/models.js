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
    find: function(name, cb) {
      redis.sismember("griddle:apps", name, function(err, res) {
        if (res) {
          var app = new models.App({
            name: name
          });
          cb(null, app);
        } else {
          cb("Not Found", null);
        }
      });
    },

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