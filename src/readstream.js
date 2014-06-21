var util = require('util');
var Readable = require('stream').Readable;

function ReadStream(tree, options) {
  Readable.call(this, {objectMode: true});
  this.iterator = tree.createIterator(options);
}
util.inherits(ReadStream, Readable);

ReadStream.prototype._read = function() {
  this.push(this.iterator.next());
};

module.exports = ReadStream;