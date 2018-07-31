const test = require('tape')
const request = require('supertest')
const url = 'http://localhost:5984/files'
const app = require('../')({ couch: url })
var nock = require('nock')

var response = {
  mime: 'text/plain',
  ok: true,
  id: '6f280dcbbc27bc80dabd4ea0e8005453',
  rev: '1-44351e0a7025bc120b99815f5b0af1ba'
}

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ff/file')
  .reply(200, response)

test('get image', t => {
  request(app)
    .get('/6f280dcbbc27bc80dabd4ea0e80027ff')
    .then(res => {
      t.equals(res.statusCode, 200)
      t.end()
    })
})
