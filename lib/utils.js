/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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