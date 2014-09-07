var WriteStream = require('./writestream');
var ReadStream = require('./readstream');
var Iterator = require('./iterator');
var _ = require('./helpers');

/**
 *  @param {*} options
 *  @constructor
 */
function AvlTree(options) {
  this._initialize();
  var hasOptions = typeof options === 'object' && ('compareWith' in options || 'value' in options);
  this.compare = hasOptions ? options.compareWith || defaultCompare : defaultCompare;
  this.value = hasOptions ? options.value : options;
  this.height = 1;
  return this;
}

/**
 *  @param {Object} options
 *  @return {WriteStream}
 *  @public
 */
AvlTree.prototype.createWriteStream = function() {
  return new WriteStream(this);
};

/**
 *  @param {Object} options
 *  @return {ReadStream}
 *  @public
 */
AvlTree.prototype.createReadStream = function(options) {
  return new ReadStream(this, options);
};

/**
 *  Override the default comparator method with a custom method
 *  @param {Function}
 *  @return {AvlTree}
 *  @public
 */
AvlTree.prototype.compareWith = function(comparator) {
  this.compare = comparator;
  return this;
};

/**
 *  @param {*} a
 *  @param {*} b
 *  @return {Boolean}
 *  @public
 */
function defaultCompare(a, b) {
  return a - b;
}

/**
 *  @return {Object}
 *  @private
 */
AvlTree.prototype._initialize = function() {
  this.value = undefined;
  this.left = undefined;
  this.right = undefined;
  this.height = 0;
  return this;
};

/**
 * @return {AvlTree}
 * @public
 */
AvlTree.prototype.clone = function() {
  var tree = new AvlTree({compareWith: this.compare});
  this.walk().forEach(tree.insert, tree);
  return tree;
};

/**
 * @param {Function(Error, AvlTree)} callback
 * @public
 */
AvlTree.prototype.cloneAsync = function(callback) {
  var tree = new AvlTree({compareWith: this.compare});
  var read = this.createReadStream();
  read.pipe(tree.createWriteStream());
  read.on('end', function() { callback(null, tree); })
      .on('error', callback);
};

/**
 *  @param {*} value
 *  @return {Boolean}
 *  @public
 */
AvlTree.prototype.insert = function(value) {
  var inserted = (function() {
    if (_.isUndefined(this.value)) {
      return (this.value = value);
    }
    var comparison = this.compare(this.value, value);
    if (comparison > 0) {
      return this._insertLeft(value);
    } else if (comparison < 0) {
      return this._insertRight(value);
    } else {
      return false;
    }
  }).call(this);

  if (inserted) {
    this._updateHeight();
    this._balance();
  }

  return !!inserted;
};

/**
 *  @param {*} value
 *  @return {Boolean}
 *  @private
 */
AvlTree.prototype._insertLeft = function(value) {
  return this._childInsert('left', value);
};

/**
 *  @param {*} value
 *  @return {Boolean}
 *  @private
 */
AvlTree.prototype._insertRight = function(value) {
  return this._childInsert('right', value);
};

/**
 *  @param {AvlTree} node
 *  @param {*} value
 *  @return {Boolean}
 *  @private
 */
AvlTree.prototype._childInsert = function(node, value) {
  if (this[node]) {
    return this[node].insert(value);
  } else {
    return (this[node] = new AvlTree({value: value, compareWith: this.compare}));
  }
};

/**
 *  @param {*} value
 *  @return {AvlTree|undefined}
 *  @public
 */
AvlTree.prototype.find = function(value) {
  var comparison = this.compare(this.value, value);
  if (comparison === 0) {
    return this;
  } else if (comparison > 0) {
    return this.left ? this.left.find(value) : undefined;
  } else {
    return this.right ? this.right.find(value) : undefined;
  }
};

/**
 *  @param {*} value
 *  @return {Boolean}
 *  @public
 */
AvlTree.prototype.remove = function(value) {
  var parents = this.findNodeWithParents(value);
  var node = parents.pop();

  if (!node) return false;

  var parent = _.last(parents);

  var rebalanceParents = function() {
    this._rebalanceNodes(parents.slice(0).reverse());
  }.bind(this);

  var updateParentRef = function(newValue) {
    if (parent.left && parent.left.value === node.value) {
      parent.left = newValue;
    } else if (parent.right && parent.right.value === node.value) {
      parent.right = newValue;
    } else {
      return false;
    }
    rebalanceParents();
    return true;
  }.bind(this);

  // leaf node
  if (!node.left && !node.right) {
    // node is the root of an empty tree. Clear out its values
    if (!parent) {
      return !!node._initialize();
    }
    // node is a leaf node. Have the parent dereference the node
    else {
      // replace node value if no parent
      return updateParentRef(undefined);
    }
  }
  // XOR - node only has one child
  else if (node.left ? !node.right : node.right) {
    // node is the root, replace it with its only child
    if (!parent) {
      var replacement = node.left || node.right;
      node.value = replacement.value;
      node.left = replacement.left;
      node.right = replacement.right;
      return true;
    }
    // replace parent's reference of node with a reference to the node's only child
    else {
      return updateParentRef(node.left || node.right);
    }
  }
  // replace node with either the largest left node or the smallest right node
  // the subtree of the replacing node becomes the subtree of the replacing node's former parent
  else {
    var replaceParents = [node].concat(node.left ? node.left.maxWithParents() : node.right.minWithParents());
    var replace = replaceParents.pop();
    var replaceParent = _.last(replaceParents);
    node.value = replace.value;
    if (node.left) {
      replaceParent.right = replace.left;
    } else {
      replaceParent.left = replace.right;
    }
    node._rebalanceNodes(replaceParents.slice(1));
    rebalanceParents();
    return true;
  }
};

