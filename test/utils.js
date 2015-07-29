/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    utils = require('../lib/utils'),
    assert = require('chai').assert;


var sysroot = (function sysroot() {
    var dir, root;

    dir = process.cwd();
    do {

        root = path.dirname(dir) === dir;
        dir = path.dirname(dir);

    } while (!root);

    return dir;
}());



describe('utils', function () {

    describe('isAbsolutePath', function () {

        var tests = {
            'handle empty strings': {
                args: [''],
                out: false
            },
            'handle absolute directory paths': {
                args: [ process.cwd() ],
                out: true
            },
            'handle absolute file paths': {
                args: [ __filename ],
                out: true
            },
            'handle relative directory paths': {
                args: [ path.join('foo', 'bar', 'baz') ],
                out: false
            },
            'handle relative file paths': {
                args: [ path.join('foo', 'bar', 'baz.js') ],
                out: false
            }
        };

        Object.keys(tests).forEach(function (name) {
            var test = tests[name];
            it('should ' + name, function () {
                var name = utils.isAbsolutePath.apply(undefined, test.args);
                assert.strictEqual(name, test.out);
            });
        });

    });


    describe('nameify', function () {

        var tests = {
            'handle empty strings': {
                args: [''],
                out: ''
            },
            'convert just a file': {
                args: [ 'foo.js' ],
                out: 'foo.js'
            },
            'convert just a file at root': {
                args: [ sysroot + 'foo.js' ],
                out: 'foo.js'
            },
            'convert just a dir': {
                args: [ 'foo' ],
                out: 'foo'
            },
            'convert just a dir at root': {
                args: [ sysroot + 'foo' ],
                out: 'foo'
            },
            'convert a relative path': {
                args: [ path.join('foo', 'bar', 'baz.js') ],
                out: 'foo/bar/baz.js'
            },
            'convert an absolute path': {
                args: [ sysroot + path.join('foo', 'bar', 'baz.js') ],
                out: 'foo/bar/baz.js'
            },
            'support optional relative views dir': {
                args: [ path.join('views', 'inc', 'template.js'), path.join('views', 'inc') ],
                out: 'template.js'
            },
            'support optional absolute views dir': {
                args: [ sysroot + path.join('views', 'inc', 'template.js'), sysroot + path.join('views', 'inc') ],
                out: 'template.js'
            },
            'support optional absolute views dirs': {
                args: [ sysroot + path.join('views', 'inc', 'template.js'), [sysroot + path.join('views', 'inc'), sysroot + path.join('views_other_dir', 'inc')]],
                out: 'template.js'
            },
            'support optional absolute views dirs_another_dir': {
                args: [ sysroot + path.join('views_other_dir', 'inc', 'another_template.js'), [sysroot + path.join('views', 'inc'), sysroot + path.join('views_other_dir', 'inc')]],
                out: 'another_template.js'
            },
            'support optional absolute views dir with special characters': {
                args: [ sysroot + path.join('build adaro (pull request)', 'views', 'inc', 'template.js'), sysroot + path.join('build adaro (pull request)', 'views', 'inc') ],
                out: 'template.js'
            },
            'not support relative file with absolute views dir': {
                args: [ path.join('views', 'inc', 'template.js'), sysroot + path.join('views', 'inc') ],
                out: 'views/inc/template.js'
            },
            'not support absolute file with relative views dir': {
                args: [ sysroot + path.join('views', 'inc', 'template.js'), path.join('views', 'inc') ],
                out: 'views/inc/template.js'
            },
            'support optional file extension': {
                args: [ path.join('views', 'inc', 'template.js'), path.join('views'), '.js' ],
                out: 'inc/template'
            },
            'support optional file extension with nested view': {
                args: [ path.join('views', 'inc', 'template.js'), path.join('views', 'inc'), '.js' ],
                out: 'template'
            },
            'support optional file extension view empty views': {
                args: [ path.join('views', 'inc', 'template.js'), '', '.js' ],
                out: 'views/inc/template'
            },
            'support optional file extension with nested absolute view': {
                args: [ sysroot + path.join('views', 'inc', 'template.js'), sysroot + path.join('views', 'inc'), '.js' ],
                out: 'template'
            },
            'support optional file extension view empty absolute views': {
                args: [ sysroot + path.join('views', 'inc', 'template.js'), '', '.js' ],
                out: 'views/inc/template'
            }
        };

        Object.keys(tests).forEach(function (name) {
            var test = tests[name];
            it('should ' + name, function () {
                var name = utils.nameify.apply(undefined, test.args);
                assert.strictEqual(name, test.out);
            });
        });

    });

});
