'use strict';

// XXX - 'dustjs-helpers' has a side-effect of loading and returning dustjs-linkedin
var dust = require('dustjs-helpers'),
    fs = require('fs'),
    path = require('path');


var LEADING_SEPARATOR = new RegExp('^[\\' + path.sep + ']?', '');


function loadHelper(helper) {
    // Should be a dependency of the parent app
    var fn = require(helper);
    if (typeof fn === 'function' && fn.length === 1) {
        // Handle API that returns an initialization function. Otherwise, assume
        // it conforms to the same pattern as dustjs-helpers.
        fn(dust);
    }
}


function readFile(file, options, callback) {
    fs.readFile(file, 'utf8', callback);
}


function isAbsolutePath(file) {
    return path.resolve(file, file) === file;
}


function createRenderer(config, doRead) {
    var ext, views, nameify;

    config = config || {};
    config.helpers && config.helpers.forEach(loadHelper);
    config.cache = (config.cache === undefined) ? true : !!config.cache;

    dust.onLoad = null;
    ext = null;
    views = null;
    nameify = null;

    return function (file, options, callback) {
        var name;

        // Upon first invocation, initialize load handler with context-aware settings
        // as provided by expressjs.
        if (!dust.onLoad) {

            ext = path.extname(file);
            views = '.';

            if (options) {
                ext   = (options.ext && ('.' + options.ext)) || ext;
                views = options.views || (options.settings && options.settings.views) || views;
            }

            nameify = function (file) {
                var name = file;
                name = name.replace(views, ''); // Remove absolute path (if necessary)
                name = name.replace(ext, ''); // Remove file extension
                name = name.replace(LEADING_SEPARATOR, ''); // Remove leading slash (platform-dependent, if necessary)
                name = name.replace(path.sep, '/'); // Ensure path separators in name are all forward-slashes.
                return name;
            };

            dust.onLoad = function (file, cb) {
                if (!path.extname(file)) {
                    file += ext;
                }

                if (!isAbsolutePath(file)) {
                    file = path.join(views, file);
                }

                doRead(file, nameify(file), options, cb);
            }
        }

        name = nameify(file);
        dust.render(name, options, function () {
            if (!config.cache) {
                dust.cache = {};
            }
            callback.apply(undefined, arguments);
        });
    }
}


exports.js = function (config) {
    var read = readFile;
    if (config && typeof config.read === 'function') {
        read = config.read;
    }

    function doRead(path, name, options, callback) {
        read(path, options, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            // Put directly into cache so it's available when dust.onLoad returns.
            dust.cache[name] = dust.loadSource(data);
            callback();
        });
    }

    return createRenderer(config, doRead);
};


exports.dust = function (config) {
    var read = (config && typeof config.read === 'function') ? config.read : readFile;

    function onLoad(path, name, options, callback) {
        read(path, options, function (err, data) {
            callback(err, data);
        });
    }

    return createRenderer(config, onLoad);

};


exports.compile = dust.compile;


exports.compileFn = dust.compileFn;
