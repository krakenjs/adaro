'use strict';

var stream = require('stream'),
    objutil = require('objutil');


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


objutil.extend(Brook, stream.Readable, {

    _onData: function (chunk) {
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
    },

    _onError: function (err) {
        this._flowing = false;
        this._queue = undefined;
        this.emit('error', err);
    },

    _onEnd: function () {
        if (!this._flowing) {
            this._queue.push(null);
            return;
        }

        this._flowing = false;
        this._queue = undefined;
        this.push(null);
    },

    _read: function (size) {
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
    }

});


module.exports = Brook;