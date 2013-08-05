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

app.get("/processes", function(req, res) {
  res.json(provider.listProcesses());
});

app.delete("/processes", function(req, res) {
  provider.killAll(function() {
    res.status(202).end();
  });
});

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

app.get("/apps/:name/processes", function(req, res) {
  res.json(provider.listProcesses(req.params.name));
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

app.put("/apps/:name/formation", function(req, res) {
  var key = "griddle:apps:"+req.params.name+":formation";
  redis.del(key, function() {
    redis.hmset(key, req.body, function() {
      res.status(204).end();
    });
  });
});

app.patch("/apps/:name/env", function(req, res) {
  var key = "griddle:apps:"+req.params.name+":formation";
  redis.hmset(key, req.body, function() {
    redis.hgetall(key, function(err, env) {
      res.json(env).end();
    });
  });
});

app.post("/apps/:name/:processType/processes", function(req, res) {
  redis.get("griddle:apps:"+req.params.name+":slug", function(err, slugId) {
    redis.hgetall("griddle:apps:"+req.params.name+":env", function(err, env) {
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

app.delete("/apps/:name/:processType/processes/:processId", function(req, res) {
  provider.stopProcess(req.params.processId, function() {
    res.status(202).end();
  });
});

app.get("/apps/:name/:processType/processes/:processId/logs", function(req, res) {
  res.json(provider.logsFor(req.params.processId, req.query.count));
});

if (module.parent === null) {
  app.listen(config.port);

  // Start each app's formation
  redis.smembers("griddle:apps", function(err, apps) {
    apps.forEach(function(app) {
      redis.hgetall("griddle:apps:"+app+":formation", function(err, formation) {
        redis.get("griddle:apps:"+app+":slug", function(err, slugId) {
          redis.hgetall("griddle:apps:"+app+":env", function(err, env) {
            Object.keys(formation).forEach(function(processType) {
              for (var i = 0; i < parseInt(formation[processType], 10); i++) {
                provider.startProcess(app, slugId, processType, env);
              }
            });
          });
        });
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
