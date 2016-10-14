/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2016 PayPal                                                  │
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

var assert = require('assert'),
    freshy = require('freshy').freshy,
    path = require('path');

var reqwire = module.exports = function (/*modules*/) {
    var result, failed;

    result = undefined;
    failed = [];

    Array.prototype.slice.call(arguments).some(function (moduleName) {
        try {
            result = freshy(moduleName);
        } catch (err) {
            // noop
            failed.push(moduleName);
        }
        return !!result;
    });

    assert.notStrictEqual(failed.length, arguments.length, 'Cannot find module: \'' + failed.join('\', \'') + '\'');
    return result;
};


reqwire.init = function (/*name, args...*/) {
    var args, name, helper;

    args = Array.prototype.slice.call(arguments);
    name = args.shift();

    if (~name.indexOf('/')) {
        name = path.join(process.cwd(), name);
    }

    helper = reqwire(name); // Should be a dependency of the parent app
    if (typeof helper === 'function') {
        // Handle API that returns an initialization function. Otherwise, assume
        // it conforms to the same pattern as dustjs-helpers.
        helper.apply(undefined, args);
    } else if (typeof helper === 'object' && typeof helper.registerWith === 'function') {
        // Handle API that returns an object with a registerWith function.
        helper.registerWith.apply(undefined, args);
    }
};
