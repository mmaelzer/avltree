var test = require('tape');
var Tree = require('../');
var util = require('util');
var _ = require('underscore');

function createPopulatedTree(data) {
  var tree = new Tree();
  // Randomize data insertion order
  _.sample(data, data.length).forEach(tree.insert, tree);
  return tree;
}

test('tree methods', function(t) {
  t.plan(14);
  // A nice prime number
  var DATA_SIZE = 102797;
  var testData = [];
  var val, i, iterator;

  // Data in an array to test against
  _.times(DATA_SIZE, testData.push.bind(testData));

  var tree = createPopulatedTree(testData);

  t.equal(tree.min(), testData[0], 'tree.min()');
  t.equal(tree.max(), testData[testData.length - 1], 'tree.max()');
  t.deepEqual(tree.walk(), testData, 'tree.walk()');
  t.ok(tree.find(_.sample(testData)), 'tree.find()');
  t.ok(tree.remove(_.sample(testData)), 'tree.remove() random value');
  t.ok(tree.remove(tree.min()), 'tree.remove() min value');
  t.ok(tree.remove(tree.max()), 'tree.remove() max value');

  // Create another tree as we've modified it in the above tests
  tree = createPopulatedTree(testData);

  // Use random min/max for iterator tests
  var r1 = _.sample(testData);
  var r2 = _.sample(testData);
  var min = Math.min(r1, r2);
  var max = Math.max(r1, r2);
  var iofmin = testData.indexOf(min);
  var iofmax = testData.indexOf(max);
  var iteratorOptions = { min: min, max: max };
  var testArray = testData.splice(iofmin, iofmax - iofmin + 1);

  var walkNextArray = [];
  iterator = tree.createIterator(iteratorOptions);
  while (val = iterator.next()) {
    walkNextArray.push(val);
  }
  t.deepEqual(walkNextArray, testArray, 'tree.createIterator() calling next()');

  var walkPrevArray = [];
  iterator = tree.createIterator(iteratorOptions);
  while (val = iterator.prev()) {
    walkPrevArray.push(val);
  }
  t.deepEqual(walkPrevArray, testArray.slice().reverse(), 'tree.createIterator() calling prev()');

  var streamData = [];
  var readStream = tree.createReadStream(iteratorOptions);
  readStream.on('data', streamData.push.bind(streamData));
  readStream.on('end', t.deepEqual.bind(t, streamData, testArray, 'tree.createReadStream()'));

  t.deepEqual(tree.clone().walk(), tree.walk(), 'tree.clone()');

  tree.cloneAsync(function(err, newTree) {
    t.deepEqual(tree.walk(), newTree.walk(), 'tree.cloneAsync()');
  });

  tree.walkAsync(function(err, values) {
    t.deepEqual(values, tree.walk(), 'tree.walkAsync()');
  });

  var treeWithMethod = new Tree().compareWith(function(a, b) {
    return b - a;
  });

  _.sample(testData, testData.length).forEach(treeWithMethod.insert, treeWithMethod);
  t.ok(treeWithMethod.min() === _.max(testData) && treeWithMethod.max() === _.min(testData),
          'tree.compareWith()');

  // Figure out why this test only fails on travis-ci
  // var writeTree = new Tree();
  // var writeStream = writeTree.createWriteStream();

  // readStream.pipe(writeStream)
  // readStream.on('end', function() {
  //   t.deepEqual(writeTree.walk(), testArray, 'tree.writeStream()');
  // });
});