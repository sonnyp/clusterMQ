'use strict'

var util = require('util')
var cluster = require('cluster')

var Impl = require('./' + (cluster.isMaster ? 'Master' : 'Worker'))

/**
 * Creates the ClusterMQ object and defines to methods for Master and the Worker
 */
var ClusterMQ = function() {
  Impl.call(this)

  this.methods = Object.create(null)

  var def = Impl.defaultMethods
  for (var i in def) {
    this.addMethod(i, def[i].bind(this))
  }
}
util.inherits(ClusterMQ, Impl)

/**
 * Checks if the message is a valid RPC message and prepare the data
 * for the RPC method
 *
 * @param {Object} message
 */
ClusterMQ.prototype.onMessage = function(message) {
  if (typeof message !== 'object')
    return

  var method = message.method
  if (typeof method !== 'string')
    return

  var fn = this.methods[method]
  if (!fn)
    return

  var meta = {}
  if (message.from)
    meta.from = message.from
  if (message.to)
    meta.to = message.to

  fn(message.payload, meta)
}

/**
 * add RPC method
 * @param {name}      - method name
 * @param {Function}  - function
 */
ClusterMQ.prototype.addMethod = function(name, fn) {
  this.methods[name] = fn
}

/**
 * remove RPC method
 * @param  {name}  - method name
 */
ClusterMQ.prototype.removeMethod = function(name) {
  delete this.methods[name]
}

module.exports = ClusterMQ
