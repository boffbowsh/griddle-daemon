"use strict";

var spawn  = require("child_process").spawn,
    uuid   = require("node-uuid"),
    http   = require("http"),
    path   = require("path"),
    util   = require("util"),
    events = require("events");

var config = require("../../config.json");

module.exports = {
  startProcess: function(appName, slugId, processType, env, cb) {
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
          var process = new Process(slugId, command, env, appName);
          process.spawn();

          process.on("stdout", function(data){
            console.log("stdout:", data.toString().trim());
          });

          process.on("stderr", function(data){
            console.log("stderr:", data.toString().trim());
          });

          if (cb) { cb(null, process.id); }
        }
      });
    }).on("error", console.log);
  },

  stopProcess: function(processId) {
    var process = Process.runningProcesses[processId];
    process.stop();
    delete Process.runningProcesses[processId];
  },

  listProcesses: function(appName) {
    var processes = Object.keys(Process.runningProcesses).map(function(el) {
      return Process.runningProcesses[el].attributes();
    });

    if (appName) {
      processes = processes.filter(function(el) {
        return el.appName == appName;
      });
    }
    return processes;
  },

  logsFor: function(processId, count) {
    count = count || 10;
    return Process.runningProcesses[processId].log.slice(0,count);
  }
};

function Process(slugId, command, env, appName) {
  this.slugId = slugId;
  this.id = uuid.v4();
  this.command = command;
  this.appName = appName;
  this.env = env;
  this.exiting = false;
  this.childProcess = null;
  this.log = [];

  this.attributes = function (){
    return {
      processId:   this.id,
      appName:     this.appName,
      processType: this.processType,
      slugId:      this.slugId
    };
  };

  this.spawn = function (){
    var self = this;

    self.childProcess = spawn("./scripts/run_slug.sh",
                              [config.anvilHost, self.slugId, self.id, self.command],
                              {
                                cwd: path.dirname(module.parent.filename),
                                env: self.env,
                                stdio: "pipe"
                              });

    Process.runningProcesses[self.id] = self;
    self.childProcess.on("exit", function() {
      if (!self.exiting) {
        self.spawn();
      }
    });

    self.childProcess.stdout.on("data", this.logger("stdout"));
    self.childProcess.stderr.on("data", this.logger("stderr"));
  };

  this.stop = function (){
    this.exiting = true;
    this.childProcess.kill("SIGTERM");
    delete Process.runningProcesses[this.id];
  };

  this.logger = function(type) {
    var self = this;
    return function(data) {
      self.log.unshift({type: type, timestamp: new Date(), data: data.toString()});
      self.log.splice(1000);
    };
  };
}

Process.runningProcesses = {};

util.inherits(Process, events.EventEmitter);