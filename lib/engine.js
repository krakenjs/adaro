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
    dust = require('dustjs-linkedin'),
    utils = require('./utils'),
    River = require('./brook'),
    reqwire = require('./reqwire');
var dustjacket = require('dustjacket');
var fs = require('fs');

function createRenderContext(options) {
    var context;

    // Hoist *only* view, settings, and ext to global context.
    context = dust.makeBase({
        views: options.views,
        settings: options.settings,
        ext: options.ext
    });

    // Remove from child context so global values are used.
    delete options.views;
    delete options.settings;
    delete options.ext;

    context = context.push(options);
    return context;
}



exports.create = function (type, config) {
    config = config || {};

    // Load referenced helpers
    if (Array.isArray(config.helpers)) {
        config.helpers.forEach(function (module) {
            // allow configuration of helpers like:
            // "helpers": ["./lib/abc", { "name": "./lib/test", "arguments": { "debug": true } }] 
            if (typeof module === 'string') {
                reqwire.init(module, dust);
            }
            else if (module.hasOwnProperty('name')) {
                reqwire.init(module.name, dust, module.arguments);
            }
        });
    }

    var engine = function engine(file, options, callback) {
        var ext, views, name, layout, context, stream;

        options = options || {};

        // Figure out where the views live.
        views = utils.resolveViewDir(options);

        // Get the correct extension. (NOTE: requires leading '.')
        ext = path.extname(file);
        if (options.ext) {
            ext = '.' + options.ext;
        }

        // Resolve page layout, first checking request context options,
        // then falling back to application config. Explicit `false` for
        // and settings disables layout.
        layout = undefined;
        if (options.layout !== false) {
            layout = options.layout;
            if (config.layout !== false) {
                layout = layout || config.layout;
            }
        }

        // Get the correct template name from the provided file name and
        // sort out context/template, etc.
        name = utils.nameify(file, views, ext);
        if (typeof layout === 'string') {
            options._main = name;
            name = layout;
        }

        context = createRenderContext(options);
        if (config.stream) {
            stream = dust.stream(name, context);
            callback(null, new River(stream));
            return;
        }

        dust.render(name, context, function () {
            callback.apply(undefined, arguments);
        });
    };

    dustjacket.registerWith(dust);

    dust.addLoadMiddleware(function (name, context, cb) {
        var views = utils.resolveViewDir(context.global);

        var ext = path.extname(name) || type;
        if (ext[0] !== '.') {
            ext = '.' + ext;
        }

        var file = path.join(views, name + ext);
        fs.readFile(file, 'utf8', function (err, content) {
            if (err) {
                if (err.code !== 'ENOENT') {
                    cb(err);
                } else {
                    cb();
                }
            } else {
                cb(null, type === 'js' ? { source: content } : content );
            }
        });
    });

    // Make settings available
    Object.defineProperty(engine, 'settings', {
        get: function () {
            return utils.deepClone(config);
        }
    });

    return engine;
};
