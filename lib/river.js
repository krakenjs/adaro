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

var util = require('util'),
    stream = require('stream');


function River(stream) {
    River.super_.call(this);

    this._flowing = true;
    this._queue = [];

    var self = this;
    stream.on('data', function () {
        var args = arguments;
        process.nextTick(function () {
            self._onData.apply(self, args);
        });
    });
    stream.on('error', function () {
        var args = arguments;
        process.nextTick(function () {
            self._onError.apply(self, args);
        });
    });
    stream.on('end', function () {
        var args = arguments;
        process.nextTick(function () {
            self._onEnd.apply(self, args);
        });
    });
}


util.inherits(River, stream.Readable);



River.prototype._onData = function (chunk) {
    var flowing, queue;

    this._queue.push(chunk);

    flowing = this._flowing;
    queue = this._queue;

    while (flowing && queue.length) {
        flowing = this.push(queue.shift());
    }

    this._flowing = flowing;
};


River.prototype._onError = function (err) {
    this._flowing = false;
    this._queue = undefined;
    this.emit('error', err);
};


River.prototype._onEnd = function () {
    if (!this._flowing) {
        this._queue.push(null);
        return;
    }

    this._flowing = false;
    this._queue = undefined;
    this.push(null);
};


River.prototype._read = function (size) {
    var chunk, flowing, queue;

    if (!this._queue.length) {
        this._flowing = true;
        return;
    }

    flowing = true;
    queue = this._queue;

    while (flowing && queue.length) {

        chunk = queue.shift();
        if (chunk === null) {
            this._flowing = false;
            this._queue = undefined;
            this.push(null);
            return;
        }

        chunk = new Buffer(chunk, 'utf8');
        if (chunk.length > size) {
            queue.unshift(chunk.slice(size));
            chunk = chunk.slice(0, size);
        }

        flowing = this.push(chunk);

    }

    this._flowing = flowing;
};


module.exports = River;