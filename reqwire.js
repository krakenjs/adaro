'use strict';

var assert = require('assert'),
    path = require('path');

var reqwire;
exports = reqwire = module.exports = function (/*modules*/) {
    var result, failed;

    result = undefined;
    failed = [];

    Array.prototype.slice.call(arguments).some(function (moduleName) {
        try {
            result = require(moduleName);
        } catch (err) {
            // noop
            failed.push(moduleName);
        }
        return !!result;
    });

    assert.notStrictEqual(failed.length, arguments.length, 'Cannot find module: \'' + failed.join('\', \'') + '\'');
    return result;
};


exports.init = function (/*name, args...*/) {
    var args, name, fn;

    args = Array.prototype.slice.call(arguments);
    name = args.shift();

    if (~name.indexOf('/')) {
        name = path.join(process.cwd(), name);
    }

    fn = reqwire(name); // Should be a dependency of the parent app
    if (typeof fn === 'function') {
        // Handle API that returns an initialization function. Otherwise, assume
        // it conforms to the same pattern as dustjs-helpers.
        fn.apply(undefined, args);
    }
};