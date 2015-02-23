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

var freshy = require('freshy').freshy;
var path = require('path');
var utils = require('./utils');
var River = require('./brook');
var reqwire = require('./reqwire');
var dustjacket = require('dustjacket');
var fs = require('fs');


function loader (name, context, cb) {
    var views = utils.resolveViewDir(context.global);

    var ext = path.extname(name) || 'dust';
    if (ext[0] !== '.') {
        ext = '.' + ext;
    }

    var file = path.resolve(views, name + ext);
    fs.readFile(file, 'utf8', function (err, content) {
        if (err) {
            if (err.code !== 'ENOENT') {
                cb(err);
            } else {
                cb();
            }
        } else {
            cb(null, content );
        }
    });
}

exports.create = function (config) {
    config = config || {};

    var dust = freshy('dustjs-linkedin', function (dust) {
        // In this context, the currently-cached dustjs-linkedin is the one we're requiring,
        // but that will be expunged after this function ends, so we load this now so 
        // it's always available. All this is synchronous.
        require('dustjs-helpers');

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

        dustjacket.registerWith(dust);

        if (config.loaders) {
            config.loaders.forEach(function (loader) {
                dust.addLoadMiddleware(loader);
            });
        }

        dust.addLoadMiddleware(loader);

    });

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

        dust.render(name, context, callback);
    };

    // Make settings available
    Object.defineProperty(engine, 'settings', {
        get: function () {
            return utils.deepClone(config);
        }
    });

    engine.dust = dust;

    return engine;
};
