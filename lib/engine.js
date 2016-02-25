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
    Brook = require('./brook'),
    reqwire = require('./reqwire');
var VError = require('verror');
var aproba = require('aproba');

var isAbsolute = require('path-is-absolute');

var fs = require('fs');

var debug = require('debuglog')('adaro');

var freshy = require('freshy').freshy;


exports.create = function (type, config) {
    var engine;

    config = config || {};
    config.cache = (config.cache === undefined) ? true : !!config.cache;


    var dust = freshy('dustjs-linkedin', function (dust) {
        for (var k in config) {
            dust.config[k] = config[k];
        }

        // Implement our loader
        dust.onLoad = function (name, options, cb) {
            if (isAbsolute(name)) {
                if (options.name && dust.cache[options.name]) {
                    // We use the dust cache here, but under the requested name, not the resolved one to keep cache keying uniform.
                    return cb(null, dust.cache[options.name]);
                }
                debug("loading '%s' directly as it is an absolute path", name);
                read(null, name, options.name);
            } else if (options.view && options.view.lookup && options.view.lookup.length >= 3) {
                debug("looking up '%s' using view engine", name);
                var file = name;
                if (file.slice(-type.length) !== type) {
                    file += '.' + type;
                }
                options.view.lookup(file, options.locals, function (err, filename) {
                    read(err, filename, name);
                });
            } else {
                debug("looking up '%s' using internal methods", name);
                var f = name;
                if (path.extname(name) !== options.ext) {
                    f += options.ext;
                }
                // Fixme: handle multiple directories.
                var candidate = path.resolve(options.views, f);
                fs.stat(candidate, function (err, stat) {
                    if (err) {
                        return cb(err);
                    }

                    read(err, candidate, name);
                });
            }

            function read(err, file, name) {
                if (err) {
                    return cb(err);
                }

                fs.readFile(file, 'utf-8', function (err, data) {
                    debug("loaded '%s' as '%s'", file, name || file);
                    if (err) {
                        return cb(err);
                    }

                    if (type === 'js') {
                        cb(null, dust.loadSource(data));
                    } else if (type === 'dust') {
                        try {
                            cb(null, dust.loadSource(dust.compile(data, name || file)));
                        } catch (e) {
                            cb(e);
                        }
                    }
                });

            }
        };

        // Load referenced helpers
        if (Array.isArray(config.helpers)) {
            config.helpers.forEach(function (module) {
                // allow configuration of helpers like:
                // "helpers": ["./lib/abc", { "name": "./lib/test", "arguments": { "debug": true } }] 
                if (typeof module === 'function') {
                    return module(dust);
                }
                if (typeof module === 'string') {
                    reqwire.init(module, dust);
                }
                else if (module.hasOwnProperty('name')) {
                    reqwire.init(module.name, dust, module.arguments);
                }
            });
        }
    });

    engine = function engine(file, options, callback) {
        aproba('SOF', arguments);

        if (!this) {
            throw new Error("engine must be called with a View as context");
        }

        if (!file) {
            return callback(new Error("no template specified"));
        }

        var ext = this.ext || path.extname(file);

        var name = this.name || file;
        var nameNoExt = name.slice(-ext.length) === ext ? name.slice(0, -ext.length) : name;

        var renderOptions = {
            view: this, // so partials and content can use this object to do lookups
            views: this.root, // so that in the absence of an asynchronous lookup view, we can do our own resolution
            name: this.name, // so that the initial render and further renders can use the same style of cache keying
            ext: ext, // so that partial renders can use the same extension we are configured with,
            locals: options // so partials can get the full information passed to render
        };

        if (options.renderOptions) {
            for (var k in options.renderOptions) {
                renderOptions[k] = options.renderOptions[k];
            }
        }

        var context = dust.context({}, renderOptions).push(options);

        // set the root context's template name.
        context.templateName = nameNoExt;

        if (config.stream) {
            var stream = dust.stream(file, context);
            return callback(null, new Brook(stream));
        } else {
            return dust.render(file, context, function (err, data) {
                if (err) {
                    callback(new VError(err, 'Problem rendering dust template "%s"', file));
                } else {
                    callback(null, data);
                }
            });
        }
    };


    engine.settings = utils.deepClone(config);
    engine.dust = dust;

    return engine;
};
