'use strict'

var cluster = require('cluster')
var worker = cluster.worker

var Worker = function() {}

Worker.prototype.broadcast = function(method, payload) {
  if (!worker.isConnected())
    return

  if (typeof method !== 'string')
    return

  var message = {
    method: 'cluster.broadcast',
    payload: {
      method: method,
      payload: payload
    }
  }
  process.send(message)
}

Worker.prototype.send = function(to, method, payload) {
  if (!worker.isConnected())
    return

  if (typeof to !== 'number')
    return

  if (typeof method !== 'string')
    return

  var message = {
    method: 'cluster.send',
    payload: {
      method: method,
      payload: payload
    },
    to: to
  }

  process.send(message)
}

Worker.prototype.listen = function() {
  process.on('message', this.onMessage.bind(this))
}

/**
 * Static default methods
 */
Worker.defaultMethods = {}

module.exports = Worker
