var helpers = {};

/**
 *  @param {Array<*>} array
 *  @return {*}
 */
helpers.first = function(array) {
  return array && array.length ? array[0] : undefined;
};

/**
 *  @param {Array<*>} array
 *  @return {*}
 */
helpers.last = function(array) {
  return array && array.length ? array[array.length - 1] : undefined;
};

/**
 *  @param {*} obj
 *  @return {Boolean}
 */
helpers.isUndefined = function(obj) {
  return obj === void 0;
};

/**
 *  @param {Array<*>} array
 *  @return {Array.<*>}
 */
helpers.compact = function(array) {
  var cleanArray = [];
  array.forEach(function(item) {
    if (item) cleanArray.push(item);
  });
  return cleanArray;
};

/**
 *  @param {Array<*>} array
 *  @param {String} prop
 *  @return {Array.<*>}
 */
helpers.pluck = function(array, prop) {
  return array.map(function(item) {
    return item && prop in item ? item[prop] : undefined;
  });
};

/**
 *  @param {Number} times
 *  @param {Function} fn
 *  @return {Function}
 */
helpers.after = function(times, fn) {
  return function() {
    if (--times < 1) {
      fn.apply(this, arguments);
    }
  };
};

var delay = setImmediate ? setImmediate : process & process.nextTick ? process.nextTick : timeout;

function timeout(fn) {
  return setTimeout(fn, 0);
}

helpers.delay = function(fn) {
  delay(fn);
};

/**
 *  @param {Array<*>} array
 *  @param {Function|*} prop
 *  @return {Array.<*>}
 */
helpers.without = function(array, remove) {
  var withoutArray = [];
  array.forEach(function(item) {
    if (typeof remove === 'function' && !remove(item)) {
      withoutArray.push(item);
    } else if (item !== remove) {
      withoutArray.push(item);
    }
  });
  return withoutArray;
};

module.exports = helpers;