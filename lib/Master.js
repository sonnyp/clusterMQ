'use strict'

var Master = function(cluster) {
  this.cluster = cluster
  this.workers = cluster.workers

  var self = this
  this._onlineListener = function(worker) {
    worker.on('message', self._messageListener)
  }
  this._disconnectListener = function(worker) {
    worker.removeListener('message', self._messageListener)
  }
  this._messageListener = function(message) {
    if (typeof message === 'object')
      message.from = this.id
    self._onmessage(message)
  }
}

Master.prototype._broadcast = function(method, payload, from) {
  for (var i in this.workers) {
    var worker = this.workers[i]

    if (from === worker.id || !worker.isConnected() || worker.isDead())
      continue

    var message = {
      method: method,
      payload: payload
    }
    if (typeof from === 'number')
      message.from = from

    worker.send(message)
  }
}

Master.prototype._send = function(to, method, payload, from) {
  var worker = this.workers[to]

  var message = {
    method: method,
    payload: payload
  }
  if (typeof from === 'number')
    message.from = from

  worker.send(message)
}

Master.prototype.listen = function() {
  for (var i in this.cluster.workers) {
    var worker = this.cluster.workers[i]
    if (worker.isConnected())
      worker.on('message', this._messageListener)
  }

  this.cluster.on('online', this._onlineListener)
  this.cluster.on('disconnect', this._disconnectListener)
}

Master.prototype.close = function() {
  this.cluster.removeListener('online', this._onlineListener)
  this.cluster.removeListener('disconnect', this._disconnectListener)
  for (var i in this.workers) {
    var worker = this.workers[i]
    worker.removeListener('message', this._messageListener)
  }
}

Master.defaultMethods = {
  'cluster.broadcast': function(payload, meta) {
    if (typeof payload !== 'object')
      return

    var method = payload.method
    if (typeof method !== 'string')
      return

    this._broadcast(method, payload.payload, meta.from)
  },
  'cluster.send': function(payload, meta) {
    if (typeof payload !== 'object')
      return

    var method = payload.method
    if (typeof method !== 'string')
      return

    this._send(meta.to, method, payload.payload, meta.from)
  }
}

module.exports = Master
