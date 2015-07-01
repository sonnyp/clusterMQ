'use strict'

var Master = function(cluster) {
  this.cluster = cluster
  this.workers = cluster.workers

  var self = this
  this.onlineListener = function(worker) {
    self.setupWorker(worker)
  }
  this.messageListener = function(message) {
    if (typeof message === 'object')
      message.from = this.id
    self.onMessage(message)
  }
}

Master.prototype.setupWorker = function(worker) {
  var self = this
  worker.on('message', this.messageListener)
  worker.once('disconnect', function() {
    worker.removeListener('message', self.onMessage)
    delete self.workers[worker.id]
  })
  this.workers[worker.id] = worker
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
  for (var i in this.workers) {
    var worker = this.workers[i]
    if (worker.isConnected())
      this.setupWorker(worker)
  }

  var self = this
  this.cluster.on('online', function(worker) {
    self.setupWorker(worker)
  })
}

Master.prototype.close = function() {
  this.cluster.removeListener('online', this.onlineListener)
  for (var i in this.workers) {
    var worker = this.workers[i]
    worker.removeListener('message', this.messageListener)
  }
}

Master.defaultMethods = {
  'cluster.broadcast': function(payload, meta) {
    if (typeof payload !== 'object')
      return

    var method = payload.method
    if (typeof method !== 'string')
      return

    this.broadcast(method, payload.payload, meta.from)
  },
  'cluster.send': function(payload, meta) {
    if (typeof payload !== 'object')
      return

    var method = payload.method
    if (typeof method !== 'string')
      return

    this.send(meta.to, method, payload.payload, meta.from)
  }
}

module.exports = Master
