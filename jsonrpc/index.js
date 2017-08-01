var _ = require('underscore');

var RPCMessageClient = function(messageReader, messageWriter, options) {
  var self = this;

  this.options = _.extend({}, options || {});
  this.messageReader = messageReader;
  this.messageWriter = messageWriter;
  this.nextMsgId = 1;

  this.openRequests = {};
  this.notificationHandler = this.options.notificationHandler || {};

  this.messageReader.listen(function(data) {
    if(data.id) {
      self.handleResponse(data);
    } else {
      self.handleNotification(data);
    }
  }, {
    error: function(err) {
      console.log(err);
    }
  });
}

_.extend(RPCMessageClient.prototype, {

  invoke: function(method, data, callback) {
    var msgId = this.nextMsgId;

    this.openRequests[msgId] = callback;

    this.messageWriter.write({
      id: msgId.toString(),
      jsonrpc: "2.0",
      method: method,
      params: data
    });

    this.nextMsgId = this.nextMsgId + 1;
  },

  handleResponse: function(data) {
    var msgId = data.id;

    var callback = this.openRequests[msgId];
    if (!callback) {
      console.warn("No open requests for message with id: " + msgId);
      return;
    }

    callback(data.error, data.result);
    delete this.openRequests[msgId];
  },

  handleNotification: function(data) {
    var callback = this.notificationHandler[data.method];
    if(!callback) {
      console.warn("No notification handler for: " + data.method);
      return;
    }
    callback(data.params);
  }
});

module.exports = {
  RPCMessageClient: RPCMessageClient
};
