var util = require('util')
var events = require('events')
var request = require('request')
var config = require('../config.json')
var __ = require('underscore')

var Info = function (data) {
  this.typeID = data['type_id']
  this.mcu = data['mcu']
  this.currentFirmwareVersion = data['current_firm_ver']
  this.latestFirmwareVersion = data['latest_firm_ver']
}

var InfoService = function() {
  events.EventEmitter.call(this)

  var service = this
  var baseUrl = config['urls']['appspot']

  function urlForCubelets(cubelets) {
    return baseUrl + '/api/cubelet_info/?ids=' + __(cubelets).pluck('id').join(',')
  }

  this.fetchCubeletInfo = function (cubelets, callback) {
    callback = callback || Function()

    if (cubelets.length === 0) {
      callback(null)
    } else {
      request.get({
        url: urlForCubelets(cubelets),
        json: true
      }, function(err, res, body) {
        if (err) {
          callback(err)
        } else if (res.statusCode != 200) {
          callback(new Error('Bad response. Error status code.'))
        } else if (!__(body).isArray()) {
          callback(new Error('Invalid response.'))
        } else {
          var index = 0
          __(cubelets).each(function (cubelet) {
            __(body).each(function (item) {
              if (item['id'] == cubelet.id) {
                var info = new Info(item)
                service.emit('info', info, cubelet, index)
                index++
              }
            })
          })
          callback(null)
        }
      })
    }
  }

}

util.inherits(InfoService, events.EventEmitter)

module.exports = InfoService
