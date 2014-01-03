var path = require('path');
var fs = require('fs');
var request = require('request');
var expect = require('expect.js');
var express = require('express');
var couchFs = require('../');

var couchUrl = 'http://localhost:5984';
var serverUrl = 'http://localhost:3000';

describe('Core Api', function() {

    describe('standard configuration', function() {
        var db_name = 'foo';
        var db_url = couchUrl + '/' + db_name;
        var app = express();
        var server;

        before(function(done) {
            app.use(express.bodyParser());
            app.use('/api/file', couchFs({couch: db_url}));
            server = app.listen(3000);

            request.put(db_url, done);
            
        });

        after(function(done) {
            server.close();
            request.del(db_url, done);
        });

        tests(db_name);
    });

    describe('alternate configuration', function() {
        var db_name = 'foo2';
        var db_url = couchUrl + '/' + db_name;
        var db_request_parameter = 'DB_NAME';
        var app = express();
        var server;

        before(function(done) {
            app.use(express.bodyParser());
            app.use(function(req, res, next) {
              req[db_request_parameter] = db_name;
              next();
            });
            app.use('/api/file',couchFs({
                url: couchUrl, 
                database_parameter_name: db_request_parameter 
            }));
            server = app.listen(3000);

            request.put(db_url, done);
            
        });

        after(function(done) {
            server.close();
            request.del(db_url, done);
        });

        tests(db_name);
    });

    function postFile(cb) {
        var sampleFilePath = path.join(__dirname, '..', 'testFiles', 'sample.txt');

        var r = request.post(serverUrl + '/api/file', cb);
        var form = r.form();    
        form.append('uploadFile', fs.createReadStream(sampleFilePath));
    }

    function tests(db_name) {
        describe('POST /api/file', function() {
            var result;

            it('should store a file', function(done) {
                
                postFile(testStore);

                function testStore(err, response, body) {
                    if (err) { throw err; }
                    result = JSON.parse(body);
                    expect(result.ok).to.be.ok();
                    done();
                }
                
            });

            after(function(done) {
                request.del(couchUrl + '/' + db_name + '/' + result.id + '?rev=' + result.rev, done);
            });

        });

        describe('GET /api/file/:name', function() {
            var result;

            before(function(done) {
                postFile(captureResult);

                function captureResult(err, response, body) {
                    if (err) { throw err; }
                    result = JSON.parse(body);
                    done();
                }
            });

            it("should return a document", function(done) {
                request.get(serverUrl + '/api/file/' + result.id, function(err, response, body) {
                    if (err) { throw err; }
                    expect(response.headers['content-type']).to.be('text/plain');
                    expect(body).to.be('This is a test!');
                    done();
                });
            });

            after(function(done) {
                request.del(couchUrl + '/' + db_name + '/' + result.id + '?rev=' + result.rev, done);
            });
        });
        

        describe('DEL /api/file/:name', function() {
            var result;

            before(function(done) {
                postFile(captureResult);

                function captureResult(err, response, body) {
                    if (err) { throw err; }
                    result = JSON.parse(body);
                    done();
                }
            });

            it('should delete a document', function(done) {
                request.del(serverUrl + '/api/file/' + result.id, function(err, response, body) {
                    if (err) { throw err; }
                    var result = JSON.parse(body);
                    expect(result.ok).to.be.ok();
                    request.get(couchUrl + '/' + db_name + '/' + result.id, function(err, response, body) {
                        var getResult = JSON.parse(body);
                        expect(getResult.error).to.be('not_found');
                        expect(getResult.reason).to.be('deleted');
                        done();    
                    });
                    
                });
            });

        });
    }

});