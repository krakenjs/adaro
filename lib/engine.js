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

var isAbsolute = require('path-is-absolute');

var fs = require('fs');

var debug = require('debuglog')('adaro');

var freshy = require('freshy').freshy;


exports.create = function (type, config) {
    var reader, engine;

    config = config || {};
    config.cache = (config.cache === undefined) ? true : !!config.cache;


    var dust = freshy('dustjs-linkedin', function (dust) {
        for (var k in config) {
            dust.config[k] = config[k];
        }

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

    // This is assigned later, once the engine has actually been run. Loose coupling! Yay! (boo)
    var view;

    dust.onLoad = function (name, options, cb) {
        if (isAbsolute(name[0])) {
            debug("loading '%s'", name);
            read(null, name);
        } else if (view && view.lookup && view.lookup.length >= 3) {
            debug("looking up '%s' using view engine", name);
            view.lookup(name, options, read);
        } else {
            if (path.extname(name) !== options.ext) {
                name += options.ext;
            }
            // Fixme: handle multiple directories.
            var candidate = path.resolve(options.views, name);
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
                    cb(null, dust.loadSource(dust.compile(data, name)));
                }
            });

        }
    };

    engine = function engine(file, options, callback) {

        // The engine is called as a method of Express's view class; save a reference 
        // here for dust.onLoad to use.
        view = this;

        options = options || {};

        if (!file) {
            return callback(new Error("no template specified"));
        }

        var ext = path.extname(file);
        if (options.ext) {
            ext = '.' + options.ext;
        }

        var renderOptions = { config: config, views: utils.resolveViewDir(options), ext: ext };
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
            return dust.render(file, context, callback);
        }
    };


    engine.settings = utils.deepClone(config);
    engine.dust = dust;

    return engine;
};
