/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    dustjs = require('dustjs-linkedin'),
    file = require('../lib/reader/file'),
    dustread = require('../lib/reader/dust'),
    jsread = require('../lib/reader/js'),
    assert = require('chai').assert;

describe('reader', function () {

    var dir;

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        dir = process.cwd();
        process.chdir(__dirname);
    });

    after(function () {
        process.chdir(dir);
    });


    describe('file', function () {

        function proxy(name, callback) {
            // placeholder
            return callback;
        }

        it('should create an untyped reader', function () {
            var unknown = file.createReader();
            assert.isFunction(unknown);
            assert.strictEqual(unknown.length, 4);
        });


        it('should create a `dust` reader', function () {
            var dust = file.createReader('dust');
            assert.isFunction(dust);
            assert.strictEqual(dust.length, 4);

            dust = file.createReader('dust', proxy);
            assert.isFunction(dust);
            assert.strictEqual(dust.length, 4);
        });


        it('should create a `js` reader', function () {
            var js = file.createReader('js');
            assert.isFunction(js);
            assert.strictEqual(js.length, 4);

            js = file.createReader('js', proxy);
            assert.isFunction(js);
            assert.strictEqual(js.length, 4);
        });

    });


    describe('dust', function () {

        var dust;

        function proxy(name, callback) {
            return function (err, data) {
                callback(null, name + '.' + data);
            };
        }


        it('should read a template', function (next) {
            dust = file.createReader('dust');
            dust(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'dust' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(typeof src, 'string');
                assert(src.length > 10);
                next();
            });
        });


        it('should apply a proxy', function (next) {
            dust = file.createReader('dust', proxy);
            dust(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'dust' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src.substring(0, 6), 'index.');
                next();
            });
        });

    });


    describe('js', function () {

        var js;

        function proxy(name, callback) {
            return function (err, data) {
                callback(null, name + '.' + data);
            };
        }



        it('should read a template', function (next) {
            js = file.createReader('js');
            js(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(typeof src, 'string');
                assert(src.length > 10);
                next();
            });
        });


        it('should apply a proxy', function (next) {
            js = file.createReader('js', proxy);
            js(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src.substring(0, 6), 'index.');
                next();
            });
        });


    });



    describe('dustreader', function () {

        it('should load a dust template', function (next) {

            dustread(dustjs)(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'dust' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, "<!DOCTYPE html><html lang=\"en\"><head><title>{title}</title></head><body><h1>node template test</h1></body></html>");
                next();
            });
        });

    });


    describe('jsreader', function () {

        var js;


        it('should load a compiled dust template', function (next) {

            jsread(dustjs)(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.isFunction(src);
                assert.strictEqual(src.name, 'body_0');
                next();
            });
        });


        it('should handle a template in function form', function (next) {

            jsread(dustjs)(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.isFunction(src);
                assert.strictEqual(src.name, 'body_0');
                next();
            });
        });

    });

});

