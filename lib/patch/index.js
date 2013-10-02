'use strict';

var state = require('./state'),
    utils = require('./../utils'),
    dust = require('dustjs-linkedin');


var MY_SPECIAL_FRIEND = '☃';
var STATE;


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
    dust.load = dust.__cabbage__;
    delete dust.__cabbage__;
}


function when(predicate, behavior) {
    return function () {
        if (predicate()) {
            behavior.apply(undefined, arguments);
        }
    }
}


function applied() {
    return dust.load.name === 'cabbage';
}


function notApplied() {
    return !applied();
}


exports.apply = when(notApplied, apply);


exports.undo = when(applied, undo);