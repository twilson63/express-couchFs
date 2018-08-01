var fs = require('fs')
const helmet = require('helmet')
const util = require('util')
const readFile = util.promisify(fs.readFile)
var nano = require('nano')
var express = require('express')
var mime = require('mime')
var multer = require('multer')
var upload = multer({ dest: '/tmp' })
const { path } = require('ramda')

module.exports = function(config) {
  var app = express()

  var server, db

  if (config.couch && !config.request_defaults) {
    db = nano(config.couch)
  } else if (config.request_defaults) {
    server = nano({
      url: config.url,
      request_defaults: config.request_defaults
    })
    db = config.database_parameter_name || 'COUCH_DB'
  } else {
    server = nano(config.url)
    db = config.database_parameter_name || 'COUCH_DB'
  }

  function getDb(req) {
    if (typeof db === 'object') {
      return db
    } else {
      return server.use(req[db])
    }
  }

  app.use(helmet())

  app.get('/:name', async function(req, res) {
    var disposition = req.query.inline ? 'inline' : 'attachment'

    const db = getDb(req)
    const doc = await db
      .get(req.params.name)
      .catch(() => ({ name: 'file not found' }))
    res.set(
      'Content-Disposition',
      disposition + '; filename="' + doc.name + '"'
    )
    if (path(['_attachments', 'file'], doc)) {
      const s = db.attachment.getAsStream(req.params.name, 'file')
      s.on('error', e => {})
      s.pipe(res)
    } else {
      return res.status(404).send({ error: 'file not found' })
    }
  })

  // handle file upload
  app.post('/', upload.single('uploadFile'), async function(req, res) {
    var meta = {
      name: req.file.originalname,
      type: 'file',
      mime: req.file.mimetype,
      size: req.file.size
    }

    var filename = req.file.originalname
    const db = getDb(req)
    try {
      const doc = await db.insert(meta)
      const data = await readFile(req.file.path)
      const response = await db.attachment.insert(
        doc.id,
        'file',
        data,
        meta.mime,
        { rev: doc.rev }
      )
      res.send(response)
    } catch (err) {
      res.status(500).send({ ok: false, error: err.message })
    }
  })

  // app del file
  app.delete('/:name', async function(req, res) {
    try {
      const db = getDb(req)
      const doc = await db.get(req.params.name)
      const response = await db.destroy(req.params.name, doc._rev)
      res.send(response)
    } catch (err) {
      res.status(500).send({ error: err.message })
    }
  })

  return app
}
