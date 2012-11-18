/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var util = require('util');
var should = require('should');
var rewire = require('rewire');
var Pool = rewire(__dirname + '/../lib/pool.js');
var Common = require(__dirname + '/common.js');

var Connection = Common.mockConnection();

beforeEach(function () {
  Connection.makesureCleanAllData();
  Connection.__mockQueryResult(/SHOW\s+Variables\s+like\s+"READ_ONLY"/i, [{
    'Variable_Name' : 'READ_ONLY', 'Value' : 'OFF'
  }]);

  Pool.__set__({
    'HEARTBEAT_TIMEOUT' : 5,
    'Connection' : Connection,
  });
});

describe('mysql pool', function () {

  it('should_pool_get_and_release_works_fine', function (done) {
    var _me = Pool.create({
      'maxconnections' : 4, 'maxidletime' : 100,
    });

    _me._queue.should.eql([]);
    _me._stack.should.eql([]);

    var _messages = [];
    ['state', 'error'].forEach(function (i) {
      _me.on(i, function () {
        _messages.push([i].concat(Array.prototype.slice.call(arguments)));
      });
    });
    _me.query('query1', function (e, r) {
      _messages.should.eql([['state', 3]]);
      //Connection.__emitEvent(0, 'close');
      process.nextTick(function () {
        _me._queue.should.eql([]);
        _me._stack.should.eql([1]);
        done();
      });
    });
  });

  /* {{{ should_pool_create_works_fine() */
  it('should_pool_create_works_fine', function (done) {
    var _me = Pool.create({
      'maxidletime' : 32,
    }, {});

    var _messages = [];
    ['state', 'error'].forEach(function (i) {
      _me.on(i, function () {
        _messages.push([i].concat(Array.prototype.slice.call(arguments, 0)));
      });
    });

    Connection.__emitEvent(0, 'close');

    setTimeout(function () {
      /*
      _messages.should.eql([
        ['state', 3]
        ]);
        */
      done();
    }, 32);
  });
  /* }}} */

});

