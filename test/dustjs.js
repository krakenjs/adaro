/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    engine = require('../index'),
    patch = require('../lib/patch'),
    dust = require('dustjs-linkedin'),
    assert = require('chai').assert,
    assertions = require('./assertions');


describe('adaro', function () {

    var dir = process.cwd();
    var context = { title: 'Hello, world!' };


    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(__dirname);
    });

    after(function () {
        process.chdir(dir);
    });


    describe('engine', function () {

        afterEach(patch.undo);

        it('should create a dust engine', function () {
            var config, dst;

            config = { cache: false, foo: 'bar' };
            dst = engine.dust(config);

            assert.isFunction(dst);
            assert.isObject(dst.settings);
            assert.strictEqual(dst.settings.cache, config.cache);
            assert.strictEqual(dst.settings.foo, config.foo);
        });


        it('should create a js engine', function () {
            var config, js;

            config = { cache: false, foo: 'bar' };
            js = engine.js(config);

            assert.isFunction(js);
            assert.isObject(js.settings);
            assert.strictEqual(js.settings.cache, config.cache);
            assert.strictEqual(js.settings.foo, config.foo);
        });

    });


    describe('dust', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine.dust({ cache: false }));
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
            patch.undo();
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
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


        it('should support custom onLoad', function (next) {
            var invoked = false;

            engine.onLoad = function (name, context, cb) {
                invoked = true;
                name = path.join(context.global.settings.views, name + '.' + context.global.ext);
                fs.readFile(name, 'utf8', cb);
            };

            inject('/inc/include', function (err, data) {
                assert.ok(!err);
                assert.isTrue(invoked);
                assert.strictEqual(data, assertions.SUBDIR);
                engine.onLoad = undefined;
                next();
            });
        });

    });



    describe('compiled js', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('js', engine.js({ cache: false }));
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
            patch.undo();
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
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


        it('should support custom onLoad', function (next) {
            var invoked = false;

            engine.onLoad = function (name, context, cb) {
                invoked = true;
                name = path.join(context.global.settings.views, name + '.' + context.global.ext);
                fs.readFile(name, 'utf8', cb);
            };

            inject('/inc/include', function (err, data) {
                assert.ok(!err);
                assert.isTrue(invoked);
                assert.strictEqual(data, assertions.SUBDIR);
                engine.onLoad = undefined;
                next();
            });
        });


    });


    describe('partials', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine.dust({ cache: false }));
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
            patch.undo();
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
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
            app = express();
            app.engine('dust', engine.dust({ cache: false, helpers: ['dustjs-helpers', { name: './fixtures/helpers/node', arguments: { greeting:'node' } }, './fixtures/helpers/browser'] }));
            app.engine('js', engine.js({ cache: false, helpers: ['dustjs-helpers', { name: './fixtures/helpers/node', arguments: { greeting:'node' } }, './fixtures/helpers/browser'] }));
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
            patch.undo();
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should use helper modules', function () {
            assert.isFunction(dust.helpers.sep);
            assert.isFunction(dust.helpers.eq);
        });


        it('should use arbitrary helpers', function () {
            assert.isFunction(dust.helpers.node);
            assert.isFunction(dust.helpers.browser);
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


    describe('onLoad API', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine.dust({ cache: false, helpers: ['dustjs-helpers'] }));
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

            app.get('/*', function (req, res) {
                res.render(req.path.substr(1), { title: 'Hello, world!' });
            });

            server = app.listen(8000, next);
        });


        after(function (next) {
            engine.onLoad = undefined;
            server.once('close', next);
            server.close();
            patch.undo();
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should support the default onLoad handler', function (next) {
            var invoked = false;

            engine.onLoad = function (name, cb) {
                invoked = true;
                name = path.join(process.cwd(), 'fixtures', 'templates', 'inc', 'include.dust');
                fs.readFile(name, 'utf8', cb);
            };

            inject('/inc/include', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, assertions.SUBDIR);
                assert.ok(invoked);
                app.set('view engine', 'dust');
                next();
            });
        });


        it('should support passing context to the onLoad handler', function (next) {
            var templates = [];
            var dustFile = path.join(process.cwd(), 'fixtures', 'templates', 'master.dust');

            engine.onLoad = function (name, context, callback) {
                name = path.join(context.global.settings.views, name + '.' + context.global.ext);
                templates.push(name);
                fs.readFile(name, 'utf8', callback);
            };

            inject('/master', function (err, data) {
                err && console.log(err);
                assert.ok(!err);
                assert.strictEqual(data, assertions.PARTIAL);
                assert.strictEqual(templates.length, 2);
                assert.strictEqual(templates[0], dustFile);
                next();
            });
        });

    });


    describe('layout', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine.dust({ cache: false, layout: 'layouts/master' }));
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

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
            patch.undo();
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
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
            app.engine('dust', engine.dust({ cache: false }));
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
            patch.undo();
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
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
            // Monkey-patch
            render = dust.render;

            app = express();
            app.engine('dust', engine.dust({ cache: false }));
            app.set('view engine', 'dust');
            app.set('view cache', false);
            app.set('views', path.join(process.cwd(), 'fixtures', 'templates'));

            app.get('/*', function (req, res) {
                res.render(req.path.substr(1), model);
            });

            server = app.listen(8000, next);
        });


        after(function (next) {
            server.once('close', next);
            server.close();
            dust.render = render;
            patch.undo();
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
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
            app.engine('dust', engine.dust({ cache: true }));
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
            patch.undo();
        });


        afterEach(function () {
            dust.cache = {};
        });


        it('should cache templates if enabled', function (next) {
            assert.isUndefined(dust.cache.index);

            inject('/index', function (err, data) {
                assert.isFunction(dust.cache.index);
                assert.ok(!err);
                assert.strictEqual(data, assertions.RESULT);

                // This request should pull from cache
                inject('/index', function (err, data) {
                    assert.isFunction(dust.cache.index);
                    assert.ok(!err);
                    assert.strictEqual(data, assertions.RESULT);
                    next();
                });
            });
        });

    });


    describe('js cache', function () {
        var app, server;


        before(function (next) {
            app = express();
            app.engine('js', engine.js({ cache: true }));
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
            patch.undo();
        });


        afterEach(function () {
            dust.cache = {};
        });


        it('should cache templates if enabled', function (next) {
            assert.isUndefined(dust.cache.index);

            inject('/index', function (err, data) {
                assert.isFunction(dust.cache.index);
                assert.ok(!err);
                assert.strictEqual(data, assertions.RESULT);

                // This request should pull from cache
                inject('/index', function (err, data) {
                    assert.isFunction(dust.cache.index);
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
                app.engine('dust', engine.dust({ cache: false, stream: true }));
                app.engine('js', engine.js({ cache: false, stream: true }));
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
                patch.undo();
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
                app.engine('dust', engine.dust({ cache: true, stream: true }));
                app.engine('js', engine.js({ cache: true, stream: true }));
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
                patch.undo();
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
