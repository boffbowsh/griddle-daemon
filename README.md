Griddle
=======

A heroku-style containerised deployment system with pluggable container providers.

Tested on CentOS 5.9.

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
