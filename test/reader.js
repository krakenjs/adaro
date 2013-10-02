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


        after(function () {
            dustjs.onLoad = undefined;
        });


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


        it('should use original dust onLoad API', function (next) {
            dustjs.onLoad = function (name, callback) {
                callback(null, 'foobar');
            };

            dust = file.createReader('dust');
            dust(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'dust' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'foobar');
                next();
            });
        });


        it('should use original dust onLoad API with proxy', function (next) {
            dustjs.onLoad = function (name, callback) {
                callback(null, 'foobar');
            };

            dust = file.createReader('dust', proxy);
            dust(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'dust' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'index.foobar');
                next();
            });
        });


        it('should use new dust onLoad API', function (next) {
            dustjs.onLoad = function (name, context, callback) {
                callback(null, 'foobar.' + context.global.ext);
            };

            dust = file.createReader('dust');
            dust(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'dust' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'foobar.dust');
                next();
            });
        });


        it('should use new dust onLoad API with proxy', function (next) {
            dustjs.onLoad = function (name, context, callback) {
                callback(null, 'foobar.' + context.global.ext);
            };

            dust = file.createReader('dust', proxy);
            dust(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'dust' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'index.foobar.dust');
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


        after(function () {
            dustjs.onLoad = undefined;
        });


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


        it('should use original js onLoad API', function (next) {
            dustjs.onLoad = function (name, callback) {
                callback(null, 'foobar');
            };

            js = file.createReader('js');
            js(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'foobar');
                next();
            });
        });


        it('should use original js onLoad API with proxy', function (next) {
            dustjs.onLoad = function (name, callback) {
                callback(null, 'foobar');
            };

            js = file.createReader('js', proxy);
            js(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'index.foobar');
                next();
            });
        });


        it('should use new js onLoad API', function (next) {
            dustjs.onLoad = function (name, context, callback) {
                callback(null, 'foobar.' + context.global.ext);
            };

            js = file.createReader('js');
            js(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'foobar.js');
                next();
            });
        });


        it('should use new js onLoad API with proxy', function (next) {
            dustjs.onLoad = function (name, context, callback) {
                callback(null, 'foobar.' + context.global.ext);
            };

            js = file.createReader('js', proxy);
            js(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'index.foobar.js');
                next();
            });
        });

    });



    describe('dustreader', function () {

        var dust;

        after(function () {
            dustjs.onLoad = undefined;
        });

        it('should load a dust template', function (next) {
            dustjs.onLoad = function (name, callback) {
                callback(null, 'foobar');
            };

            dust = dustread.create();
            dust(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'dust' } }, function (err, src) {
                assert(!err);
                assert.strictEqual(src, 'foobar');
                next();
            });
        });

    });


    describe('jsreader', function () {

        var js;

        after(function () {
            dustjs.onLoad = undefined;
        });


        it('should load a compiled dust template', function (next) {
            dustjs.onLoad = function (name, callback) {
                callback(null, '(function(){dust.register("index",body_0);function body_0(chk,ctx){return undefined;} return body_0;})();');
            };

            js = jsread.create();
            js(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.isFunction(src);
                assert.strictEqual(src.name, 'body_0');
                next();
            });
        });


        it('should handle a template in function form', function (next) {
            dustjs.onLoad = function (name, callback) {
                callback(null, function body_0(chk,ctx){return undefined;});
            };

            js = jsread.create();
            js(path.join('fixtures', 'templates', 'index'), 'index', { global: { ext: 'js' } }, function (err, src) {
                assert(!err);
                assert.isFunction(src);
                assert.strictEqual(src.name, 'body_0');
                next();
            });
        });

    });

});

