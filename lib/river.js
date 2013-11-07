/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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