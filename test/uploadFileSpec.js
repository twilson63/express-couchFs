var req = require('supertest');
var app = require('../')({couch: 'http://localhost:5984/files'});
var nock = require('nock');

describe('CouchFs POST /', function() {
  before(function() {
    nock('http://localhost:5984')
      .post('/files')
      .reply(201, { ok: true, 
        id: '6f280dcbbc27bc80dabd4ea0e8005453',
        rev: '1-44351e0a7025bc120b99815f5b0af1ba' });
    nock('http://localhost:5984')
      .put('/files/6f280dcbbc27bc80dabd4ea0e8005453/file?rev=1-44351e0a7025bc120b99815f5b0af1ba')
      .reply(201, { ok: true });
    nock('http://localhost:5984')
      .post('/files')
      .reply(500);

  });
  it('should be successful', function(done) {
    req(app)
      .post('/')
      .attach('uploadFile', 'test/fixtures/spaghetti-code.jpg')
      .expect(200, {ok: true}, done);
  });
  it('should handle error', function(done) {
    req(app)
      .post('/')
      .attach('uploadFile', 'test/fixtures/foo.txt')
      .expect(500, done);
  });
});