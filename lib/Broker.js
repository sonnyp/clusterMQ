'use strict'

var util = require('util')
var cluster = require('cluster')

var Impl = require('./' + (cluster.isMaster ? 'Master' : 'Worker'))

var Broker = function () {
  Impl.call(this, cluster.isMaster ? cluster : cluster.worker)

  this.methods = Object.create(null)

  var def = Impl.defaultMethods
  for (var i in def) {
    this.addMethod(i, def[i].bind(this))
  }
}
util.inherits(Broker, Impl)

Broker.prototype.send = function (to, method, payload) {
  if (typeof to !== 'number') {
    throw new TypeError('First argument "to" must be a number')
  }

  if (typeof method !== 'string') {
    throw new TypeError('Second argument "method" must be a string')
  }

  if (2 in arguments && payload === undefined) {
    throw new TypeError('Third argument "payload" must valid JSON')
  }

  this._send.apply(this, arguments)
}

Broker.prototype.broadcast = function (method, payload) {
  if (typeof method !== 'string') {
    throw new TypeError('First argument "method" must be a string')
  }

  if (1 in arguments && payload === undefined) {
    throw new TypeError('Second argument "payload" must valid JSON')
  }

  this._broadcast.apply(this, arguments)
}

Broker.prototype._onmessage = function (message, from) {
  if (typeof message !== 'object' || message === null) {
    return
  }

  var method = message.method
  if (typeof method !== 'string') {
    return
  }

  var fn = this.methods[method]
  if (!fn) {
    return
  }

  fn(message.payload, from)
}

Broker.prototype.addMethod = function (name, fn) {
  this.methods[name] = fn
}

Broker.prototype.removeMethod = function (name) {
  delete this.methods[name]
}

module.exports = Broker
