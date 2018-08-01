const test = require('tape')
const request = require('supertest')
const url = 'http://localhost:5984/files'
const app = require('../')({ couch: url })
var nock = require('nock')

nock('http://localhost:5984')
  .post('/files')
  .reply(201, {
    ok: true,
    id: '6f280dcbbc27bc80dabd4ea0e8005453',
    rev: '1-44351e0a7025bc120b99815f5b0af1ba'
  })
nock('http://localhost:5984')
  .put(
    '/files/6f280dcbbc27bc80dabd4ea0e8005453/file?rev=1-44351e0a7025bc120b99815f5b0af1ba'
  )
  .reply(201, { ok: true })
nock('http://localhost:5984')
  .post('/files')
  .reply(500)

test('upload file successfully', t => {
  request(app)
    .post('/')
    .attach('uploadFile', 'test/fixtures/spaghetti-code.jpg')
    .then(({ body }) => {
      t.ok(body.ok)
      t.end()
    })
})

test('upload text file should return error', t => {
  request(app)
    .post('/')
    .attach('uploadFile', 'test/fixtures/foo.txt')
    .then(({ statusCode }) => {
      t.equals(statusCode, 500)
      t.end()
    })
})
