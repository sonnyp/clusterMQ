'use strict'

var Worker = function(worker) {
  this.worker = worker
  this.listening = false

  var self = this
  this.eventListener = function(message) {
    self._onmessage(message)
  }
}

Worker.prototype._broadcast = function(method, payload) {
  var message = {
    method: 'cluster.broadcast',
    payload: {
      method: method,
      payload: payload
    }
  }
  this.worker.send(message)
}

Worker.prototype._send = function(to, method, payload) {
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

Worker.prototype.listen = function() {
  if (this.listening)
    return

  this.worker.on('message', this.eventListener)
  this.listening = true
}

Worker.prototype.close = function() {
  this.worker.removeListener('message', this.eventListener)
}

Worker.defaultMethods = {}

module.exports = Worker
