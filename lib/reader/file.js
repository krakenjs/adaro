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

var fs = require('fs'),
    path = require('path'),
    utils = require('../utils');



exports.createReader = function (type, proxy) {
    function load(name, options, cb) {
        var views, ext, file;

        views = utils.resolveViewDir(options);

        ext = options.ext || path.extname(name) || type;
        if (ext[0] !== '.') {
            ext = '.' + ext;
        }

        file = path.join(views, name + ext);

        fs.readFile(file, 'utf8', cb);
    }

    return function (path, name, options, callback) {
        // Use proxy or noop.
        proxy && (callback = proxy(name, callback));

        load(path, options, callback);
    };

};
