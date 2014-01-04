var fs = require('fs');
var nano = require('nano');
var express = require('express');
var mime = require('mime');

module.exports = function(config) {
  var app = express();

  var server, db;

  if (config.couch) {
    db = nano(config.couch);
  } else {
    server = nano(config.url);
    db = config.database_parameter_name || 'COUCH_DB';
  }

  function getDb(req) {
    if (typeof db === 'object') {
      return db;
    } else {
      return server.use(req[db]);
    }
  }

  app.get('/:name', function(req, res) {
    getDb(req).get(req.params.name, function(e, doc) {
      if (e) { return res.send(e.status_code, e); }
      var headers = {'Content-Type': doc.mime};
      if (!/png|jpg|gif/.test(doc.mime)) {
        headers['Content-Disposition'] = 'attachment; filename="' + doc.name + '"';
      }
      // file type -- as mime type
      //Content-Disposition: attachment; filename="fname.ext"
      getDb(req).attachment.get(req.params.name, 'file', function(err, body) {
        if (err) { return res.send(err.status_code, err); }
        res.writeHead(200, headers);
        res.end(body);
      });
    });
  });

  // handle file upload
  app.post('/', express.multipart(), function(req, res) {
    var meta = {
      name: req.files.uploadFile.name,
      type: 'file',
      mime: req.files.uploadFile.type,
      size: req.files.uploadFile.size
    };

    var filename = req.files.uploadFile.name;
    getDb(req).insert(meta, attachFile);

    function attachFile(err, body) {
      if (err) { return res.send(500, err); }
      fs.readFile(req.files.uploadFile.path, function(err, data) {
        if (err) { return res.send(500, err); }
        getDb(req).attachment.insert(body.id, 'file', data, meta.type, 
          { rev: body.rev }, function(e,b) {
            if (e) { return res.send(500, e); }
            res.send(b);
          })
      });
    }
  });

  // app del file
  app.del('/:name', function(req, res) {
    getDb(req).get(req.params.name, function(err, body) {
      if (err) { return res.send(err.status_code, err); }
      getDb(req).destroy(req.params.name, body._rev).pipe(res);
    });
  });
  
  return app;
};
