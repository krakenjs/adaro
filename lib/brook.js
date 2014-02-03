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

var util = require('util'),
    stream = require('stream');


function Brook(stream) {
    Brook.super_.call(this);

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


util.inherits(Brook, stream.Readable);


Brook.prototype._onData = function (chunk) {
    var flowing, queue;

    flowing = this._flowing;
    queue = this._queue;

//        // This is the simple version. Keeping around as a perf benchmark.
//        this._queue.push(new Buffer(chunk, 'utf8'));
//        while (flowing && queue.length) {
//            flowing = this.push(queue.shift());
//        }

    chunk = new Buffer(chunk, 'utf8');

    if (this._queue.length) {
        this._queue.push(chunk);
        while (flowing && queue.length) {
            flowing = this.push(queue.shift());
        }
    } else {
        flowing = this.push(chunk);
    }

    this._flowing = flowing;
};


Brook.prototype._onError = function (err) {
    this._flowing = false;
    this._queue = undefined;
    this.emit('error', err);
};


Brook.prototype._onEnd = function () {
    if (!this._flowing) {
        this._queue.push(null);
        return;
    }

    this._flowing = false;
    this._queue = undefined;
    this.push(null);
};


Brook.prototype._read = function (size) {
    var complete, flowing, queue, remainder, current, next;

    if (!this._queue.length) {
        this._flowing = true;
        return;
    }

    if (this._queue[this._queue.length - 1] === null) {
        this._queue.pop();
        complete = true;
    }

    flowing = true;
    queue = this._queue;

    while (flowing && queue.length) {
        current = queue.shift();
        if (current.length > size) {
            queue.unshift(current.slice(size));
        }

        current = current.slice(0, size);
        remainder = size - current.length;

        while (remainder && queue.length) {
            next = queue.shift();

            if (next.length > remainder) {
                queue.unshift(next.slice(remainder));
                next = next.slice(0, remainder);
            }

            current = Buffer.concat([current, next]);
            remainder = size - current.length;
        }

        flowing = this.push(current);
    }

    if (complete) {
        if (flowing) {
            this._queue = undefined;
            flowing = false;
            this.push(null);
        } else {
            this._queue.push(null);
        }
    }

    this._flowing = flowing;
};


module.exports = Brook;