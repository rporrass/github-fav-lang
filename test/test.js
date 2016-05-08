'use strict';
/*jshint expr: true*/
var sinon = require('sinon');
var Lab = require('lab');
var Code = require('code');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.it;
var expect = Code.expect;

var PassThrough = require('stream').PassThrough;
var http = require('http');

var commandProcessor = require('../lib/command-processor');

beforeEach(function(next) {
  sinon.stub(http, 'request', function(options, callback) {
    var statusCode = 200;
    var data;
    if (options.path.match(/(\/[^\/]*)*user\-exists\-with\-result(\/[^\/]*)*/)) {
      data = JSON.stringify([{language: 'JavaScript'}, {language: 'JavaScript'}, {language: 'Java'}]);
    }
    else if (options.path.match(/(\/[^\/]*)*user\-exists\-with\-no\-result(\/[^\/]*)*/)) {
      data = JSON.stringify([]);
    }
    if (options.path.match(/(\/[^\/]*)*user\-error(\/[^\/]*)*/)) {
      statusCode = 400;
      data = JSON.stringify([{language: 'JavaScript'}]);
    }

    callback({
      statusCode: statusCode,
      headers: {'content-type': 'application/json'},
      setEncoding: function() {},
      on: function(event, value) {
        if (event === 'data') {
          value(data);
        }
        else if (event === 'end') {
          value();
        }
      }
    });

    return new PassThrough();
  });
  next();
});

afterEach(function(next) {
  http.request.restore();
  next();
});

describe('test user exists ', function() {

  it('"user-exists-with-result" has results', function(done) {
    var cmdLineArgs = ['node', 'solution.js', '-u', 'user-exists-with-result', '-gptc', 'http', '-gh', 'localhost', '-gprt', '80', '-gpp', 'path'];
    commandProcessor.run(cmdLineArgs, function(err, result) {
      expect(err).to.be.null;
      expect(result).to.deep.equal({JavaScript: 4});
      done();
    });
  });

  it('"user-exists-with-no-result" has no results', function(done) {
    var cmdLineArgs = ['node', 'solution.js', '-u', 'user-exists-with-no-result', '-gptc', 'http', '-gh', 'localhost', '-gprt', '80', '-gpp', 'path'];
    commandProcessor.run(cmdLineArgs, function(err, result) {
      expect(err).to.be.null;
      expect(result).to.deep.equal({});
      done();
    });
  });

});

describe('error cases', function() {
  it('request has fail', function(done) {
    var cmdLineArgs = ['node', 'solution.js', '-u', 'user-error', '-gptc', 'http', '-gh', 'localhost', '-gprt', '80', '-gpp', 'path'];
    commandProcessor.run(cmdLineArgs, function(err, result) {
      expect(err).to.not.be.null;
      expect(result).to.be.null;
      done();
    });
  });
});
