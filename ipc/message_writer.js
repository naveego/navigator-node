var _ = require('underscore');
var ContentLength = 'Content-Length: ';
var CRLF = '\r\n';

var StreamMessageWriter = function(writeable, options) {
  this.options = _.extend({
    encoding: 'utf-8'
  }, options || {});
  this.writeable = writeable;
}

_.extend(StreamMessageWriter.prototype, {

  write: function(msg) {
    var self = this;
    var json = JSON.stringify(msg);
    var contentLength = Buffer.byteLength(json, this.options.encoding);

    var headers = [ContentLength, contentLength.toString(), CRLF, CRLF];
    try {

      this.writeable.write(headers.join(''), 'ascii');
      this.writeable.write(json, self.options.encoding);
      this.errorCount = 0;
    } catch(error) {
      this.errorCount++;

      if (this.options.error) {
        this.options.error(error);
      }
      console.error('Error writing IPC message: ', error);
    }
  }

});

module.exports = StreamMessageWriter;
