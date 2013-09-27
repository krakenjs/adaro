'use strict';

var stream = require('stream'),
    objutil = require('objutil');


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


objutil.extend(River, stream.Readable, {

    _onData: function (chunk) {
        var flowing, queue;

        this._queue.push(chunk);

        flowing = this._flowing;
        queue = this._queue;

        while (flowing && queue.length) {
            flowing = this.push(queue.shift());
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
    }

});


module.exports = River;