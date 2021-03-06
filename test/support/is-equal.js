'use strict';

var path = require('path');
var assert = require('assert');
var read = require('./read');
var breakdance = require('../..');

module.exports = function(name, expectedName, options) {
  if (typeof expectedName !== 'string') {
    options = expectedName;
    expectedName = null;
  }

  var actual = breakdance(read(path.join('fixtures', name + '.html')), options);
  var expected = read(path.join('expected', (expectedName || name) + '.md'));
  assert.strictEqual(actual, expected);
};

module.exports.inline = function(html, markdown, options) {
  assert.strictEqual(breakdance(html, options).replace(/\n$/, ''), markdown.replace(/\n$/, ''));
};

