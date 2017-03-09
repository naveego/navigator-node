var _ = require('underscore');
var jsonrpc = require('../jsonrpc');
var ipc = require('../ipc');
var net = require('net');

var SubscriberClient = function(options) {
  _.bindAll(this, 'onSocketConnect');

  this.options = _.extend({
    protocol: 'tcp',
    address: '127.0.0.1',
    port: 5899,
  }, options || {});

  this.initMessaging();
}

_.extend(SubscriberClient.prototype, {

  testConnection: function(settings) {
    var self = this;
    var data = { "settings": settings };
    return new Promise(function(resolve, reject) {
      self.messageClient.invoke('testConnection', data, function(error, resp) {
        if(error) {
          reject(error);
          return;
        }

        resolve(resp.result);
      });
    });
  },

  discoverShapes: function(instance, callback) {
    var self = this;
    var data = { "instance": instance };
    return new Promise(function(resolve, reject) {
      self.messageClient.invoke('discoverShapes', data, function(err, resp){
        if(err) {
          reject(err);
          return;
        }

        resolve(resp);
      });
    });
  },

  receiveData: function(instance, pipeline, shape, dataPoint, callback) {
    var self = this;
    var data = {
      "instance": instance,
      "pipeline": pipeline,
      "shape": shape,
      "data": dataPoint
    }

    return new Promise(function(resolve, reject) {
      self.messageClient.invoke('receiveDataPoint', data, function(err, resp) {
        if(err) {
          reject(err);
          return;
        }

        resolve(resp);
      })
    })
  },

  initMessaging: function() {
    var so;
    var attempts = 0;
    var maxAttempts = 5;
    var connectOptions = { path: this.options.address };

    so = net.connect(connectOptions);

    so.on('connect', function() {
      console.log("Successfully connected to client");
    });

    so.on('end', function() {
      console.log("Client done");
    });

    so.on('error', function(err) {
      if(attempts < maxAttempts) {
        setTimeout(function() {
          console.log("Retrying connection");
          so.connect(connectOptions);
        }, 1000);
      }
      attempts = attempts + 1;
    });
    var msgReader = new ipc.StreamMessageReader(so);
    var msgWriter = new ipc.StreamMessageWriter(so);

    this.messageClient = new jsonrpc.RPCMessageClient(msgReader, msgWriter);
  },

  onSocketConnect: function(err) {
    if(err) {
      console.error('Could not connect to server: ', err);
    }
  }

});

module.exports = SubscriberClient;
