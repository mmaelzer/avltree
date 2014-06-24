avltree
=======
An AVL tree implementation that supports node streams.

[![build status](https://secure.travis-ci.org/mmaelzer/avltree.png)](http://travis-ci.org/mmaelzer/avltree)

Install
---------
``` javascript
npm install avltree
```

Example
---------

``` javascript
var Tree = require('avltree');
var es = require('event-stream');

var tree = new Tree({
  compareWith: function(obja, objb) {
    return obja.date - objb.date;
  }
});

var events = [
  { event: 'Shays\' Rebellion', date: -5785664400000 },
  { event: 'Declaration of Independence', date: -6106035600000 },
  { event: 'Operation Desert Storm', date: 664099200000 },
  { event: 'Mexican–American War', date: -3847190400000 }
];

var reader = es.readArray(events);

reader.pipe(tree.createWriteStream());

reader.on('end', function() {

  console.log(tree.min().event);
  // Declaration of Independence

  console.log(tree.max().event);
  // Operation Desert Storm

});

```

Constructor
------------
## Tree(options|value)

### options (optional)
 * `compareWith` (optional): a `function` that takes two arguments that correspond to tree node values. The return of this function is 0, less than 0, or greater than 0. If the value returned is less than zero, the first argument is less than the second argument. If the value returned is 0, the two arguments are equal. If the value returned is greater than 0, the second argument is greater than the first argument. Defaults to: `function(a, b) { return a - b; }`
 * `value` (optional): If a `compareWith` function is provided, the `value` property of the options `Object` will be the value of the root node.

### value (optional)

``` javascript
var tree = new Tree({
  compareWith: function(a, b) {
    return b - a;
  },
  value: 10
});

// or

var otherTree = new Tree(10);

// or

var stillAnotherTree = new Tree();

```

Methods
---------
### createReadStream(options)

Returns a readable stream of the tree's values. Outputs values in sorted order.

#### `options` (optional)
 * `min` (optional): The minimum value or starting point of the stream.
 * `max` (optional): The maximum value or ending point of the stream.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

var read = tree.createReadStream({min: 5, max: 10});
read.on('data', console.log);
// 5
// 6
// ...
// 10

```


### createWriteStream()

Returns a writeable stream for populating the tree.

#### example
``` javascript
var es = require('event-stream');
var tree = new Tree();

var read = es.readArray([1,2,3,4,5]);
read.pipe(tree.createWriteStream());

read.on('end', function() {
  console.log(tree.walk());
  // [1,2,3,4,5]
});
```


### createIterator()

Returns an `Iterator` object that you can call `next()` or `previous()` on to walk the tree incrementally.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

var iterator = tree.createIterator();
console.log(iterator.next());
// 1
console.log(iterator.next());
// 2
console.log(iterator.prev());
// 1
console.log(iterator.prev());
// undefined

var iterator2 = tree.createIterator();
console.log(iterator.prev());
// 10
console.log(iterator.prev());
// 9
console.log(iterator.next());
// 10

```


### min()

Returns the minimum value in the tree.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

console.log(tree.min());
// 1
```


### max()

Returns the maximum value in the tree.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

console.log(tree.max());
// 10
```


### walk()

Walks the tree in order, returning an array of values.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

console.log(tree.walk());
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```


### walkAsync(callback)

Walks the tree in order, asynchronously, passing an array of values via a callback.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

tree.walkAsync(function(err, values) {
  console.log(values);
  // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
});
```


### remove(value)

Removes the given value from the tree if it exists. Returns a `boolean` if a removal occurred.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

console.log(tree.remove(8));
// true
console.log(tree.walk());
// [1, 2, 3, 4, 5, 6, 7, 9, 10]
console.log(tree.move(400));
// false
```


### clone()

Returns a copy of the tree.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

var treeClone = tree.clone();

console.log(tree.remove(10));
// true

console.log(treeClone.walk());
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
console.log(tree.walk());
// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```


### cloneAsync(callback)

Clones the tree asynchronously, passing a new tree via a callback.

#### example
``` javascript
var tree = new Tree();
[1,2,3,4,5,6,7,8,9,10].forEach(tree.insert, tree);

tree.cloneAsync(function(err, treeClone) {

  console.log(tree.remove(10));
  // true

  console.log(treeClone.walk());
  // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  console.log(tree.walk());
  // [1, 2, 3, 4, 5, 6, 7, 8, 9]

});
```