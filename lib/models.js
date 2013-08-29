"use strict";

var _ = require("lodash");

module.exports = function(redis) {
  var models = {};

  models.App = function(name) {
    Object.defineProperty(this, "name",
      {enumerable: true, value: name, writable: false});
  };

  models.App.prototype = {
    save: function(cb) {
      redis.sadd("griddle:apps", this.name, function(err, res) {
        cb(err);
      });
    }
  };

  _.extend(models.App, {
    all: function(cb) {
      redis.smembers("griddle:apps", function(err, res) {
        var apps = res.map(function(name) {
          return new models.App(name);
        });
        cb(null, apps);
      });
    }
  });

  models.Env = function(appName) {
    Object.defineProperty(this, "_appName",
      {enumerable: false, value: appName, writable: false});
  };

  models.Env.prototype = {
    load: function(cb) {
      var self = this;
      redis.hgetall("griddle:apps:"+this._appName+":env", function(err, res) {
        if (res) {
          Object.keys(res).forEach(function(key) {
            Object.defineProperty(self, key,
              {enumerable: true, value: res[key]});
          });
        }
        cb();
      });
    }
  };

  return models;
};