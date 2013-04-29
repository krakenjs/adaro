/*global describe:false, it:false, before:false, after:false*/
'use strict';

var fs = require('fs'),
    path = require('path'),
    engine = require('../index'),
    assert = require('chai').assert;


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

        it('should create a renderer', function () {
            renderer = engine.js({cache: false});
        });

        it('should render a template with a relative path', function (next) {
            renderer('index.js', context, function (err, data) {
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

    });


    describe('partials', function () {

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

        it('should use a custom dust read handler', function (next) {
            var templates = [];
            var dustFile = path.join(process.cwd(), 'fixtures', 'templates', 'helper.dust');

            var renderer = engine.dust({
                cache: false,
                read: function read(name, options, callback) {
                    templates.push(name);
                    fs.readFile(name, 'utf8', callback);
                }
            });

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

            var renderer = engine.js({
                cache: false,
                read: function read(name, options, callback) {
                    templates.push(name);
                    fs.readFile(name, 'utf8', callback);
                }
            });

            renderer(jsFile, context, function (err, data) {
                assert.ok(!err);
                assert.strictEqual(data, HELPER_RESULT);
                assert.strictEqual(templates.length, 1);
                assert.strictEqual(templates[0], jsFile);
                next();
            });
        });

    });

});
