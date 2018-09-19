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
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ff')
  .reply(200, {
    _id: '6f280dcbbc27bc80dabd4ea0e80027ff',
    _rev: '1',
    name: 'bar.jpg',
    _attachments: {
      file: {
        'content-type': 'image/jpg'
      }
    }
  })

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ff/file')
  .replyWithFile(200, __dirname + '/fixtures/spaghetti-code.jpg')

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ffa')
  .reply(200, {
    _id: '6f280dcbbc27bc80dabd4ea0e80027ffa',
    _rev: '1',
    name: 'foo.jpg',
    _attachments: {
      file: {
        'content-type': 'image/jpg'
      }
    }
  })

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ffa/file')
  .reply(200, response)

test('get image', t => {
  request(app)
    .get('/6f280dcbbc27bc80dabd4ea0e80027ff')
    .then(res => {
      t.equals(
        res.headers['content-disposition'],
        'attachment; filename="bar.jpg"'
      )
      t.equals(res.headers['content-type'], 'image/jpeg')
      t.equals(res.statusCode, 200)
      t.end()
    })
})

test('get image inline', t => {
  request(app)
    .get('/6f280dcbbc27bc80dabd4ea0e80027ffa')
    .query({ inline: true })
    .then(res => {
      t.equals(res.headers['content-disposition'], 'inline; filename="foo.jpg"')

      t.equals(res.statusCode, 200)
      t.end()
    })
})
