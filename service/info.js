var util = require('util')
var events = require('events')
var request = require('request')
var config = require('../config.json')
var __ = require('underscore')

var Info = function (data) {
  this.blockTypeId = parseInt(data['type_id'])
  this.mcuTypeId = data['mcu']
  this.currentFirmwareVersion = data['current_firm_ver']
  this.latestFirmwareVersion = data['latest_firm_ver']
}

var InfoService = function () {
  events.EventEmitter.call(this)

  var service = this
  var baseUrl = config['urls']['proxy']

  function urlForBlocks(blocks) {
    return baseUrl + '/api/cubelet_info/?ids=' + __(blocks).map(function (block) {
      return block.getBlockId()
    }).join(',')
  }

  this.fetchBlockInfo = function (blocks, callback) {
    if (blocks.length === 0) {
      if (callback) {
        callback(null)
      }
    } else {
      request.get({
        url: urlForBlocks(blocks),
        json: true
      }, function(err, res, body) {
        if (err) {
          if (callback) {
            callback(err)
          }
        } else if (res.statusCode !== 200) {
          if (callback) {
            callback(new Error('Bad response. Error status code.'))
          }
        } else if (!__(body).isArray()) {
          if (callback) {
            callback(new Error('Invalid response.'))
          }
        } else {
          var infos = []
          __(blocks).each(function (block) {
            __(body).each(function (item) {
              if (item['id'] === block.getBlockId()) {
                var info = new Info(item)
                service.emit('info', info, block)
                infos.push(info)
              } else {
                infos.push(null)
              }
            })
          })
          if (callback) {
            callback(null, infos)
          }
        }
      })
    }
  }

}

util.inherits(InfoService, events.EventEmitter)

module.exports = InfoService
