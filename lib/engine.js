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
    utils = require('./utils'),
    River = require('./brook'),
    reqwire = require('./reqwire');

var freshy = require('freshy').freshy;


exports.create = function (type, config) {
    var reader, engine;

    config = config || {};
    config.cache = (config.cache === undefined) ? true : !!config.cache;


    var dust = freshy('dustjs-linkedin', function (dust) {
        freshy('dustjs-helpers');

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

        var loaders = {
            dust: require('./reader/dust')(dust),
            js: require('./reader/js')(dust)
        };

        dust.onLoad = function (name, options, cb) {
            loaders[options.type](name, utils.nameify(name), options || {}, cb);
        };

    });

    function reset() {
        if (!config.cache) {
            dust.cache = {};
        }
    }

    engine = function engine(file, options, callback) {
        var ext, views, name, layout, context, stream;

        options = options || {};

        if (!file) {
            return callback(new Error("no template specified"));
        }

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

        var renderOptions = { type: type, views: views, ext: ext, config: config };
        if (options.renderOptions) {
            for (var k in options.renderOptions) {
                renderOptions[k] = options.renderOptions[k];
            }
        }

        context = dust.context({}, renderOptions).push(options);

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


    engine.settings = utils.deepClone(config);
    engine.dust = dust;

    return engine;
};
