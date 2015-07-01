'use strict'

var EventEmitter = require('events').EventEmitter
var assert = require('assert')
var Worker = require('../lib/Worker')

describe('Worker', function() {

  var broker
  var worker

  beforeEach(function() {
    worker = new EventEmitter()
    worker.send = function() {}
    worker.isConnected = true
    broker = new Worker(worker)
    broker._onmessage = function() {}
  })

  describe('_broadcast', function() {

    it('sends a cluster.broadcast message to the proc', function(done) {
      worker.send = function(message) {
        assert.deepEqual(message, {method: 'cluster.broadcast', payload: {method: 'foo', payload: {}}})
        done()
      }
      broker._broadcast('foo', {})
    })

  })

  describe('_send', function() {

    it('sends a cluster.send message to the proc', function(done) {
      worker.send = function(message) {
        assert.deepEqual(message, {method: 'cluster.send', payload: {to: 42, method: 'foo', payload: true}})
        done()
      }
      broker._send(42, 'foo', true)
    })

  })

  describe('listen', function() {

    it('starts listening on process for messages and calls _onmessage', function(done) {
      var message = {}
      broker._onmessage = function(m) {
        assert.equal(m, message)
        done()
      }
      broker.listen()
      worker.emit('message', message)
    })

  })

  describe('close', function() {

    it('stops listening on process', function() {
      broker._onmessage = function() {
        throw new Error('_onmessage should not have been called')
      }
      broker.listen()
      broker.close()
      worker.emit('message', {})
    })

  })

})
