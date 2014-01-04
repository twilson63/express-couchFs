var req = require('supertest');
var app = require('../')({couch: 'http://localhost:5984/files'});
var nock = require('nock');

//nock.recorder.rec();

nock('http://localhost:5984')
  .get('/files/bar')
  .reply(200, { ok: true, _id: 'bar', _rev: '1' });

nock('http://localhost:5984')
  .delete('/files/bar?rev=1')
  .reply(200, { ok: true });

describe('CouchFs DELETE /:name', function() {
  it('should be successful', function(done) {
    req(app)
      .del('/bar')
      .expect(200, done);
  });
  it('should return not found', function(done) {
    req(app)
      .del('/foo')
      .expect(404, done);
  });
});