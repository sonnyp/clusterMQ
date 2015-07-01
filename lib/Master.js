'use strict'

var cluster = require('cluster')
var workers = cluster.workers

var Master = function() {}

/**
 * For every worker listen the message and add the worker.id as sender [from]
 * After that call SimpleRPC.onMessage to process the message
 */
Master.prototype.setupWorker = function(worker) {
  var self = this
  var onMessage = function(message) {
    if (typeof message === 'object')
      message.from = worker.id
    self.onMessage(message)
  }
  worker.on('message', onMessage)
  worker.removeListener('disconnect', onMessage)
}

/**
 * The master having received a message from one worker [from] sends the message
 * to all the others connected workers
 *
 * @param {String} method
 * @param {Object} payload
 * @param {Integer} from
 */
Master.prototype.broadcast = function(method, payload, from) {
  for (var i in workers) {
    var worker = workers[i]

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

/**
 * Having received a message from one worker [from] to other worker [to]
 *
 * @param {Integer} to
 * @param {String} method
 * @param {Object} payload
 * @param {Integer} from
 */
Master.prototype.send = function(to, method, payload, from) {
  if (!to)
    return

  if (typeof method !== 'string')
    return

  var worker = workers[to]
  if (!worker || !worker.isConnected() || worker.isDead())
    return

  var message = {
    method: method,
    payload: payload
  }
  if (typeof from === 'number')
    message.from = from

  worker.send(message)
}

/**
 * Make the master listen all the current and new worker messages
 */
Master.prototype.listen = function() {
  for (var i in workers) {
    var worker = workers[i]
    if (worker.isConnected())
      this.setupWorker(worker)
  }

  var self = this
  cluster.on('online', function(worker) {
    self.setupWorker(worker)
  })
}

/**
 * Static default methods
 */
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
