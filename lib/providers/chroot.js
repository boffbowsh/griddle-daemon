"use strict";

var spawn = require("child_process").spawn,
    uuid  = require("node-uuid"),
    http  = require("http"),
    path  = require("path");

var config = require("../../config.json");

var runningProcesses = {};

module.exports = {
  startProcess: function(slugId, processType, env, cb) {
    http.get("http://"+config.anvilHost+"/process_types/"+slugId, function(res){
      var buffer;
      res.on("data", function(data) {
        if ( data === undefined ) return;
        if ( buffer === undefined ) {
          buffer = data;
        } else {
          buffer += data;
        }
      });
      res.on("end", function(data) {
        if ( data !== undefined ) {
          buffer += data;
        }
        var json = buffer.toString();
        var command = JSON.parse(json)[processType];

        if (command) {
          var processId = uuid.v4();
          var process = spawn("./scripts/run_slug.sh",
                              [config.anvilHost, slugId, processId, command],
                              {
                                cwd: path.dirname(module.parent.filename),
                                env: env,
                                stdio: "pipe"
                              });
          runningProcesses[processId] = process;
          process
            .on("error", console.log)
            .on("exit", console.log)
            .on("close", console.log)
            .on("disconnect", console.log);

          process.stdout.on("data", function(data){
            console.log("stdout:", data.toString().trim());
          });

          process.stderr.on("data", function(data){
            console.log("stderr:", data.toString().trim());
          });

          cb(null, processId);
        } else {
          console.log("foo");
        }
      });
    }).on("error", console.log);
  },

  stopProcess: function(processId) {
    var process = runningProcesses[processId];
    process.kill("SIGTERM");
  }
};

