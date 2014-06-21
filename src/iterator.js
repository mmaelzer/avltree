var _ = require('./helpers');

/**
 *  @param {AvlTree} tree
 *  @param {Object} options
 *  @constructor
 */
function Iterator(tree, options) {
  options = options || {};
  this.cursor = null;
  this.tree = tree;

  this.min = options.min || this.tree.min();
  this.max = options.max || this.tree.max();
}

/**
 *  @return {*}
 *  @public
 */
Iterator.prototype.next = function() {
  return this._walk('next');
};

/**
 *  @return {*}
 *  @public
 */
Iterator.prototype.prev = function() {
  return this._walk('prev');
};

/**
 *  @param {String} direction
 *  @return {Array.<AvlTree>}
 *  @private
 */
Iterator.prototype._getInitialParents = function(direction) {
  return _.compact(this.tree.findNodeWithParents(direction === 'next' ? this.min : this.max));
};

/**
 *  @param {String} direction
 *  @private
 */
Iterator.prototype._move = function(direction) {
  var child = direction === 'next' ? 'right' : 'left';
  var walkToValue = direction === 'next' ? 'minWithParents' : 'maxWithParents';

  this.cursor = this.parents.pop();
  this.parent = _.last(this.parents);

  if (this.cursor && this.cursor[child]) {
    this.parents = this.parents.concat(this.cursor[child][walkToValue]());
  }
};

/**
 *  @param {String} direction
 *  @private
 */
Iterator.prototype._moveCursor = function(direction) {
  var oldValue = (this.cursor || {}).value;
  this._move(direction);

  // If we've hit the min/max while going in the proper direction, stop
  if (oldValue && this.cursor && this.tree.compare(oldValue, direction === 'next' ? this.max : this.min) === 0) {
    return (this.cursor = null);
  }

  if (oldValue && this.cursor) {
    var compare = this.tree.compare(oldValue, this.cursor.value);
    // Continue walking until we've found the next/prev value or there's nowhere else to go
    while((direction === 'next' && compare >= 0) || (direction === 'prev' && compare <= 0)) {
      this._move(direction);
      if (!this.cursor) break;
      compare = this.tree.compare(oldValue, this.cursor.value);
    }
  }
  return this.cursor;
};

/**
 *  @param {String} direction
 *  @return {*}
 *  @private
 */
Iterator.prototype._getNextValue = function(direction) {
  return (this._moveCursor(direction) || {}).value;
};

/**
 *  @param {String} direction
 *  @return {*}
 *  @private
 */
Iterator.prototype._walk = function(direction) {
  if (this.cursor === null) {
    this.parents = this._getInitialParents(direction);
  }
  if (this.direction && this.direction !== direction) {
    this.parents = this.tree.findNodeWithParents(this.cursor.value);
  }
  this.direction = direction;
  return this._getNextValue(direction);
};

module.exports = Iterator;