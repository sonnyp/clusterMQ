'use strict'

var util = require('util')
var cluster = require('cluster')
var debug = require('./debug')

var Impl = require('./' + (cluster.isMaster ? 'Master' : 'Worker'))

var Broker = function () {
  Impl.call(this, cluster.isMaster ? cluster : cluster.worker)

  this.methods = Object.create(null)
  this.requestHandlers = Object.create(null)
  this.lastId = 0

  var def = Impl.defaultMethods
  for (var i in def) {
    this.addMethod(i, def[i].bind(this))
  }
}
util.inherits(Broker, Impl)

Broker.prototype.generateId = function () {
  return this.lastId++
}

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
  var to = cluster.isMaster ? 'master' : ('worker ' + cluster.worker.id)
  var origin = from === undefined ? 'master' : 'worker ' + from
  debug(to + ' got ' + JSON.stringify(message) + ' from ' + origin)

  if (typeof message !== 'object' || message === null) {
    return
  }

  // response
  if (!('payload' in message) && !('method' in message) && typeof message.id === 'number') {
    return this._onresponse(message.id, message.error, message.result, from)
  }

  if (typeof message.method === 'string') {
    return this._onmethod(message.id, message.method, message.payload, from)
  }
}

Broker.prototype.respond = function (to, id, error, result, from) {
  this._respond(to, id, error, result, from)
}

Broker.prototype._onresponse = function (id, error, result, from) {
  var cb = this.requestHandlers[id]
  if (!cb) return
  cb(error, result, cb)
  delete this.requestHandlers[id]
}

Broker.prototype._onmethod = function (id, method, payload, from) {
  var fn = this.methods[method]
  if (!fn) {
    return
  }

  var that = this
  var cb = function (err, result) {
    if (typeof id !== 'number') {
      return
    }
    that.respond(from, id, err, result)
  }

  fn(payload, cb, from)
}

Broker.prototype.request = function (to, method, payload, fn) {
  if (typeof to !== 'number') {
    throw new TypeError('First argument "to" must be a number')
  }

  if (typeof method !== 'string') {
    throw new TypeError('Second argument "method" must be a string')
  }

  if (2 in arguments && payload === undefined) {
    throw new TypeError('Third argument "payload" must valid JSON')
  }

  if (3 in arguments && typeof fn !== 'function') {
    throw new TypeError('Third argument "payload" must valid JSON')
  }

  var id = this.generateId()
  this.requestHandlers[id] = fn

  this._request(to, id, method, payload)
}

Broker.prototype.addMethod = function (name, fn) {
  this.methods[name] = fn
}

Broker.prototype.removeMethod = function (name) {
  delete this.methods[name]
}

module.exports = Broker
