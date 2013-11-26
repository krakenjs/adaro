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

var state = require('./state'),
    utils = require('./../utils'),
    dust = require('dustjs-linkedin');


var MY_SPECIAL_FRIEND = '☃';
var STATE;
var active = 0;

function apply(config, reader) {
    // CABBAGE PATCH - Here comes the fun...
    // In order to provide request context to our `read` method we need to get creative with dust.
    // We don't to overwrite load, but we do want to use its conventions against it.
    dust.__cabbage__ = dust.load;

    if (STATE && STATE.matches(config, reader)) {
        // If the state of the app hasn't changed, don't create
        // a new patch, just reapply the existing one.
        dust.load = STATE.patch;
        return;
    }

    STATE = state.create(config, reader, dust.load = function cabbage(name, chunk, context) {
        var view, notCached, views;

        active += 1;

        view = name;
        notCached = !dust.cache[name];
        views = utils.resolveViewDir(context.global, MY_SPECIAL_FRIEND);

        if (notCached && views !== MY_SPECIAL_FRIEND) {
            // We exploit the cache to hook into load/onLoad behavior. Dust first checks the cache before
            // trying to load (using dust.cache[name]), so if we add a custom getter for a known key we can
            // get dust to call our code and replace its behavior without changing its internals.
            view = MY_SPECIAL_FRIEND;
            Object.defineProperty(dust.cache, view, {

                configurable: true,

                get: function () {
                    var self = this;

                    // Remove the getter immediately (must delete as it's a
                    // getter. setting it to undefined will fail.)
                    delete this[view];

                    return function (chunks, context) {
                        function onChunk(chunk) {
                            reader(name, utils.nameify(name), context, function (err, src) {
                                if (err) {
                                    chunk.setError(err);
                                    return;
                                }

                                // It's not a string, so we need to load and compile
                                // before we can evaluate
                                if (typeof src !== 'function') {
                                    src = dust.loadSource(dust.compile(src, name));
                                }

                                if (!config.cache) {
                                    delete self[name];
                                }

                                src(chunk, context).end();
                                active -= 1;
                            });
                        }

                        // Emulate what dust does when onLoad is called.
                        return chunks.map(onChunk);
                    };
                }

            });
        }

        return dust.__cabbage__(view, chunk, context);
    });
}


function undo() {
    if (!active) {
        dust.load = dust.__cabbage__;
        delete dust.__cabbage__;
    }
}


function when(predicate, behavior) {
    return function () {
        if (predicate()) {
            behavior.apply(undefined, arguments);
        }
    };
}


function applied() {
    return dust.load.name === 'cabbage';
}


function notApplied() {
    return !applied();
}


exports.apply = when(notApplied, apply);


exports.undo = when(applied, undo);