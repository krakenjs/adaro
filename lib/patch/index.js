/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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