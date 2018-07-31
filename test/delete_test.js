const test = require('tape')
const request = require('supertest')
// const url = 'https://files:files@twilson63.jrscode.cloud/files'
const url = 'http://localhost:5984/files'
const app = require('../')({ couch: url })

var nock = require('nock')

nock('http://localhost:5984')
  .get('/files/bar')
  .reply(200, { ok: true, _id: 'bar', _rev: '1' })

nock('http://localhost:5984')
  .delete('/files/bar?rev=1')
  .reply(200, { ok: true })

nock('http://localhost:5984')
  .get('/files/foo')
  .reply(500, { error: 'not found' })

test('delete image success', t => {
  request(app)
    .delete('/bar')
    .then(res => {
      t.ok(res.body.ok)
      t.end()
    })
})

test('delete image not found', t => {
  request(app)
    .delete('/foo')
    .then(res => {
      t.equals(res.statusCode, 500)
      t.end()
    })
})
