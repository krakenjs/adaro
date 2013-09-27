'use strict';

var dust = require('dustjs-linkedin'),
    engine = require('./lib/engine');


// Load helpers
require('dustjs-helpers');


module.exports = Object.create(dust, {

    onLoad: {
        enumerable: true,

        get: function () {
            return dust.onLoad;
        },

        set: function (value) {
            dust.onLoad = value;
        }

    },

    js: {
        enumerable: true,
        value: engine.create.bind(undefined, 'js')
    },

    dust: {
        enumerable: true,
        value: engine.create.bind(undefined, 'dust')
    }

});