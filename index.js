'use strict';

// XXX - 'dustjs-helpers' has a side-effect of loading and returning dustjs-linkedin
var fs = require('fs'),
    path = require('path'),
    assert = require('assert'),
    dust = requireAny('dustjs-helpers', 'dustjs-linkedin');


var LEADING_SEPARATOR = new RegExp('^[\\' + path.sep + ']?', '');
var MY_SPECIAL_FRIEND = '☃';


function requireAny(/*modules*/) {
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

    assert.ok(failed.length !== arguments.length, 'Required module(s) not found. Please install one of the following: ' + failed.join(', '));
    return result;
}


function loadHelper(helper) {
    // Should be a dependency of the parent app
    var fn = require(helper);
    if (typeof fn === 'function' && fn.length === 1) {
        // Handle API that returns an initialization function. Otherwise, assume
        // it conforms to the same pattern as dustjs-helpers.
        fn(dust);
    }
}


function readFile(name, context, cb) {
    var views, ext, file;

    views = context.views;
    if (context.settings && context.settings.views) {
        views = context.settings.views;
    }

    ext = context.ext || path.extname(name);
    if (ext[0] !== '.') {
        ext = '.' + ext;
    }

    file = path.join(views, name + ext);
    fs.readFile(file, 'utf8', cb);
}


function createRenderer(config, doRead) {
    var ext, views, nameify;

    config = config || {};
    config.helpers && config.helpers.forEach(loadHelper);
    config.cache = (config.cache === undefined) ? true : !!config.cache;

    dust.load = (typeof dust.__cabbage__ === 'function') ? dust.__cabbage__ : dust.load;
    ext = null;
    views = null;
    nameify = null;

    function ascend(context) {
        context = context.stack;
        while (context.tail) {
            context = context.tail;
        }
        return context.head
    }

    return function (file, options, callback) {
        var name, layout;

        if (!nameify) {
            ext = path.extname(file);
            views = '.';


            if (options) {
                ext   = (options.ext && ('.' + options.ext)) || ext;
                views = options.views || (options.settings && options.settings.views) || views;
            }

            nameify = function (file) {
                var name = file;
                name = name.replace(views, ''); // Remove absolute path (if necessary)
                name = name.replace(ext, '');   // Remove file extension
                name = name.replace(LEADING_SEPARATOR, ''); // Remove leading slash (platform-dependent, if necessary)
                name = name.replace(path.sep, '/'); // Ensure path separators in name are all forward-slashes.
                return name;
            };
        }

        if (dust.load.name !== 'cabbage') {

            // CABBAGE PATCH - Here comes the fun...
            // In order to provide request context to our `read` method we need to get creative with dust.
            // We don't to overwrite load, but we do want to use its conventions against it.
            dust.__cabbage__ = dust.load;
            dust.load = function cabbage(name, chunk, context) {
                var head = ascend(context);

                // Only use patch for express rendering (existence of `views` or `settings.views`)
                if (!(head.views || (head.settings && head.settings.views))) {
                    return dust.__cabbage__.apply(undefined, arguments);
                }

                // We exploit the cache to hook into load/onLoad behavior. Dust first checks the cache before
                // trying to load (using dust.cache[name]), so if we add a custom getter for a known key we can
                // get dust to call our code and replace its behavior without changing its internals.
                dust.cache.__defineGetter__(MY_SPECIAL_FRIEND, function () {
                    // Remove the getter immediately (must delete as it's a getter. setting it to undefined will fail.)
                    delete dust.cache[MY_SPECIAL_FRIEND];

                    return function (chunk, context) {
                        var file = name;

                        // Emulate what dust does when onLoad is called.
                        return chunk.map(function (chunk) {
                            doRead(file, nameify(file), head, function (err, src) {
                                if (err) {
                                    return chunk.setError(err);
                                }

                                if (typeof src !== 'function') {
                                    src = dust.loadSource(dust.compile(src));
                                }

                                dust.cache[name] = undefined;
                                src(chunk, context).end();
                            });
                        });
                    }
                });

                return dust.__cabbage__(MY_SPECIAL_FRIEND, chunk, context);
            };
        }

        // Simple layout support. An explicit 'layout: false' disables, otherwise resolve.
        name = nameify(file);
        layout = (options.layout === false) ? undefined : (options.layout || config.layout);
        if (typeof layout === 'string') {
            options._main = name;
            name = layout;
        }

        dust.render(name, options, function () {
            if (!config.cache) {
                dust.cache = {};
            }
            callback.apply(undefined, arguments);
        });
    };
}


exports.js = function (config) {
    function doRead(path, name, options, callback) {
        var onLoad = dust.onLoad || readFile;

        function loadJS(err, data) {
            if (err) {
                callback(err);
                return;
            }
            // Put directly into cache so it's available when dust.onLoad returns.
            // This call is synchronous and the cache entry will get purged immediately.
            dust.loadSource(data);
            callback(null, dust.cache[name]);
        }

        var args = [path, loadJS];
        if (onLoad.length === 3) {
            options.ext = options.ext || 'js';
            args.splice(1, 0, options);
        }

        onLoad.apply(undefined, args);
    }

    return createRenderer(config, doRead);
};


exports.dust = function (config) {
    function doRead(path, name, options, callback) {
        var onLoad, args;

        onLoad = dust.onLoad || readFile;
        args = [path, callback];

        if (onLoad.length === 3) {
            options.ext = options.ext || 'dust';
            args.splice(1, 0, options);
        }

        onLoad.apply(undefined, args);
    }

    return createRenderer(config, doRead);
};


exports.compile = dust.compile;


exports.compileFn = dust.compileFn;


exports.__defineGetter__('onLoad', function () {
    return dust.onLoad;
});


exports.__defineSetter__('onLoad', function (value) {
    dust.onLoad = value;
});