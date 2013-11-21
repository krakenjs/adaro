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

var fs = require('fs'),
    path = require('path'),
    dust = require('dustjs-linkedin'),
    utils = require('../utils');



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

    return function (path, name, context, callback) {
        var onLoad, args;

        // Use proxy or noop.
        proxy && (callback = proxy(name, callback));

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