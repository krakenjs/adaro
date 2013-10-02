'use strict';

var path = require('path');


var LEADING_SEPARATOR = new RegExp('^[^\\' + path.sep + ']*\\' + path.sep);
var ALL_SEPARATORS = new RegExp('\\' + path.sep, 'g');


exports.isAbsolutePath = function isAbsolutePath(file) {
    return path.resolve(file) === file;
};


exports.nameify = function nameify(file, views, ext) {
    file = file.replace(new RegExp('^' + views), ''); // Remove absolute path (if necessary)
    file = file.replace(ext, '');   // Remove file extension
    file = exports.isAbsolutePath(file) ? file.replace(LEADING_SEPARATOR, '') : file; // Remove leading slash (platform-dependent, if necessary)
    file = file.replace(ALL_SEPARATORS, '/'); // Ensure path separators in name are all forward-slashes.
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
