'use strict'

// var debug = require('./debug')

var Worker = function (worker) {
  this.worker = worker
  this.listening = false

  var self = this
  this.eventListener = function (message) {
    self._onmessage(message, message.from)
  }
}

Worker.prototype._broadcast = function (method, payload) {
  var message = {
    method: 'cluster.broadcast',
    payload: {
      method: method,
      payload: payload
    }
  }
  this.worker.send(message)
}

Worker.prototype._send = function (to, method, payload) {
  var message = {
    method: 'cluster.send',
    payload: {
      to: to,
      method: method,
      payload: payload
    }
  }

  this.worker.send(message)
}

Worker.prototype._request = function (to, id, method, payload) {
  var message = {
    method: 'cluster.request',
    payload: {
      to: to,
      id: id,
      method: method,
      payload: payload
    }
  }

  this.worker.send(message)
}

Worker.prototype._respond = function (to, id, error, result) {
  var message
  var payload = {to: to, id: id, error: error, result: result}

  // reply to cluster
  if (to === undefined) {
    message = payload
  // reply to worker
  } else {
    message = {
      method: 'cluster.respond',
      payload: payload
    }
  }

  this.worker.send(message)
}

Worker.prototype.listen = function () {
  if (this.listening) return

  this.worker.on('message', this.eventListener)
  this.listening = true
}

Worker.prototype.close = function () {
  this.worker.removeListener('message', this.eventListener)
}

Worker.defaultMethods = {}

module.exports = Worker
