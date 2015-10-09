/* global describe, it, beforeEach */

'use strict'

var EventEmitter = require('events').EventEmitter
var assert = require('assert')
var Master = require('../lib/Master')

var makeWorker = function (id) {
  var worker = new EventEmitter()
  worker.id = id
  worker.isConnected = function () {
    return true
  }
  return worker
}

describe('Master', function () {
  var broker
  var cluster
  var worker

  beforeEach(function () {
    worker = makeWorker(1)
    cluster = new EventEmitter()
    cluster.workers = {}
    cluster.workers[worker.id] = worker
    broker = new Master(cluster)
    broker._onmessage = function () {}
  })

  describe('_broadcast', function () {
    it('sends a message to all workers', function () {
      worker.send = function (message) {
        assert.deepEqual(message, {method: 'foo', payload: {}})
      }
      broker._broadcast('foo', {})
    })
  })

  describe('_send', function () {
    it('sends a message to the worker', function () {
      broker.listen()
      worker.send = function (message) {
        assert.deepEqual(message, {method: 'foo', payload: true})
      }
      broker._send(1, 'foo', true)
    })
  })

  describe('listen', function () {
    it('starts listening on all connected workers for message and calls _onmessage', function (done) {
      var message = {}
      broker._onmessage = function (m) {
        assert.equal(m, message)
        done()
      }
      assert.equal(EventEmitter.listenerCount(cluster, 'online'), 0)
      assert.equal(EventEmitter.listenerCount(cluster, 'disconnect'), 0)
      broker.listen()
      assert.equal(EventEmitter.listenerCount(cluster, 'online'), 1)
      assert.equal(EventEmitter.listenerCount(cluster, 'disconnect'), 1)
      worker.emit('message', message)
    })

    it('starts listening for online workers', function () {
      assert.equal(EventEmitter.listenerCount(cluster, 'online'), 0)
      broker.listen()
      assert.equal(EventEmitter.listenerCount(cluster, 'online'), 1)
    })

    it('starts listening for disconnected workers', function () {
      assert.equal(EventEmitter.listenerCount(cluster, 'disconnect'), 0)
      broker.listen()
      assert.equal(EventEmitter.listenerCount(cluster, 'disconnect'), 1)
    })

    it('listens on newly connected workers', function () {
      broker.listen()
      var newWorker = makeWorker(2)
      assert.equal(EventEmitter.listenerCount(newWorker, 'message'), 0)
      cluster.emit('online', newWorker)
      assert.equal(EventEmitter.listenerCount(newWorker, 'message'), 1)
    })

    it('stop listening on disconnected workers', function () {
      broker.listen()
      assert.equal(EventEmitter.listenerCount(worker, 'message'), 1)
      cluster.emit('disconnect', worker)
      assert.equal(EventEmitter.listenerCount(worker, 'message'), 0)
    })
  })

  describe('close', function () {
    it('stops listening for messages on workers', function () {
      broker.listen()
      assert.equal(EventEmitter.listenerCount(worker, 'message'), 1)
      broker.close()
      assert.equal(EventEmitter.listenerCount(worker, 'message'), 0)
    })

    it('stops listening for online workers', function () {
      broker.listen()
      assert.equal(EventEmitter.listenerCount(cluster, 'online'), 1)
      broker.close()
      assert.equal(EventEmitter.listenerCount(cluster, 'online'), 0)
    })

    it('stops listening for disconnected workers', function () {
      broker.listen()
      assert.equal(EventEmitter.listenerCount(cluster, 'disconnect'), 1)
      broker.close()
      assert.equal(EventEmitter.listenerCount(cluster, 'disconnect'), 0)
    })
  })
})
