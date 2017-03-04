var _ = require('underscore');

var RPCMessageClient = function(messageReader, messageWriter, options) {
  var self = this;

  this.options = _.extend({}, options || {});
  this.messageReader = messageReader;
  this.messageWriter = messageWriter;
  this.nextMsgId = 1;

  this.openRequests = {};

  this.messageReader.listen(function(data) {
    self.handleResponse(data);
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
    console.log('handling response:', data);
    var msgId = data.id;

    var callback = this.openRequests[msgId];
    if (!callback) {
      console.warn("No open requests for message with id: " + msgId);
    }

    callback(data.error, data.result);
    delete this.openRequests[msgId];
  }
});

module.exports = {
  RPCMessageClient: RPCMessageClient
};
