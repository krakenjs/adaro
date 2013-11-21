/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2013 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
'use strict';

var path = require('path'),
    thing = require('core-util-is');


var CRAZY_SLASHES = new RegExp('\\\\', 'g');
var ROOT_DIR = new RegExp('^[^\\' + path.sep + ']*\\' + path.sep);
var ALL_SEPARATORS = new RegExp('\\' + path.sep, 'g');
var LEADING_SEPARATOR = new RegExp('^\\' + path.sep);


exports.isAbsolutePath = function isAbsolutePath(file) {
    return path.resolve(file) === file;
};


exports.nameify = function nameify(file, views, ext) {
    // Windows. Ugh.
    views = views && views.replace(CRAZY_SLASHES, '\\\\');

    // Remove absolute path (if necessary)
    file = file.replace(new RegExp('^' + views), '');

    // Remove file extension
    file = file.replace(ext, '');

    // Remove leading slash or drive (platform-dependent, e.g. `c:\\` or '/');
    file = exports.isAbsolutePath(file) ? file.replace(ROOT_DIR, '') : file;

    // Remove remaining leading slashes (if not abs path).
    file = file.replace(LEADING_SEPARATOR, '');

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


exports.deepClone = exports.deepCopy = function deepClone(src) {
    var dest = src;

    if (thing.isObject(src)) {
        dest = Array.isArray(src) ? [] : Object.create(Object.getPrototypeOf(src));
        Object.getOwnPropertyNames(src).forEach(function (prop) {
            var descriptor = Object.getOwnPropertyDescriptor(src, prop);
            descriptor.value = deepClone(descriptor.value);
            Object.defineProperty(dest, prop, descriptor);
        });
    }

    return dest;
};