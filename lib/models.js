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
          cb(app);
        } else {
          cb(new NotFound());
        }
      });
    }
  });

  return models;
};

function NotFound() {};