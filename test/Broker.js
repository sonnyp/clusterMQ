'use strict'

var assert = require('assert')
var Broker = require('../lib/Broker')

describe('Broker', function() {

  var broker

  beforeEach(function() {
    broker = new Broker()
  })

  describe('broadcast', function() {

    it('throws an error if method argument is not a string', function() {
      [42, undefined, null, {}, [], true].forEach(function(v) {
        assert.throws(function() {
          broker.broadcast(v)
        }, TypeError)
      })
    })

    it('throws an error if payload argument is undefined', function() {
      assert.throws(function() {
        broker.broadcast('foo', undefined)
      }, TypeError)
    })

    it('calls _broadcast with passed arguments', function() {
      broker._broadcast = function(method) {
        assert.equal(method, 'foo')
      }
      broker.broadcast('foo')
    })

  })

  describe('send', function() {

    it('throws an error if to argument is not a number', function() {
      ['foo', undefined, null, {}, [], true].forEach(function(v) {
        assert.throws(function() {
          broker.send(v, 'foo')
        }, TypeError)
      })
    })

    it('throws an error if method argument is not a string', function() {
      [42, undefined, null, {}, [], true].forEach(function(v) {
        assert.throws(function() {
          broker.send(42, v)
        }, TypeError)
      })
    })

    it('throws an error if payload argument is undefined', function() {
      assert.throws(function() {
        broker.send(42, 'foo', undefined)
      }, TypeError)
    })

    it('calls _send with passed arguments', function() {
      broker._send = function(to, method) {
        assert.equal(to, 42)
        assert.equal(method, 'foo')
      }
      broker.send(42, 'foo')
    })

  })

  describe('addMethod', function() {

    it('adds the method to .methods', function() {
      var method = function() {}
      broker.addMethod('foo', method)
      assert.equal(broker.methods.foo, method)
    })

  })

  describe('removeMethod', function() {

    it('removes the method from .methods', function() {
      broker.addMethod('foo', function() {})
      broker.removeMethod('foo')
      assert(!broker.methods.foo)
    })

  })

  describe('_onmessage', function() {

    it('calls the method payload', function(done) {
      var payload = {}
      broker.addMethod('foo', function(p) {
        assert.equal(p, payload)
        done()
      })
      broker._onmessage({method: 'foo', payload: payload})
    })
  })

})
