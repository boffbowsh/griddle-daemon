module.exports = function(server, models) {
  var App = models.App;

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
};