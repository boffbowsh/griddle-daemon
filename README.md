Griddle
=======

A heroku-style pre-Docker containerised deployment system with pluggable container providers.
Don't use this. Use deis, flynn, Mesos+Marathon or any other number of PaaSes that have 
appeared since this was made.

Tested on CentOS 5.9.

- [Kanban](http://huboard.com/boffbowsh/griddle-daemon)
- [Requirements](https://docs.google.com/a/globalpersonals.co.uk/document/d/1caV4Knrdb6-ioqgjdnotfk4WeorMoqkseDZHkqugLlA/edit#heading=h.7kg88fazut1n)

Prerequisites
-------------

Either use the `Vagrantfile` included to bootstrap the environment, or you'll need:

1. [UnionFS](http://grangerx.wordpress.com/2010/12/31/using-fuse-unionfs-with-centos-5-5-i686/)
2. [Node.js 0.10.x](http://nodejs.org/)
3. [lucid64 base](http://d1ame58wcmmrml.cloudfront.net/lucid64.tgz)

Running under Vagrant
---------------------

1. `vagrant up`
2. `vagrant ssh`
3. `sudo -s`
4. `cd /vagrant`
5. `npm install`
6. `make`
7. `./daemon.js`

CLI
---

1. `cd cli`
2. `npm install`
3. `./griddle --target <url> apps # defaults to 0.0.0.0:9090`
