/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    engine = require('../index'),
    assert = require('chai').assert,
    assertions = require('./assertions');


describe('adaro', function () {

    var dir = process.cwd();

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(__dirname);
    });

    after(function () {
        process.chdir(dir);
    });


    describe('engine', function () {

        it('should create a dust engine', function () {
            var config, renderer;

            config = { cache: false, foo: 'bar' };
            renderer = engine.dust(config);

            assert.isFunction(renderer);
            assert.isObject(renderer.settings);
            assert.strictEqual(renderer.settings.cache, config.cache);
            assert.strictEqual(renderer.settings.foo, config.foo);
            assert.strictEqual(renderer.dust.config.foo, config.foo);
        });


        it('should create a js engine', function () {
            var config, js;

            config = { cache: false, foo: 'bar' };
            js = engine.js(config);

            assert.isFunction(js);
            assert.isObject(js.settings);
            assert.strictEqual(js.settings.cache, config.cache);
            assert.strictEqual(js.settings.foo, config.foo);
            assert.strictEqual(js.dust.config.foo, config.foo);
        });

        it('should pass renderOptions to onLoad', function (next) {
            var config, renderer;

            config = { cache: false, foo: 'bar' };
            renderer = engine.dust(config);
            renderer.dust.onLoad = function (name, options, cb) {
                cb(null, options.content);
            };

            renderer.call({ root: 'whatever' }, 'unimportant', { renderOptions: { content: 'content here' } }, function (err, rendered) {
                assert.ok(!err);
                assert.strictEqual(rendered, 'content here');
                next();
            });
        });
    });


    describe('dust', function () {

        var app, server, renderer;

        before(function (next) {
            app = express();
            renderer = engine.dust({ cache: false, whitespace: true });
            app.engine('dust', renderer);
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
            assert.strictEqual(Object.keys(renderer.dust.cache).length, 0);
        });


        it('should render a template', function (next) {
            inject('/index', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.RESULT);
                next();
            });
        });

        it('should preserve whitespace', function (next) {
            inject('/whitespace', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.WHITESPACE);
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



    describe('compiled js', function () {

        var app, server, renderer;

        before(function (next) {
            app = express();
            renderer = engine.js({ cache: false });
            app.engine('js', renderer);
            app.set('view engine', 'js');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
            assert.strictEqual(Object.keys(renderer.dust.cache).length, 0);
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

        var app, server, renderer;

        before(function (next) {
            app = express();
            renderer = engine.dust({
                cache: false, helpers: [
                    'dustjs-helpers'
                ]
            });
            app.engine('dust', renderer);
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
            assert.strictEqual(Object.keys(renderer.dust.cache).length, 0);
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

        var app, server, dustRenderer, jsRenderer;

        before(function (next) {
            app = express();
            dustRenderer = engine.dust({
                cache: false,
                helpers: [
                    'dustjs-helpers',
                    { name: './fixtures/helpers/node', arguments: { greeting:'node' } },
                    './fixtures/helpers/browser'
                ]
            });
            app.engine('dust', dustRenderer);
            jsRenderer = engine.js({
                cache: false,
                helpers: [
                    'dustjs-helpers',
                    { name: './fixtures/helpers/node', arguments: { greeting:'node' } },
                    './fixtures/helpers/browser'
                ]
            });
            app.engine('js', jsRenderer);
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
            assert.strictEqual(Object.keys(jsRenderer.dust.cache).length, 0);
            assert.strictEqual(Object.keys(dustRenderer.dust.cache).length, 0);
        });


        it('should use helper modules', function () {
            assert.isFunction(jsRenderer.dust.helpers.sep);
            assert.isFunction(jsRenderer.dust.helpers.eq);
            assert.isFunction(dustRenderer.dust.helpers.sep);
            assert.isFunction(dustRenderer.dust.helpers.eq);
        });


        it('should use arbitrary helpers', function () {
            assert.isFunction(jsRenderer.dust.helpers.node);
            assert.isFunction(jsRenderer.dust.helpers.browser);
            assert.isFunction(dustRenderer.dust.helpers.node);
            assert.isFunction(dustRenderer.dust.helpers.browser);
        });


        it('should use helpers for templates', function (next) {
            inject('/helper', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.HELPER);
                next();
            });
        });


        it('should use helpers for precompiled js', function (next) {
            app.set('view engine', 'js');

            inject('/helper', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.HELPER);
                app.set('view engine', 'dust');
                next();
            });
        });

    });


    describe('block scope', function () {

        var app, server, renderer;

        before(function (next) {
            app = express();
            renderer = engine.dust({
                cache: false,
                helpers: [
                    'dustjs-helpers',
                    { name: './fixtures/helpers/node', arguments: { greeting:'node' } },
                    './fixtures/helpers/browser'
                ]
            });
            app.engine('dust', renderer);
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
            assert.strictEqual(Object.keys(renderer.dust.cache).length, 0);
        });


        it('should function without error', function (next) {
            inject('/iterator', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.BLOCK_SCOPE);
                next();
            });
        });

    });


    describe('dust cache', function () {
        var app, server, renderer;

        before(function (next) {
            app = express();
            renderer = engine.dust({ cache: true });
            app.engine('dust', renderer);
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
            renderer.dust.cache = {};
        });


        it('should cache templates if enabled', function (next) {
            assert.isUndefined(renderer.dust.cache.index);

            inject('/index', function (err, data) {
                assert.ok(typeof renderer.dust.cache.index === 'function');
                assert.ok(!err);
                assert.strictEqual(data, assertions.RESULT);

                // This request should pull from cache
                inject('/index', function (err, data) {
                    assert.ok(typeof renderer.dust.cache.index === 'function');
                    assert.ok(!err);
                    assert.strictEqual(data, assertions.RESULT);
                    next();
                });
            });
        });

    });


    describe('js cache', function () {
        var app, server, renderer;


        before(function (next) {
            app = express();
            renderer = engine.js({ cache: true });
            app.engine('js', renderer);
            app.set('view engine', 'js');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
            renderer.dust.cache = {};
        });


        it('should cache templates if enabled', function (next) {
            assert.isUndefined(renderer.dust.cache.index);

            inject('/index', function (err, data) {
                assert.isFunction(renderer.dust.cache.index);
                assert.ok(!err);
                assert.strictEqual(data, assertions.RESULT);

                // This request should pull from cache
                inject('/index', function (err, data) {
                    assert.isFunction(renderer.dust.cache.index);
                    assert.ok(!err);
                    assert.strictEqual(data, assertions.RESULT);
                    next();
                });
            });
        });

    });


    describe('streaming', function () {

        describe('without caching', function () {
            var app, server;

            before(function (next) {
                app = express();
                app.engine('dust', engine.dust({
                    cache: false,
                    stream: true,
                    helpers: [
                        'dustjs-helpers',
                        { name: './fixtures/helpers/node', arguments: { greeting:'node' } },
                        './fixtures/helpers/browser'
                    ]
                }));
                app.engine('js', engine.js({
                    cache: false,
                    stream: true,
                    helpers: [
                        'dustjs-helpers',
                        { name: './fixtures/helpers/node', arguments: { greeting:'node' } },
                        './fixtures/helpers/browser'
                    ]
                }));
                app.set('view engine', 'dust');
                app.set('view cache', false);
                app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

                app.get('/*', function (req, res, next) {
                    res.render(req.path.substr(1), { title: 'Hello, world!' }, function (err, stream) {
                        if (err) {
                            next(err);
                            return;
                        }
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
                        app.set('view engine', 'js');
                        next();
                    });
                });
            });


            it('should support streaming compiled js templates', function (next) {
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


        describe('with caching', function () {
            var app, server;

            before(function (next) {
                app = express();
                app.engine('dust', engine.dust({
                    cache: true,
                    stream: true,
                    helpers: [
                        'dustjs-helpers',
                        { name: './fixtures/helpers/node', arguments: { greeting:'node' } },
                        './fixtures/helpers/browser'
                    ]
                }));
                app.engine('js', engine.js({
                    cache: true,
                    stream: true,
                    helpers: [
                        'dustjs-helpers',
                        { name: './fixtures/helpers/node', arguments: { greeting:'node' } },
                        './fixtures/helpers/browser'
                    ]
                }));
                app.set('view engine', 'dust');
                app.set('view cache', false);
                app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
                        app.set('view engine', 'js');
                        next();
                    });
                });
            });


            it('should support streaming compiled js templates', function (next) {
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
