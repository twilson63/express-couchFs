var req = require('supertest');
var app = require('../')({couch: 'http://localhost:5984/files'});
var nock = require('nock');

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ee')
  .reply(200, { ok: true, 
    id: '6f280dcbbc27bc80dabd4ea0e8005453',
    rev: '1-44351e0a7025bc120b99815f5b0af1ba' });

nock('http://localhost:5984')
  .get('/files/6f280dcbbc27bc80dabd4ea0e80027ee/file')
  .reply(200);

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