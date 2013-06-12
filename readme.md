# express-couchFs

A express module that provides a simple file upload api using couchDb as file storage.

## Usage

``` js
var couchFs = require('express-couchFs');

app.configure(function() {
  app.use(couchFs(config));
});
```