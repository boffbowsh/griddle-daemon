#!/usr/bin/env node

"use strict";

var pidFile       = process.env.PID_FILE || "./daemon.pid",
    child_process = require("child_process"),
    fs            = require("fs");

var worker, masterStatus = "running";

function spawnWorker() {
  worker = child_process.fork("worker");
  worker.on("close", function(err) {
    if (masterStatus === "running") {
      console.log("Worker exited with", err);
      spawnWorker();
    } else {
      console.log("Worker closed, exiting");
      process.exit(0);
    }
  });
}

spawnWorker();

fs.writeFileSync(pidFile, process.pid.toString(), "ascii");

process.on("exit", function() {
  fs.unlinkSync(pidFile);
}).on("SIGINT", function() {
  masterStatus = "closing";
});

console.info("Master started with pid", process.pid);