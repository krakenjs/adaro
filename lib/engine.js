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
            if (isAbsolute(name[0])) {
                debug("loading '%s'", name);
                read(null, name);
            } else if (options.view && options.view.lookup && options.view.lookup.length >= 3) {
                debug("looking up '%s' using view engine", name);
                if (name.slice(-type.length) !== type) {
                    name += '.' + type;
                }
                options.view.lookup(name, options, read);
            } else {
                if (path.extname(name) !== options.ext) {
                    name += options.ext;
                }
                // Fixme: handle multiple directories.
                var candidate = path.resolve(options.root, name);
                fs.stat(candidate, function (err, stat) {
                    if (err) {
                        return cb(err);
                    }

                    read(err, candidate);
                });
            }

            function read(err, file) {
                if (err) {
                    return cb(err);
                }
                debug("loaded '%s'", file);

                fs.readFile(file, 'utf-8', function (err, data) {
                    if (err) {
                        return cb(err);
                    }

                    if (type === 'js') {
                        cb(null, dust.loadSource(data));
                    } else if (type === 'dust') {
                        try {
                            cb(null, dust.loadSource(dust.compile(data, name)));
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

        var ext = path.extname(file);
        if (this.ext) {
            ext = this.ext;
        }

        var renderOptions = { config: config, view: this, root: this.root, ext: ext };
        if (options.renderOptions) {
            for (var k in options.renderOptions) {
                renderOptions[k] = options.renderOptions[k];
            }
        }

        var context = dust.context({}, renderOptions).push(options);

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
