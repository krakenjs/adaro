'use strict';

// XXX - 'dustjs-helpers' has a side-effect of loading and returning dustjs-linkedin
var dust = require('dustjs-helpers'),
    fs = require('fs');


function loadHelper(helper) {
    // Should be a dependency of the parent app
    var fn = require(helper);
    if (typeof fn === 'function' && fn.length === 1) {
        // Handle API that returns an initialization function. Otherwise, assume
        // it conforms to the same pattern as dustjs-helpers.
        fn(dust);
    }
}

function readFile(name, callback) {
    fs.readFile(name, 'utf8', callback);
}


function createRenderer(config, loadHandler) {
    config = config || {};
    config.helpers && config.helpers.forEach(loadHelper);
    config.cache = (config.cache === undefined) ? true : !!config.cache;

    dust.onLoad = loadHandler;

    return function (name, context, callback) {
        dust.render(name, context, function () {
            if (!config.cache) {
                dust.cache = {};
            }
            callback.apply(undefined, arguments);
        });
    }
}


exports.js = function (config) {
    var read = (config && typeof config.read === 'function') ? config.read : readFile;

    function onLoad(name, callback) {
        read(name, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            // Put directly into cache so it's available when onLoad returns.
            dust.cache[name] = dust.loadSource(data);
            callback();
        });
    }

    return createRenderer(config, onLoad);
};


exports.dust = function (config) {
    var onLoad = (config && typeof config.read === 'function') ? config.read : readFile;
    return createRenderer(config, onLoad);
};


