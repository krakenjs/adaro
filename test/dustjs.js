/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    express = require('express'),
    engine = require('../index'),
    assert = require('chai').assert,
    assertions = require('./assertions');


describe('adaro', function () {

    describe('engine', function () {

        it('should create a dust engine', function () {
            var config, dst;

            config = { foo: 'bar' };
            dst = engine(config);

            assert.isFunction(dst);
            assert.isObject(dst.settings);
            assert.strictEqual(dst.settings.foo, config.foo);
        });

    });


    describe('dust', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine());
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.resolve(__dirname, 'fixtures/templates'));

            app.get('/*', function (req, res) {
                res.render(req.path.substr(1), { title: 'Hello, world!' });
            });

            server = app.listen(8000, next);
        });


        after(function (next) {
            server.once('close', next);
            server.close();
        });


        afterEach(function () {
            app.engines['.dust'].dust.cache = {};
        });


        it('should render a template', function (next) {
            inject('/index', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.RESULT);
                next();
            });
        });


        it('should render a template in a subdirectory', function (next) {
            inject('/inc/include', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.SUBDIR);
                next();
            });
        });


    });



    describe('partials', function () {

        var app, server;

        before(function (next) {
            app = express();
            var e = engine();
            console.log(e.dust.helpers);
            app.engine('dust', e);
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.resolve(__dirname, 'fixtures/templates'));

            app.get('/*', function (req, res) {
                res.render(req.path.substr(1), { title: 'Hello, world!' });
            });

            server = app.listen(8000, next);
        });


        after(function (next) {
            server.once('close', next);
            server.close();
        });


        afterEach(function () {
            app.engines['.dust'].dust.cache = {};
        });


        it('should render a template', function (next) {
            inject('/master', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.PARTIAL_NO_HELPERS);
                next();
            });
        });

    });


    describe('helpers', function () {

        var app, server;

        before(function (next) {
            var popd = pushd(__dirname);
            app = express();
            app.engine('dust', engine({ helpers: ['dustjs-helpers', { name: './fixtures/helpers/node', arguments: { greeting:'node' } }, './fixtures/helpers/browser'] }));
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.resolve(__dirname, 'fixtures/templates'));

            app.get('/*', function (req, res) {
                res.render(req.path.substr(1), { title: 'Hello, world!' });
            });
            popd();

            server = app.listen(8000, next);
        });


        after(function (next) {
            server.once('close', next);
            server.close();
        });


        afterEach(function () {
            app.engines['.dust'].dust.cache = {};
        });


        it('should use helper modules', function () {
            assert.isFunction(app.engines['.dust'].dust.helpers.sep);
            assert.isFunction(app.engines['.dust'].dust.helpers.idx);
        });


        it('should use arbitrary helpers', function () {
            assert.isFunction(app.engines['.dust'].dust.helpers.node);
            assert.isFunction(app.engines['.dust'].dust.helpers.browser);
        });


        it('should use helpers for templates', function (next) {
            inject('/helper', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.HELPER);
                next();
            });
        });

    });


    describe('layout', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine({ layout: 'layouts/master' }));
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.resolve(__dirname, 'fixtures/templates'));

            app.get('/*', function (req, res) {
                var model = { title: 'Hello, world!' };
                if (req.query.layout) {
                    model.layout = (req.query.layout === 'false') ? false : req.query.layout;
                }
                res.render(req.path.substr(1), model);
            });

            server = app.listen(8000, next);
        });


        after(function (next) {
            server.once('close', next);
            server.close();
        });


        afterEach(function () {
            app.engines['.dust'].dust.cache = {};
        });


        it('should support a global layout', function (next) {
            inject('/inc/include', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.LAYOUT);
                next();
            });
        });


        it('should allow local layouts', function (next) {
            inject('/inc/include?layout=layouts/altmaster', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.ALT_LAYOUT);
                next();
            });
        });


        it('should allow layout to be disabled', function (next) {
            inject('/inc/include?layout=false', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.SUBDIR);
                next();
            });
        });

    });


    describe('block scope', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine());
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.resolve(__dirname, 'fixtures/templates'));

            app.get('/*', function (req, res) {
                res.render(req.path.substr(1), { emoji: [':neckbeard:', ':poop:'] });
            });

            server = app.listen(8000, next);
        });


        after(function (next) {
            server.once('close', next);
            server.close();
        });


        afterEach(function () {
            app.engines['.dust'].dust.cache = {};
        });


        it('should function without error', function (next) {
            inject('/iterator', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.BLOCK_SCOPE);
                next();
            });
        });

    });


    describe('support monkey-patched dust', function () {

        var app, server, model, render;

        model = {
            address: {
                city: 'Campbell',
                state: 'CA',
                zip: '95008'
            },
            states: [
                {
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
                }
            ]
        };

        before(function (next) {

            app = express();
            app.engine('dust', engine());
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.resolve(__dirname, 'fixtures/templates'));

            // Monkey-patch
            render = app.engines['.dust'].dust.render;

            app.get('/*', function (req, res) {
                res.render(req.path.substr(1), model);
            });

            server = app.listen(8000, next);
        });


        after(function (next) {
            server.once('close', next);
            server.close();
            app.engines['.dust'].dust.render = render;
        });


        afterEach(function () {
            app.engines['.dust'].dust.cache = {};
        });


        it('should function without error', function (next) {
            inject('/nested/index', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.MAKE_BASE);
                next();
            });
        });
    });


    describe('dust cache', function () {
        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine({ cache: true }));
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.resolve(__dirname, 'fixtures/templates'));

            app.get('/*', function (req, res) {
                res.render(req.path.substr(1), { title: 'Hello, world!' });
            });

            server = app.listen(8000, next);
        });


        after(function (next) {
            server.once('close', next);
            server.close();
        });


        afterEach(function () {
            app.engines['.dust'].dust.cache = {};
        });


        it('should cache templates if enabled', function (next) {
            assert.isUndefined(app.engines['.dust'].dust.cache.index);

            inject('/index', function (err, data) {
                assert.isFunction(app.engines['.dust'].dust.cache.index);
                assert.ok(!err);
                assert.strictEqual(data, assertions.RESULT);

                // This request should pull from cache
                inject('/index', function (err, data) {
                    assert.isFunction(app.engines['.dust'].dust.cache.index);
                    assert.ok(!err);
                    assert.strictEqual(data, assertions.RESULT);
                    next();
                });
            });
        });

    });


    describe('streaming', function () {

        describe('with caching', function () {
            var app, server;

            before(function (next) {
                app = express();
                app.engine('dust', engine({ cache: true, stream: true }));
                app.set('view engine', 'dust');
                app.set('view cache', false);
                app.set('views', path.resolve(__dirname, 'fixtures/templates'));

                app.get('/*', function (req, res) {
                    res.render(req.path.substr(1), { title: 'Hello, world!' }, function (err, stream) {
                        stream.pipe(res);
                    });
                });

                server = app.listen(8000, next);
            });


            after(function (next) {
                server.once('close', next);
                server.close();
            });


            it('should support streaming dust templates', function (next) {
                inject('/master', function (err, data) {
                    assert.ok(!err);
                    assert.strictEqual(data, assertions.PARTIAL);

                    inject('/master', function (err, data) {
                        assert.ok(!err);
                        assert.strictEqual(data, assertions.PARTIAL);
                        next();
                    });
                });
            });

        });

    });

});



function inject(path, callback) {
    var req = require('http').request({ method: 'GET', port: 8000, path: path }, function (res) {
        var data = [];

        res.on('data', function (chunk) {
            data.push(chunk);
        });

        res.on('end', function () {
            var body = Buffer.concat(data).toString('utf8');
            if (res.statusCode !== 200) {
                callback(new Error(body));
                return;
            }
            callback(null, body);
        });
    });
    req.on('error', callback);
    req.end();
}

function pushd(target) {
    var dir = process.cwd();
    process.chdir(target);
    return function () {
        process.chdir(dir);
    };
}
