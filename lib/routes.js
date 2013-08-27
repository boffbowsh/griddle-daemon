module.exports = function(server, models) {
  var App = models.App;

  server.get("/apps", function(req, res) {
    App.all(function(err, apps) {
      res.json(apps);
    });
  }); 
};