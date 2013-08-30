#!/usr/bin/env node

"use strict";

var util     = require("util"),
    express  = require("express"),
    provider = require("./lib/providers/chroot"),
    config   = require("./config.json"),
    routes   = require("./lib/routes"),
    redis    = require("redis").createClient(config.redis.port, config.redis.host);

var models = require("./lib/models")(redis);
var app = express();
app.use(express.bodyParser());

routes(app, models);

app.get("/processes", function(req, res) {
  res.json(provider.listProcesses());
});

app.delete("/processes", function(req, res) {
  provider.killAll(function() {
    res.status(202).end();
  });
});

app.get("/apps/:name/processes", function(req, res) {
  res.json(provider.listProcesses(req.params.name));
});

app.put("/apps/:name/slug", function(req, res) {
  redis.set("griddle:apps:"+req.params.name+":slug", req.body.slugId, function(err) {
    redisError(res, err);
    res.status(204).end();
  });
});

app.get("/apps/:name/processes/:processType", function(req, res) {
  res.json(provider.listProcesses(req.params.name).filter(function(process) {
    return process.processType === req.params.processType;
  }));
});

app.post("/apps/:name/processes/:processType", function(req, res) {
  redis.get("griddle:apps:"+req.params.name+":slug", function(err, slugId) {
    redisError(res, err);
    redis.hgetall("griddle:apps:"+req.params.name+":env", function(err, env) {
      redisError(res, err);
      provider.startProcess(req.params.name, slugId, req.params.processType, env, function(err, id) {
        if (err) {
          res.json(500,{error: err}).end();
        } else {
          res.location(util.format("/apps/%s/%s/processes/%s", req.params.name, req.params.processType, id)).json(201, {processId: id}).end();
        }
      });
    });
  });
});

app.delete("/apps/:name/processes/:processType/:processId", function(req, res) {
  provider.stopProcess(req.params.processId, function() {
    res.status(202).end();
  });
});

app.delete("/apps/:name/processes/:processType", function(req, res) {
  provider.scaleDown(req.params.name, req.params.processType, function() {
    res.status(202).end();
  });
});

app.get("/apps/:name/processes/:processType/:processId/logs", function(req, res) {
  res.json(provider.logsFor(req.params.processId, req.query.count));
});

if (module.parent === null) {
  app.listen(config.port);

  // Start each app's formation
  redis.smembers("griddle:apps", function(err, apps) {
    apps.forEach(function(app) {
      redis.hgetall("griddle:apps:"+app+":formation", function(err, formation) {
        if (formation) {
          redis.get("griddle:apps:"+app+":slug", function(err, slugId) {
            redis.hgetall("griddle:apps:"+app+":env", function(err, env) {
              Object.keys(formation).forEach(function(processType) {
                for (var i = 0; i < parseInt(formation[processType], 10); i++) {
                  provider.startProcess(app, slugId, processType, env);
                }
              });
            });
          });
        }
      });
    });
  });

  process.on("SIGTERM", handleExit).on("SIGINT", handleExit).on("SIGQUIT", handleExit);

  console.log("Worker spawned with pid", process.pid);
}

function handleExit() {
  console.log("Closing processes...");
  provider.killAll(function() {
    process.exit(0);
  });
}

function redisError(res, err) {
  if (err) {
    res.json(500, {redisError: err}).end();
  }
}

module.exports = {app: app};