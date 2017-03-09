var _ = require('underscore');
var DefaultSize = 8192;
var CR = new Buffer('\r', 'ascii')[0];
var LF = new Buffer('\n', 'ascii')[0];
var CRLF = '\r\n';


var MessageBuffer = function(options) {
  options = _.extend({}, options || {});
  this.encoding = options.encoding || 'utf-8';
  this.index = 0;
  this.buffer = new Buffer(DefaultSize);
}

_.extend(MessageBuffer.prototype, {

  append: function(data) {
    var buf;

    if (data instanceof Buffer) {
      buf = data;
    } else if (typeof data === 'string') {
      var bufferLength = Buffer.byteLength(data, this.encoding);
      buf = new Buffer(bufferLength);
      buf.write(data, 0, bufferLength, this.encoding);
    }

    if(!buf) {
      return undefined;
    }

    if(this.buffer.length - this.index >= buf.length) {
      buf.copy(this.buffer, this.index, 0, buf.length);
    } else {
      var newSize = (Math.ceil((this.index + buf.length) / DefaultSize) + 1) * DefaultSize;
      if (this.index === 0) {
        this.buffer = new Buffer(newSize)
        buf.copy(this.buffer, 0, 0, buf.length);
      } else {
        this.buffer = Buffer.concat([this.buffer.slice(0, this.index), buf], newSize);
      }
    }
    this.index += buf.length;
  },

  tryReadHeaders: function() {
    var result;
    var current = 0;
    while((current + 3 < this.index) && (this.buffer[current] !== CR || this.buffer[current + 1] !== LF || this.buffer[current + 2] !== CR || this.buffer[current + 3] !== LF)) {
      current++;
    }
    if (current + 3 >= this.index) {
      return result;
    }
    result = {};
    var headers = this.buffer.toString('ascii', 0, current).split(CRLF);
    _.forEach(headers, function(header) {
      var index = header.indexOf(':');
      if (index === -1) {
        throw new Error('message header is not in the correct format');
      }
      var key = header.substr(0, index);
      var value = header.substr(index+1).trim();
      result[key] = value;
    });

    var nextStart = current + 4;
    this.buffer = this.buffer.slice(nextStart);
    this.index = this.index - nextStart;
    return result;
  },

  tryReadContent: function(length) {
    if(this.index < length) {
      return null;
    }

    var result = this.buffer.toString(this.encoding, 0, length);
    var nextStart = length;
    this.buffer.copy(this.buffer, 0, nextStart);
    this.index = this.index - nextStart;
    return result;
  },

  numberOfBytes: function() {
    return this.index;
  }

});


function StreamMessageReader(readable, encoding) {
  encoding = encoding || 'utf-8';
  this.buffer = new MessageBuffer({
    encoding: encoding
  });
  this.readable = readable;
}

_.extend(StreamMessageReader.prototype, {

  listen: function(callback, options) {
    options = _.extend({}, options || {});
    var self = this;
    this.nextMessageLength = -1;
    this.messageToken = 0;
    this.callback = callback;
    this.readable.on('data', function(data) {
      self.onData(data);
    });
    this.readable.on('error', function(error) {
      if(options.error) {
        options.error(error);
      }
    });
    this.readable.on('close', function() {
      if(options.close) {
        options.close();
      }
    });
  },

  onData: function(data) {
    this.buffer.append(data);
    while(true) {
      if(this.nextMessageLength === -1) {
        var headers = this.buffer.tryReadHeaders();
        if(!headers) {
          return;
        }
        var contentLength = headers['Content-Length'];
        if(!contentLength) {
          throw new Error("header must provide a content-length");
        }
        var length = parseInt(contentLength);
        if (isNaN(length)) {
          throw new Error("conent-length must be a number");
        }
        this.nextMessageLength = length;
      }
      var msg = this.buffer.tryReadContent(this.nextMessageLength);
      if (msg === null) {
        return;
      }
      this.nextMessageLength = -1;
      this.messageToken++;
      var json = JSON.parse(msg);
      this.callback(json);
    }
  }
})

module.exports = StreamMessageReader
