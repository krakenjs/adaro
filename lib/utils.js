'use strict';

var path = require('path');


var LEADING_SEPARATOR = new RegExp('^[^\\' + path.sep + ']*\\' + path.sep);
var ALL_SEPARATORS = new RegExp('\\' + path.sep, 'g');


exports.isAbsolutePath = function isAbsolutePath(file) {
    return path.resolve(file) === file;
};


exports.nameify = function nameify(file, views, ext) {
    // Windows. Ugh.
    views = views && views.replace(new RegExp('\\\\', 'g'), '\\\\');

    // Remove absolute path (if necessary)
    file = file.replace(new RegExp('^' + views), '');

    // Remove file extension
    file = file.replace(ext, '');

    // Remove leading slash or drive (platform-dependent, e.g. `c:\\` or '/');
    file = exports.isAbsolutePath(file) ? file.replace(LEADING_SEPARATOR, '') : file;

    // Remove remaining leading slashes (if not abs path).
    file = file.replace(new RegExp('^\\' + path.sep), '');

    // Ensure path separators in name are all forward-slashes.
    file = file.replace(ALL_SEPARATORS, '/');

    return file;
};


exports.resolveViewDir = function resolveViewDir(context, fallback) {
    var views;

    views = context.views || fallback || '.';
    if (context.settings) {
        views = context.settings.views || views;
    }

    return views;
};
