'use strict';

// XXX - 'dustjs-helpers' has a side-effect of loading and returning dustjs-linkedin
var fs = require('fs'),
    path = require('path'),
    reqwire = require('./reqwire'),
    dust = reqwire('dustjs-helpers', 'dustjs-linkedin');


var LEADING_SEPARATOR = new RegExp('^[\\' + path.sep + ']?', '');
var ALL_SEPARATORS = new RegExp('\\' + path.sep, 'g');
var MY_SPECIAL_FRIEND = '☃';


function readFile(name, context, cb) {
    var views, settings, ext, file;

    views = context.global.views;
    settings = context.global.settings;

    if (settings && settings.views) {
        views = settings.views;
    }

    ext = context.global.ext || path.extname(name);

    if (ext[0] !== '.') {
        ext = '.' + ext;
    }

    file = path.join(views, name + ext);
    fs.readFile(file, 'utf8', cb);
}


function createRenderer(config, doRead) {
    var nameify, cache;

    config = config || {};

    if (Array.isArray(config.helpers)) {
        config.helpers.forEach(function (name) {
            reqwire.init(name, dust);
        });
    }

    cache = true;
    if (config.cache !== undefined) {
        cache = !!config.cache;
    }

    dust.load = (typeof dust.__cabbage__ === 'function') ? dust.__cabbage__ : dust.load;

    nameify = function (file, views, ext) {
        var name = file;
        name = name.replace(views, ''); // Remove absolute path (if necessary)
        name = name.replace(ext, '');   // Remove file extension
        name = name.replace(LEADING_SEPARATOR, ''); // Remove leading slash (platform-dependent, if necessary)
        name = name.replace(ALL_SEPARATORS, '/'); // Ensure path separators in name are all forward-slashes.
        return name;
    };

    return function (file, options, callback) {
        var extension, viewDir, name, layout, base;

        if (dust.load.name !== 'cabbage') {

            // CABBAGE PATCH - Here comes the fun...
            // In order to provide request context to our `read` method we need to get creative with dust.
            // We don't to overwrite load, but we do want to use its conventions against it.
            dust.__cabbage__ = dust.load;
            dust.load = function cabbage(name, chunk, context) {
                var cached, viewName, views, settings;

                cached = cache && !!dust.cache[name];
                viewName = name;

                if (!cached) {

                    views = context.global.views;
                    settings = context.global.settings;

                    // Only use patch for express rendering (existence of `views` or `settings.views`)
                    if (views || (settings && settings.views)) {
                        // We exploit the cache to hook into load/onLoad behavior. Dust first checks the cache before
                        // trying to load (using dust.cache[name]), so if we add a custom getter for a known key we can
                        // get dust to call our code and replace its behavior without changing its internals.
                        viewName = MY_SPECIAL_FRIEND;
                        dust.cache.__defineGetter__(viewName, function () {
                            // Remove the getter immediately (must delete as it's a getter. setting it to undefined will fail.)
                            delete dust.cache[viewName];

                            return function (chunk, context) {
                                var file = name;

                                // Emulate what dust does when onLoad is called.
                                return chunk.map(function (chunk) {
                                    doRead(file, nameify(file), context, function (err, src) {
                                        if (err) {
                                            chunk.setError(err);
                                            return;
                                        }

                                        if (typeof src !== 'function') {
                                            src = dust.loadSource(dust.compile(src, name));
                                        }

                                        if (!cache) {
                                            delete dust.cache[name];
                                        }

                                        src(chunk, context).end();
                                    });
                                });
                            };
                        });
                    }

                }

                return dust.__cabbage__(viewName, chunk, context);
            };
        }

        extension = path.extname(file);
        viewDir = '.';
        layout = undefined;

        if (options) {
            extension = (options.ext && ('.' + options.ext)) || extension;
            viewDir = options.views || (options.settings && options.settings.views) || viewDir;
            layout = (options.layout === false) ? undefined : (options.layout || config.layout);
        }

        name = nameify(file, viewDir, extension);

        // Simple layout support. An explicit 'layout: false' disables, otherwise resolve.
        if (typeof layout === 'string') {
            options._main = name;
            name = layout;
        }

        // TODO: Make this cleaner.
        // FIXME
        base = dust.makeBase({ views: options.views, settings: options.settings, ext: options.ext });
        base = base.push(options);

        delete options.views;
        delete options.settings;
        delete options.ext;

        if (config.stream) {
            callback(null, dust.stream(name, base));
            return;
        }

        dust.render(name, base, function () {
            if (!cache) {
                dust.cache = {};
            }
            callback.apply(undefined, arguments);
        });
    };
}


exports.js = function (config) {
    function doRead(path, name, context, callback) {
        var onLoad, args;

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

        onLoad = dust.onLoad || readFile;
        args = [path, loadJS];

        if (onLoad.length === 3) {
            context.global.ext = context.global.ext || 'js';
            args.splice(1, 0, context);
        }

        onLoad.apply(undefined, args);
    }

    return createRenderer(config, doRead);
};


exports.dust = function (config) {
    function doRead(path, name, context, callback) {
        var onLoad, args;

        onLoad = dust.onLoad || readFile;
        args = [path, callback];

        if (onLoad.length === 3) {
            context.global.ext = context.global.ext || 'dust';
            args.splice(1, 0, context);
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
