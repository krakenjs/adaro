'use strict';

var test = require('tape');
var path = require('path'),
    utils = require('../lib/utils');


var sysroot = (function sysroot() {
    var dir, root;

    dir = process.cwd();
    do {

        root = path.dirname(dir) === dir;
        dir = path.dirname(dir);

    } while (!root);

    return dir;
}());



test('isAbsolutePath', function (t) {

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
        var resolved = utils.isAbsolutePath.apply(undefined, test.args);
        t.strictEqual(resolved, test.out, 'isAbsolutePath should ' + name);
    });

    t.end();

});


test('nameify', function (t) {

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
        var resolved = utils.nameify.apply(undefined, test.args);
        t.strictEqual(resolved, test.out, 'nameify should ' + name);
    });

    t.end();

});

test('resolveViewDir', function (t) {

    var emptyContext = {};

    var viewContext = {
        views: 'path/to/views'
    };

    var settingsContext = {
        views: 'path/to/views',
        settings: {
            views: 'path/to/views'
        }
    };

    var settingsContextNoViews = {
        settings: {
            views: 'path/to/views'
        }
    };

    var tests = {
        'should default to current dir on empty context': {
            args: [ emptyContext ],
            out: '.'
        },
        'should support `views` on context': {
            args: [ viewContext ],
            out: viewContext.views
        },
        'should support `views` on context.settings': {
            args: [ settingsContext ],
            out: settingsContext.settings.views
        },
        'should support `views` on context.settings (when no top views present)': {
            args: [ settingsContextNoViews ],
            out: settingsContextNoViews.settings.views
        },
        'should support a default view fallback': {
            args: [ emptyContext, 'ü' ],
            out: 'ü'
        }
    };

    Object.keys(tests).forEach(function (name) {
        var test = tests[name];
	    var resolved = utils.resolveViewDir.apply(undefined, test.args);
        t.strictEqual(resolved, test.out, 'resolveViewDir ' + name);
    });

    t.end();

});
