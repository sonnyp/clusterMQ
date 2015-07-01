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
    broker.onMessage = function() {}
  })

  describe('_broadcast', function() {

    it('sends a cluster.broadcast message to the proc', function() {
      worker.send = function(message) {
        assert.deepEqual(message, {method: 'cluster.broadcast', payload: {method: 'foo', payload: {}}})
      }
      broker._broadcast('foo', {})
    })

  })

  describe('_send', function() {

    it('sends a cluster.send message to the proc', function() {
      worker.send = function(message) {
        assert.deepEqual(message, {method: 'cluster.send', payload: {to: 42, method: 'foo', payload: true}})
      }
      broker._send(42, 'foo', true)
    })

  })

  describe('listen', function() {

    it('starts listening on process for messages and calls onMessage', function() {
      var message = {}
      broker.onMessage = function(m) {
        assert.equal(m, message)
      }
      broker.listen()
      worker.emit('message', message)
    })

  })

  describe('close', function() {

    it('stops listening on process', function() {
      broker.onMessage = function() {
        throw new Error('onMessage should not have been called')
      }
      broker.listen()
      broker.close()
      worker.emit('message', {})
    })

  })

})
