var req = require('supertest');
var app = require('../')({couch: 'http://localhost:5984/files'});
var nock = require('nock');
var expect = require('expect.js');

var response = {
  mime: 'text/plain',
  ok: true,
  id: '6f280dcbbc27bc80dabd4ea0e8005453',
  rev: '1-44351e0a7025bc120b99815f5b0af1ba'
};

var error = {
  "headers": {
    "uri": "http://localhost:5984",
    "content-type": "application/json",
  },
  "error": "some illegal action",
  "message": "some couch message",
  "request": {
    "uri": "http://localhost:5984",
    "auth": {
      "username": "user",
      "password": "pass"
    }
  }
};

// Standard request
nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ee')
  .reply(200, response);

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ee/file')
  .reply(200, response);

// Request with query string
nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ff')
  .query({inline: true})
  .reply(200, response);

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ff/file')
  .query({inline: true})
  .reply(200, response);

// Bad request
nock('http://localhost:5984')
  .get('/files/badrequest')
  .reply(400, error);

// Request with query string
nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ff')
  .query({inline: true})
  .reply(200, response);

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ff/file')
  .query({inline: true})
  .reply(200, response);

// Bad request
nock('http://localhost:5984')
  .get('/files/bar')
  .reply(404);

describe('CouchFs GET /:name', function() {
  it('should be successful', function(done) {
    req(app)
      .get('/6f280dcbbc27bc80dabd4ea0e80027ee')
      .expect(200, done);
  });

  it('should be not found', function(done) {
    req(app)
      .get('/bar')
      .expect(404, done);
  });

});

describe('CouchFs GET /:name with a bad request', function() {
  it('does not send sensitive data to the client', function(done) {
    req(app)
      .get('/badrequest')
      .expect(400)
      .end(function(err, res) {
      if (err) {
        throw err;
      }
      var parsed = JSON.parse(res.text);
      expect(parsed.request).to.eql({});
      expect(parsed.headers).to.eql({ 'content-type': 'application/json' });
      done();
    });
  });
});

describe('CouchFs GET /:name with attachment options', function() {
  // TODO: I dont think couch likes the concurrent requests. Kept
  // getting connection errors, hence the timeout
  setTimeout(function () {
    it('should default to download', function(done) {
      req(app)
        .get('/6f280dcbbc27bc80dabd4ea0e80027ee')
        .expect('Content-Disposition', /attachment/)
        .expect(200, done);
    });
  }, 200);


  it('should allow inline attachments', function(done) {
    req(app)
      .get('/6f280dcbbc27bc80dabd4ea0e80027ff')
      .query({inline: true})
      .expect('Content-Disposition', /inline/)
      .expect(200, done);
  });
})
