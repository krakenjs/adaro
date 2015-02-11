"use strict";
var hammer = require('hammertime');
var adaro = require('./');
var path = require('path');

var engine = adaro();

var views = path.resolve(__dirname, 'test/fixtures/templates/');
hammer({
    before: function niceBeats(next) {
        next();
    },
    after: function noTouch(results) {
        console.dir(results);
    },
    iterations: 10000
}).time(function (next) {
    engine('index', {views: views}, function () {
        setImmediate(next);
    });
});
