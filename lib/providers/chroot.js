"use strict";

var spawn  = require("child_process").spawn,
    uuid   = require("node-uuid"),
    http   = require("http"),
    path   = require("path"),
    util   = require("util"),
    async  = require("async"),
    events = require("events");

var config = require("../../config.json");

var chroot = module.exports = {
  startProcess: function(appName, slugId, processType, env, cb) {
    chroot.processTypes(slugId, function(processTypes) {
      var command = processTypes[processType];

      if (command) {
        var process = new Process(slugId, command, env, appName, processType);
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
  },

  stopProcess: function(processId, cb) {
    var process = Process.runningProcesses[processId];
    process.on("close", cb);
    process.stop();
  },

  scaleDown: function(appName, processType, cb) {
    var process = Process.runningProcesses[Object.keys(Process.runningProcesses).filter(function(processId) {
      var process = Process.runningProcesses[processId];
      return process.appName === appName && process.processType == processType;
    })[0]];
    process.on("close", cb);
    process.stop();
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
  },

  killAll: function(cb) {
    async.parallel(Object.keys(Process.runningProcesses).map(function(processId) {
      return function(cb) {
        Process.runningProcesses[processId].on("close", cb);
        Process.runningProcesses[processId].stop();
      };
    }), cb);
  },

  processTypes: function(slugId, cb) {
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
        cb(JSON.parse(json));
      });
    });
  }
};

function Process(slugId, command, env, appName, processType) {
  this.slugId = slugId;
  this.id = uuid.v4();
  this.command = command;
  this.appName = appName;
  this.processType = processType;
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
      } else {
        delete Process.runningProcesses[self.id];
        self.emit("close");
      }
    });

    self.childProcess.stdout.on("data", this.logger("stdout"));
    self.childProcess.stderr.on("data", this.logger("stderr"));
  };

  this.stop = function (){
    this.exiting = true;
    this.childProcess.kill("SIGTERM");
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