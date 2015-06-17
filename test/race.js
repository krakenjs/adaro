/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    assert = require('chai').assert,
    engine = require('../lib/engine');

describe('async rendering & races', function () {

    var instance;
    var dir = process.cwd();
    var defaultContext = {
        layout: 'layouts/master',
        address: {
            city: 'Campbell',
            state: 'CA',
            zip: '95008'
        },
        states: [{
            name: 'California',
            cities: [
                { name: 'San Diego' },
                { name: 'San Francisco' },
                { name: 'San Jose' }
            ]
        },
        {
            name: 'Virginia',
            cities: [
                { name: 'Fairfax' },
                { name: 'Gainsville' },
                { name: 'Manassass' }
            ]
        }]
    };

    var view = {
        root: path.join(__dirname, 'fixtures', 'templates'),
    };


    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(__dirname);
    });

    after(function () {
        process.chdir(dir);
    });

    afterEach(function () {
        instance.dust.cache = {};
    });


    function clone(obj) {
        return Object.keys(obj).reduce(function (dest, key) {
            var value = obj[key];
            if (Array.isArray(value)) {
                dest[key] = value.slice();
            } else if (typeof value === 'object') {
                dest[key] = clone(value);
            } else {
                dest[key] = value;
            }
            return dest;
        }, {});
    }

    function run(iterations, fn, complete) {
        var awaiting = 0;

        (function go() {

            awaiting += 1;
            fn(function () {
                awaiting -= 1;
                if (!iterations && !awaiting) {
                    complete();
                }
            });

            if (iterations) {
                setImmediate(go);
                iterations -= 1;
            }

        }());
    }

    describe('dust', function () {

        it('should compile and render templates', function (done) {
            instance = engine.create('dust', { cache: false });

            function exec(done) {
                var context = clone(defaultContext);
                context.ext = 'dust';

                instance.call(view, 'nested/index.dust', context, function (err, template) {
                    assert.ok(!err);
                    assert.isString(template);
                    done();
                });
            }

            run(1000, exec, done);
        });


        it('should render cached templates', function (done) {
            instance = engine.create('dust', { cache: true });

            function exec(done) {
                var context = clone(defaultContext);
                context.ext = 'dust';

                instance.call(view, 'nested/index.dust', context, function (err, template) {
                    assert.ok(!err);
                    assert.isString(template);
                    done();
                });
            }

            run(1000, exec, done);
        });

    });


    describe('js', function () {

        it('should render templates', function (done) {
            instance = engine.create('js', { cache: false });

            function exec(done) {
                var context = clone(defaultContext);
                context.ext = 'js';

                instance.call(view, 'nested/index.js', context, function (err, template) {
                    assert.ok(!err);
                    assert.isString(template);
                    done();
                });
            }

            run(1000, exec, done);
        });


        it('should render cached templates', function (done) {
            instance = engine.create('js', { cache: true });

            function exec(done) {
                var context = clone(defaultContext);
                context.ext = 'js';

                instance.call(view, 'nested/index.js', context, function (err, template) {
                    assert.ok(!err);
                    assert.isString(template);
                    done();
                });
            }

            run(1000, exec, done);
        });

    });

});
