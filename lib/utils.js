/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2014 eBay Software Foundation                                │
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
var REGEX_SPECIAL_CHARACTERS = /[-[\]{}()*+?.^$|]/g;


exports.isAbsolutePath = function isAbsolutePath(file) {
    return path.resolve(file) === file;
};


exports.nameify = function nameify(file, views, ext) {
    // If single view folder used
    if(typeof views === 'string') {
        views = [views];
    }

    for(var i in views) {
        // Windows. Ugh.
        views[i] = views[i] && views[i].replace(CRAZY_SLASHES, '\\\\');

        // Escape special characters in path
        views[i] = views[i] && views[i].replace(REGEX_SPECIAL_CHARACTERS, "\\$&");

        // Remove absolute path (if necessary)
        file = file.replace(new RegExp('^' + views[i]), '');
    }

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
