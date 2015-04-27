var assert = require('assert')

var Message = function () {
  this.timestamp = (new Date).getTime()
}

Message.prototype.code = function () {
  return this.constructor.code
}

Message.prototype.decode = function (body) {
  return Buffer.isBuffer(body)
}

Message.prototype.encodeHeader = function () {
  return new Buffer([
    this.code()
  ])
}

Message.prototype.encodeBody = function () {
  return new Buffer(0)
}

Message.prototype.encode = function () {
  var header = this.encodeHeader()
  assert(Buffer.isBuffer(header))
  var body = this.encodeBody()
  assert(Buffer.isBuffer(body))
  return Buffer.concat([
    header,
    body
  ])
}

module.exports = Message
