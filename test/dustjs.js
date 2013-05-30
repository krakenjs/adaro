/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    engine = require('../index'),
    dust = require('dustjs-linkedin'),
    assert = require('chai').assert;


describe('express-dustjs', function () {

    var context = { title: 'Hello, world!' };

    var RESULT = '<!DOCTYPE html><html lang="en"><head><title>Hello, world!</title></head><body><h1>node template test</h1></body></html>';
    var HELPER_RESULT = '<h1>node template test Hello, world!</h1>';
    var PARTIAL_RESULT = '<!DOCTYPE html><html lang="en"><head><title>Hello, world!</title></head><body><h1>node template test Hello, world!</h1></body></html>';
    var SUBDIR_RESULT = '<p>howdy doodie</p>';
    var LAYOUT_RESULT = '<html><head><title>Master</title></head><body><p>howdy doodie</p></body></html>';
    var ALT_LAYOUT_RESULT = '<html><head><title>Alternate Master</title></head><body><p>howdy doodie</p></body></html>';
    var BLOCK_SCOPE_RESULT = '<h1>node template test </h1>:neckbeard:<h1>node template test </h1>:poop:';
    var MAKE_BASE_RESULT = 'CampbellCA95008<h1>California</h1><h2>San Diego</h2><h2>San Francisco</h2><h2>San Jose</h2><h1>Virginia</h1><h2>Fairfax</h2><h2>Gainsville</h2><h2>Manassass</h2>';


    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(__dirname);
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
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should render a template', function (next) {
            inject('/index', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, RESULT);
                next();
            });
        });


        it('should render a template in a subdirectory', function (next) {
            inject('/inc/include', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, SUBDIR_RESULT);
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
                assert.strictEqual(data, SUBDIR_RESULT);
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
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should render a template', function (next) {
            inject('/index', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, RESULT);
                next();
            });
        });


        it('should render a template in a subdirectory', function (next) {
            inject('/inc/include', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, SUBDIR_RESULT);
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
                assert.strictEqual(data, SUBDIR_RESULT);
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
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should render a template', function (next) {
            inject('/master', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, PARTIAL_RESULT);
                next();
            });
        });

    });


    describe('helpers', function () {

        var app, server;

        before(function (next) {
            app = express();
            app.engine('dust', engine.dust({ cache: false, helpers: ['dustjs-helpers'] }));
            app.engine('js', engine.js({ cache: false, helpers: ['dustjs-helpers'] }));
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
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should use helpers for templates', function (next) {
            inject('/helper', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, HELPER_RESULT);
                next();
            });
        });


        it('should use helpers for precompiled js', function (next) {
            app.set('view engine', 'js');

            inject('/helper', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, HELPER_RESULT);
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
                assert.strictEqual(data, SUBDIR_RESULT);
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
                assert.strictEqual(data, PARTIAL_RESULT);
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
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should support a global layout', function (next) {
            inject('/inc/include', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, LAYOUT_RESULT);
                next();
            });
        });


        it('should allow local layouts', function (next) {
            inject('/inc/include?layout=layouts/altmaster', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, ALT_LAYOUT_RESULT);
                next();
            });
        });


        it('should allow layout to be disabled', function (next) {
            inject('/inc/include?layout=false', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, SUBDIR_RESULT);
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
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should function without error', function (next) {
            inject('/iterator', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, BLOCK_SCOPE_RESULT);
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
        });


        afterEach(function () {
            assert.strictEqual(Object.keys(dust.cache).length, 0);
        });


        it('should function without error', function (next) {
            inject('/nested/index', function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, MAKE_BASE_RESULT);
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
        });


        afterEach(function () {
            dust.cache = {};
        });


        it('should cache templates if enabled', function (next) {
            assert.isUndefined(dust.cache.index);

            inject('/index', function (err, data) {
                assert.isFunction(dust.cache.index);
                assert.ok(!err);
                assert.strictEqual(data, RESULT);

                // This request should pull from cache
                inject('/index', function (err, data) {
                    assert.isFunction(dust.cache.index);
                    assert.ok(!err);
                    assert.strictEqual(data, RESULT);
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
        });


        afterEach(function () {
            dust.cache = {};
        });


        it('should cache templates if enabled', function (next) {
            assert.isUndefined(dust.cache.index);

            inject('/index', function (err, data) {
                assert.isFunction(dust.cache.index);
                assert.ok(!err);
                assert.strictEqual(data, RESULT);

                // This request should pull from cache
                inject('/index', function (err, data) {
                    assert.isFunction(dust.cache.index);
                    assert.ok(!err);
                    assert.strictEqual(data, RESULT);
                    next();
                });
            });
        });

    });

});



function inject(path, callback) {
    var req = require('http').request({ method: 'GET', port: 8000, path: path }, function (res) {
        var data = [];

        res.on('data', function (chunk) {
            data.push(chunk)
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
