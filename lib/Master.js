'use strict'

// var debug = require('./debug')

var Master = function (cluster) {
  this.cluster = cluster
  this.workers = Object.create(null)

  var self = this
  this._handleWorker = function (worker) {
    if (this.workers[worker.id]) return
    self.workers[worker.id] = worker
    worker.on('message', self._messageListener)
  }
  this._disconnectListener = function (worker) {
    worker.removeListener('message', self._messageListener)
  }
  this._messageListener = function (message) {
    self._onmessage(message, this.id)
  }
}

Master.prototype._broadcast = function (method, payload, from) {
  for (var i in this.workers) {
    var worker = this.workers[i]

    if (from === worker.id || !worker.isConnected()) {
      continue
    }

    var message = {
      method: method,
      payload: payload
    }
    if (typeof from === 'number') {
      message.from = from
    }

    worker.send(message)
  }
}

Master.prototype._send = function (to, method, payload, from) {
  var worker = this.workers[to]

  var message = {
    method: method,
    payload: payload
  }
  if (typeof from === 'number') {
    message.from = from
  }

  worker.send(message)
}

Master.prototype._respond = function (to, id, error, result, from) {
  var worker = this.workers[to]

  var message = {
    id: id,
    error: error,
    result: result
  }
  if (typeof from === 'number') {
    message.from = from
  }

  worker.send(message)
}

Master.prototype.listen = function () {
  var cluster = this.cluster
  var workers = cluster.workers
  for (var k in workers) {
    this._handleWorker(workers[k])
  }

  cluster.on('online', this._handleWorker)
  cluster.on('disconnect', this._disconnectListener)
}

Master.prototype.close = function () {
  this.cluster.removeListener('online', this._handleWorker)
  this.cluster.removeListener('disconnect', this._disconnectListener)
  for (var i in this.workers) {
    var worker = this.workers[i]
    worker.removeListener('message', this._messageListener)
  }
}

Master.prototype._request = function (to, id, method, payload, from) {
  var worker = this.workers[to]

  var message = {
    method: method,
    payload: payload,
    id: id
  }

  if (typeof from === 'number') {
    message.from = from
  }

  worker.send(message)
}

Master.defaultMethods = {
  'cluster.broadcast': function (payload, cb, from) {
    if (typeof payload !== 'object') {
      return
    }

    var method = payload.method
    if (typeof method !== 'string') {
      return
    }

    this._broadcast(method, payload.payload, from)
    cb()
  },
  'cluster.send': function (payload, cb, from) {
    if (typeof payload !== 'object') {
      return
    }

    var method = payload.method
    if (typeof method !== 'string') {
      return
    }

    var to = payload.to
    if (typeof to !== 'number') {
      return
    }

    this._send(to, method, payload.payload, from)
    cb()
  },
  'cluster.respond': function (payload, cb, from) {
    this._respond(payload.to, payload.id, payload.error, payload.result, from)
    cb()
  },
  'cluster.request': function (payload, cb, from) {
    if (typeof payload !== 'object') {
      return
    }

    var method = payload.method
    if (typeof method !== 'string') {
      return
    }

    var to = payload.to
    if (typeof to !== 'number') {
      return
    }

    var id = payload.id
    if (typeof id !== 'number') {
      return
    }

    this._request(to, payload.id, method, payload.payload, from)

    cb()
  }
}

module.exports = Master
