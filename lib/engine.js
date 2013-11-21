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
    dust = require('dustjs-linkedin'),
    utils = require('./utils'),
    patch = require('./patch'),
    River = require('./brook'),
    reqwire = require('./reqwire');


var loaders = {
    dust: require('./reader/dust'),
    js: require('./reader/js')
};



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
    var reader, engine;

    config = config || {};
    config.cache = (config.cache === undefined) ? true : !!config.cache;

    // Load referenced helpers
    if (Array.isArray(config.helpers)) {
        config.helpers.forEach(function (name) {
            reqwire.init(name, dust);
        });
    }

    function reset() {
        patch.undo();
        if (!config.cache) {
            dust.cache = {};
        }
    }

    reader = loaders[type].create();
    engine = function engine(file, options, callback) {
        var ext, views, name, layout, context, stream;

        options = options || {};

        // This needs to be deferred until runtime in case an engine
        // gets created and isn't used. That's because it modifies
        // a global dust object.
        patch.apply(config, reader);

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
            stream.on('error', reset);
            stream.on('end', reset);
            callback(null, new River(stream));
            return;
        }

        dust.render(name, context, function () {
            reset();
            callback.apply(undefined, arguments);
        });
    };

    // Make settings available
    Object.defineProperty(engine, 'settings', {
        get: function () {
            return utils.deepClone(config);
        }
    });

    return engine;
};