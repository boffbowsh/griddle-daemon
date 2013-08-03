#!/usr/bin/env node

"use strict";

var util     = require("util"),
    express  = require("express"),
    provider = require("./lib/providers/chroot"),
    async    = require("async"),
    config   = require("./config.json"),
    redis    = require("redis").createClient(config.redis.port, config.redis.host);

var app = express();
app.use(express.bodyParser());

app.get("/apps", function(req, res) {
  redis.smembers("griddle:apps", function(err, apps) {
    var appList = {};
    async.each(apps, function(app, done){
      redis.hgetall("griddle:apps:"+app+":env", function(err, env) {
        appList[app] = env;
        done();
      });
    }, function(){
      res.json(appList).end();
    });
  });
});

app.put("/apps/:name", function(req, res) {
  redis.sadd("griddle:apps", req.params.name, function() {
    res.location("/apps/"+req.params.name).json(201, {name: req.params.name}).end();
  });
});

app.get("/apps/:name/env", function(req, res) {
  var key = "griddle:apps:"+req.params.name+":env";
  redis.hgetall(key, function(err, env) {
    res.json(env).end();
  });
});

app.put("/apps/:name/env", function(req, res) {
  var key = "griddle:apps:"+req.params.name+":env";
  redis.del(key, function() {
    redis.hmset(key, req.body, function() {
      res.status(204).end();
    });
  });
});

app.patch("/apps/:name/env", function(req, res) {
  var key = "griddle:apps:"+req.params.name+":env";
  redis.hmset(key, req.body, function() {
    redis.hgetall(key, function(err, env) {
      res.json(env).end();
    });
  });
});

app.put("/apps/:name/slug", function(req, res) {
  redis.set("griddle:apps:"+req.params.name+":slug", req.body.slugId, function() {
    res.status(204).end();
  });
});

app.post("/apps/:name/:processType/processes", function(req, res) {
  redis.get("griddle:apps:"+req.params.name+":slug", function(err, slugId) {
    redis.hgetall("griddle:apps:"+req.params.name+":env", function(err, env) {
      provider.startProcess(slugId, req.params.processType, env, function(err, id) {
        if (err) {
          res.json(500,{error: err}).end();
        } else {
          res.location(util.format("/apps/%s/%s/processes/%s", req.params.name, req.params.processType, id)).json(201, {processId: id}).end();
        }
      });
    });
  });
});

app.delete("/apps/:name/:processType/processes/:processId", function(req, res) {
  provider.stopProcess(req.params.processId);
  res.status(202).end();
});

app.listen(9090);