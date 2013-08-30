"use strict";

module.exports = function(server, models) {
  var App = models.App,
      Env = models.Env,
      Formation = models.Formation;

  server.get("/apps", function(req, res) {
    App.all(function(err, apps) {
      res.json(apps);
    });
  });

  server.put("/apps/:name", function(req, res) {
    if (!req.params.name.match(/^[0-9a-z\-_]*$/i)) {
      res.status(422).end();
    } else {
      var app = new App(req.params.name);
      app.save();
      res.status(201).end();
    }
  });

  server.get("/apps/:name/env", function(req, res) {
    var env = new Env(req.params.name);
    env.load(function() {
      res.json(env);
    });
  });

  server.put("/apps/:name/env", function(req, res) {
    if ( req.body.toString() == '[object Object]' ) {
      var env = new Env(req.params.name);
      Object.keys(req.body).forEach(function(key) {
        env[key] = req.body[key];
      });
      env.save(function() {
        res.json(env);
      });
    } else {
      res.status(422).end();
    }
  });

  server.patch("/apps/:name/env", function(req, res) {
    if ( req.body.toString() == '[object Object]' ) {
      var env = new Env(req.params.name);
      env.load(function() {
        Object.keys(req.body).forEach(function(key) {
          if ( req.body[key] ) {
            env[key] = req.body[key];
          } else {
            delete env[key];
          }
        });
        env.save(function() {
          res.json(env);
        });
      });
    } else {
      res.status(422).end();
    }
  });

  server.get("/apps/:name/formation", function(req, res) {
    var formation = new Formation(req.params.name);
    formation.load(function() {
      res.json(formation);
    });
  });

  server.put("/apps/:name/formation", function(req, res) {
    if ( req.body.toString() == '[object Object]' ) {
      var formation = new Formation(req.params.name);
      try {
        Object.keys(req.body).forEach(function(key) {
          if ( typeof req.body[key] != "number" ){
            throw new TypeError("process count should be a number");
          }
          formation[key] = req.body[key];
        });
        formation.save(function() {
          res.json(formation);
        });
      } catch (TypeError) {
        res.status(422).end();
      }
    } else {
      res.status(422).end();
    }
  });

  server.patch("/apps/:name/formation", function(req, res) {
    if ( req.body.toString() == '[object Object]' ) {
      var formation = new Formation(req.params.name);
      formation.load(function() {
        Object.keys(req.body).forEach(function(key) {
          if ( req.body[key] ) {
            formation[key] = req.body[key];
          } else {
            delete formation[key];
          }
        });
        formation.save(function() {
          res.json(formation);
        });
      });
    } else {
      res.status(422).end();
    }
  });
};