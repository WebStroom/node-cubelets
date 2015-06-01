var Encoder = require('../../encoder')
var Decoder = require('../../decoder')

var Message = function (id) {
  this.timestamp = (new Date).getTime()
  this.id = id
}

Message.prototype.code = function () {
  return this.constructor.code
}

Message.prototype.decode = function (body) {
  return Buffer.isBuffer(body)
}

Message.prototype.encodeHeader = function (sizeOfBody) {
  var toID = this.id
  return Buffer.concat([
    new Buffer([ this.code() ]),
    Encoder.encodeID(toID),
    new Buffer([ sizeOfBody ])
  ])
}

Message.prototype.encodeBody = function () {
  return new Buffer(0)
}

Message.prototype.encode = function () {
  var body = this.encodeBody()
  return Buffer.concat([
    this.encodeHeader(body.length),
    body
  ])
}

module.exports = Message
module.exports.Encoder = Encoder
module.exports.Decoder = Decoder