/**
 *  @param {Array.<AvlTree>} nodes
 *  @private
 */
AvlTree.prototype._rebalanceNodes = function(nodes) {
  nodes.forEach(function(node) { node._update(); });
};

/**
 *  @return {Array.<AvlTree>}
 *  @private
 */
AvlTree.prototype.maxWithParents = function() {
  return this.right ? [this].concat(this.right.maxWithParents()) : [this];
};

/**
 *  @return {Array.<AvlTree>}
 *  @private
 */
AvlTree.prototype.minWithParents = function() {
  return this.left ? [this].concat(this.left.minWithParents()) : [this];
};

/**
 *  @param {*} value
 *  @return {Array.<AvlTree>}
 *  @private
 */
AvlTree.prototype.findNodeWithParents = function(value) {
  var comparison = this.compare(this.value, value);
  var thisValue = [this];
  if (comparison === 0) {
    return thisValue;
  } else if (comparison > 0) {
    return this.left ? thisValue.concat(this.left.findNodeWithParents(value)) : thisValue;
  } else {
    return this.right ? thisValue.concat(this.right.findNodeWithParents(value)) : thisValue;
  }
};

/**
 *  @return {Boolean}
 *  @private
 */
AvlTree.prototype._hasChild = function() {
  return !!(this.left || this.right);
};

/**
 *  @return {Iterator}
 *  @public
 */
AvlTree.prototype.createIterator = function(options) {
  return new Iterator(this, options);
};

/**
 *  @return {AvlTree}
 *  @public
 */
AvlTree.prototype.min = function() {
  return this.left ? this.left.min() : this.value;
};

/**
 *  @return {AvlTree}
 *  @public
 */
AvlTree.prototype.max = function() {
  return this.right ? this.right.max() : this.value;
};

/**
 *  @return {Array.<*>}
 *  @public
 */
AvlTree.prototype.walk = function() {
  var values = [];
  if (this.left) {
    values = values.concat(this.left.walk());
  }
  values.push(this.value);
  if (this.right) {
    values = values.concat(this.right.walk());
  }
  return values;
};

/**
 *  @param {Function(Error, Array.<*>)} callback
 *  @return {Array.<*>}
 *  @public
 */
AvlTree.prototype.walkAsync = function(callback) {
  var values = [];
  var read = this.createReadStream();
  read.on('data', function(val) { values.push(val); })
      .on('error', callback)
      .on('end', function() { callback(null, values); });
};

/**
 *  @private
 */
AvlTree.prototype._balance = function() {
  var balanceFactor = this._getBalanceFactor();
  if (balanceFactor === 2) {
    if (this.left._getBalanceFactor() === -1) {
      this.left._rotateLeft();
    }
    this._rotateRight();
  }

  if (balanceFactor === -2) {
    if (this.right._getBalanceFactor() === 1) {
      this.right._rotateRight();
    }
    this._rotateLeft();
  }
};

/**
 *  @return {Number}
 *  @private
 */
AvlTree.prototype._getBalanceFactor = function() {
  return this._getHeightOfNode(this.left) - this._getHeightOfNode(this.right);
};

/**
 *  @return {Number}
 *  @private
 */
AvlTree.prototype._getHeightOfNode = function(node) {
  return node ? node.height : 0;
};

/**
 *  @param {String} from
 *  @param {String} to
 *  @private
 */
AvlTree.prototype._rotate = function(from, to) {
  var value = this.value;
  var fromNode = this[from];
  var toNode = this[to];
  var fromToNode = this[from][to];

  this.value = fromNode.value;
  fromNode.value = value;

  this[to] = fromNode;
  this[from] = fromNode[from];
  this[to][to] = toNode;
  this[to][from] = fromToNode;

  if (this.left) this.left._updateHeight();
  if (this.right) this.right._updateHeight();
  this._updateHeight();
};

/**
 *  @private
 */
AvlTree.prototype._rotateLeft = function() {
  this._rotate('right', 'left');
};

/**
 *  @private
 */
AvlTree.prototype._rotateRight = function() {
  this._rotate('left', 'right');
};

/**
 *  @private
 */
AvlTree.prototype._update = function() {
  this._updateHeight();
  this._balance();
};

/**
 *  @private
 */
AvlTree.prototype._updateHeight = function() {
  var leftHeight = this.left ? this.left.height : 0;
  var rightHeight = this.right ? this.right.height : 0;
  this.height = _.isUndefined(this.left) && _.isUndefined(this.right)
      ? 1
      : Math.max(leftHeight, rightHeight) + 1;
};

module.exports = AvlTree;
