# express-couchFs

A express module that provides a simple file upload api using couchDb as file storage.

## Usage

``` js
var couchFs = require('express-couchdb-fs');

app.configure(function() {
  app.use(couchFs({couch: 'http://localhost:5984/fs'}));
});
```

## API

### POST /api/file

The post statement can be a FORM Post or XHR2 post, the important aspect is that the body contains a file field named: `uploadFile`

On Success, this returns the couchdb generated document response:

```
{
  ok: true,
  id: xxxxx,
  rev: xxxx
}
```

### GET /api/file/:id

Grabs the file and downloads it to the client with a save as dialog.

### DELETE /api/file/:id