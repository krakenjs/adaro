'use strict';

var dust = require('dustjs-linkedin'),
    file = require('../file');


// Loading JS files requires an extra evaluation step to get
// the compiled template src into dust's internal cache, so
// proxy the file read callback to process the raw file and
// turn it into compiled src (implicitly adding it to the cache).
function proxy(name, callback) {
    return function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if (typeof data === 'string') {
            // Put directly into cache so it's available when dust.onLoad returns.
            // This call is synchronous and the cache entry will get purged immediately.
            dust.loadSource(data);
            callback(null, dust.cache[name]);
            return;
        }

        // We were given a precompiled template in fn
        // form. Cache and return. (Will be purged later.)
        if (typeof data === 'function') {
            dust.cache[name] = data;
            callback(err, data);
            return;
        }

        callback(new Error('Invalid template [' + name + ']'));
    }
}


exports.create = function () {
    return file.createReader('js', proxy);
};