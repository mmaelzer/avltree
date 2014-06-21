var util = require('util');
var Writable = require('stream').Writable;

function WriteStream(tree) {
  Writable.call(this, {objectMode: true});
  this.tree = tree;
}
util.inherits(WriteStream, Writable);

WriteStream.prototype._write = function(chunk, encoding, done) {
  this.tree.insert(chunk);
  done();
};

module.exports = WriteStream;