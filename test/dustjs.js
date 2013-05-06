/*global describe:false, it:false, before:false, after:false*/
'use strict';

var fs = require('fs'),
    path = require('path'),
    engine = require('../index'),
    assert = require('chai').assert,
    dust = require('dustjs-helpers');


describe('express-dustjs', function () {

    var context = { title: 'Hello, world!' };

    var RESULT = '<!DOCTYPE html><html lang="en"><head><title>Hello, world!</title></head><body><h1>node template test</h1></body></html>';
    var HELPER_RESULT = '<h1>node template test Hello, world!</h1>';
    var PARTIAL_RESULT = '<!DOCTYPE html><html lang="en"><head><title>Hello, world!</title></head><body><h1>node template test Hello, world!</h1></body></html>';
    var SUBDIR_RESULT = '<p>howdy doodie</p>';

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(__dirname);

        // Simulate express options
        context.settings = {
            views: path.join(process.cwd(), 'fixtures', 'templates')
        };

        dust.onLoad = function (file, cb) {
            fs.readFile(file, 'utf8', cb);
        };
    });


    after(function () {
        dust.onLoad = undefined;
    });


    describe('dust', function () {

        var renderer;

        it('should create a renderer', function () {
            renderer = engine.dust({cache: false});
        });


        it('should render a template with a relative path', function (next) {
            renderer('index.dust', context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, RESULT);
                next();
            });
        });


        it('should render a template with an absolute path', function (next) {
            renderer(path.join(context.settings.views, 'index.dust'), context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, RESULT);
                next();
            });
        });


        it('should render a template in a subdirectory', function (next) {
            renderer(path.join(context.settings.views, 'inc', 'include.dust'), context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, SUBDIR_RESULT);
                next();
            });
        });

    });


    describe('compiled js', function () {

        var renderer;

        before(function () {
            dust.onLoad = function (view, cb) {
                fs.readFile(view, 'utf8', cb);
            };
        });


        it('should create a renderer', function () {
            renderer = engine.js({cache: false});
        });


        it('should render a template with a relative path', function (next) {
            renderer('index.js', context, function (err, data) {
                err && console.dir(err.message);
                assert.ok(!err);
                assert.strictEqual(data, RESULT);
                next();
            });
        });


        it('should render a template with an absolute path', function (next) {
            renderer(path.join(context.settings.views, 'index.js'), context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, RESULT);
                next();
            });
        });


        it('should render a template in a subdirectory', function (next) {
            renderer(path.join(context.settings.views, 'inc', 'include.js'), context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, SUBDIR_RESULT);
                next();
            });
        });


        it('should use onLoad if available', function (next) {
            var invoked = false;

            dust.onLoad = function (view, cb) {
                invoked = true;
                fs.readFile(view, 'utf8', cb);
            };

            renderer = engine.js({cache: false});
            renderer(path.join(context.settings.views, 'inc', 'include.js'), context, function (err, data) {
                assert.ok(!err);
                assert.isTrue(invoked);
                assert.strictEqual(data, SUBDIR_RESULT);
                dust.onLoad = undefined;
                next();
            });
        });

    });


    describe('partials', function () {

        before(function () {
            dust.onLoad = function (view, cb) {
                fs.readFile(view, 'utf8', cb);
            };
        });

        it('should render a template', function (next) {
            var renderer = engine.dust({cache: false});
            renderer(path.join(process.cwd(), 'fixtures', 'templates', 'master.dust'), context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, PARTIAL_RESULT);
                next();
            });
        });

    });


    describe('helpers', function () {

        it('should use helpers for templates', function (next) {
            var renderer = engine.dust({
                helpers: ['dustjs-helpers'],
                cache: false
            });

            renderer(path.join(process.cwd(), 'fixtures', 'templates', 'helper.dust'), context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, HELPER_RESULT);
                next();
            });
        });

        it('should use helpers for precompiled js', function (next) {
            var renderer = engine.js({
                helpers: ['dustjs-helpers'],
                cache: false
            });

            renderer(path.join(process.cwd(), 'fixtures', 'templates', 'helper.js'), context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, HELPER_RESULT);
                next();
            });
        });

    });


    describe('read API', function () {

        var renderer;

        beforeEach(function () {
            dust.onLoad = undefined;
        });

        it('should use onLoad options if available', function (next) {
            var invoked = undefined;

            renderer = engine.dust({cache: false});
            dust.onLoad = function (view, options, cb) {
                invoked = options;
                fs.readFile(view, 'utf8', cb);
            };

            renderer(path.join(context.settings.views, 'inc', 'include.dust'), context, function (err, data) {
                assert.ok(!err);
                assert.isObject(invoked);
                assert.strictEqual(data, SUBDIR_RESULT);
                next();
            });
        });


        it('should use a custom dust read handler', function (next) {
            var templates = [];
            var dustFile = path.join(process.cwd(), 'fixtures', 'templates', 'helper.dust');

            renderer = engine.dust({ cache: false });
            dust.onLoad = function (view, options, callback) {
                templates.push(view);
                fs.readFile(view, 'utf8', callback);
            };

            renderer(dustFile, context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, HELPER_RESULT);
                assert.strictEqual(templates.length, 1);
                assert.strictEqual(templates[0], dustFile);
                next();
            });
        });


        it('should use a custom js read handler', function (next) {
            var templates = [];
            var jsFile = path.join(process.cwd(), 'fixtures', 'templates', 'helper.js');

            renderer = engine.js({ cache: false });
            dust.onLoad = function (view, options, callback) {
                templates.push(view);
                fs.readFile(view, 'utf8', callback);
            };

            renderer(jsFile, context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, HELPER_RESULT);
                assert.strictEqual(templates.length, 1);
                assert.strictEqual(templates[0], jsFile);
                next();
            });
        });


        it('should use a custom dust read handler with partials', function (next) {
            var templates = [];
            var dustFile = path.join(process.cwd(), 'fixtures', 'templates', 'master.dust');

            renderer = engine.dust({ cache: false });
            dust.onLoad = function (view, options, callback) {
                templates.push(view);
                fs.readFile(view, 'utf8', callback);
            };

            renderer(dustFile, context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, PARTIAL_RESULT);
                assert.strictEqual(templates.length, 2);
                assert.strictEqual(templates[0], dustFile);
                next();
            });
        });


        it('should provide context to custom read handler', function (next) {
            var templates = [];
            var dustFile = path.join(process.cwd(), 'fixtures', 'templates', 'master.dust');

            renderer = engine.dust({ cache: false });
            dust.onLoad = function (view, options, callback) {
                templates.push(view);

                var views = options.views || (options.settings && options.settings.views);
                view = path.join(views, 'en_US', view.replace(views, ''));
                fs.readFile(view, 'utf8', callback);
            };

            renderer(dustFile, context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, PARTIAL_RESULT);
                assert.strictEqual(templates.length, 2);
                assert.strictEqual(templates[0], dustFile);
                next();
            });
        });


    });


});
