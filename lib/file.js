'use strict';

var fs = require('fs'),
    path = require('path'),
    dust = require('dustjs-linkedin'),
    utils = require('./utils');



function load(name, context, cb) {
    var views, ext, file;

    views = utils.resolveViewDir(context.global);

    ext = context.global.ext || path.extname(name);
    if (ext[0] !== '.') {
        ext = '.' + ext;
    }

    file = path.join(views, name + ext);
    fs.readFile(file, 'utf8', cb);
}


exports.createReader = function (type, proxy) {
    // Callback wrapper to possibly modify result prior to handing
    // off back to original callback;
    proxy = proxy || function (name, cb) { return cb; };

    return function (path, name, context, callback) {
        var onLoad, args;

        // Use proxy or noop.
        callback = proxy(name, callback);

        // Use custom onLoad if specified, otherwise use built-in version,
        // which resolves files according to context.
        onLoad = dust.onLoad || load;
        args = [path, callback];

        if (onLoad.length === 3) {
            // Using the API that accepts 3 arguments: name, context, callback,
            // so add the context as the second argument.
            context.global.ext = context.global.ext || type;
            args.splice(1, 0, context);
        }

        onLoad.apply(undefined, args);
    };
};