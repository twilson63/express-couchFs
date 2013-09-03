var fs = require('fs');
var nano = require('nano');
var express = require('express');
var mime = require('mime');

var app = express();

module.exports = function(config) {
  var db = nano(config.couch);

  app.get('/api/file/:name', function(req, res) {
    db.get(req.params.name, function(e, doc) {
      var headers = {'Content-Type': doc.mime};
      if (!/png|jpg|gif/.test(doc.mime)) {
        headers['Content-Disposition'] = 'attachment; filename="' + doc.name + '"';
      }
      // file type -- as mime type
      //Content-Disposition: attachment; filename="fname.ext"
      db.attachment.get(req.params.name, 'file', function(err, body) {
        res.writeHead(200, headers);
        res.end(body);
      });
    });
  });

  // handle file upload
  app.post('/api/file', function(req, res) {
    var meta = {
      name: req.files.uploadFile.name,
      type: 'file',
      mime: req.files.uploadFile.type,
      size: req.files.uploadFile.size
    };

    var filename = req.files.uploadFile.name;
    db.insert(meta, attachFile);

    function attachFile(err, body) {
      if (err) { return res.send(500, err); }
      fs.readFile(req.files.uploadFile.path, function(err, data) {
        if (err) { return res.send(500, err); }
        db.attachment.insert(body.id, 'file', data, meta.type, 
          { rev: body.rev }, function(e,b) {
            if (e) { return res.send(500, e); }
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
