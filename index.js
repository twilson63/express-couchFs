var fs = require('fs');
var nano = require('nano');
var express = require('express');
var mime = require('mime');

var app = express();

module.exports = function(config) {
  var db = nano(config.couch);

  app.get('/api/file/:name', function(req, res) {
    db.attachment.get(req.params.name, 'file', function(err, body) {
      res.writeHead(200, {'Content-Type': mime.lookup(req.params.name) })
      res.end(body);
    });
  });

  // handle file upload
  app.post('/api/file', function(req, res) {
    var meta = {
      name: req.files.uploadFile.name,
      type: req.files.uploadFile.type,
      size: req.files.uploadFile.size
    };

    var filename = req.files.uploadFile.name;
    db.insert(meta, attachFile);
    function attachFile(err, body) {
      if (err) { return res.send(err); }
      fs.readFile(req.files.uploadFile.path, function(err, data) {
        if (err) { return res.send(err); }
        db.attachment.insert(body.id, 'file', data, meta.type, 
          { rev: body.rev }, function(e,b) {
            if (e) { return res.send(e); }
            res.send(b);
          })
      });
    }
  });

  // app del file
  app.del('/api/file/:name', function(req, res) {
    db.get(req.params.name, function(err, body) {
      db.destroy(req.params.name, body._rev).pipe(res);
    });
  });
  
  return app;
};
