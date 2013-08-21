var _ = require('lodash');

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
    }
  });

  return models;
};

function NotFound() {};