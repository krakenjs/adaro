'use strict';

var path = require('path');
var test = require('tape');
var express = require('express');
var engine = require('../index');
var assertions = require('./assertions');


test('adaro should construct an engine', function (t) {
    var config, dst;

    config = { foo: 'bar' };
    dst = engine(config);

    t.ok(dst instanceof Function);
	t.ok(typeof dst.settings === 'object');
    t.strictEqual(dst.settings.foo, config.foo);
    t.end();
});

test('should render a template', function (t) {
    setup(engine, function (done) {
        inject('/index', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.RESULT);
            done(t);
        });
    });

});

test('should render a template in a subdirectory', function (t) {
    setup(engine, function (done) {
        inject('/inc/include', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.SUBDIR);
            done(t);
        });
    });
});

test('partials should render template', function (t) {
    setup(engine, function (done) {
        inject('/master', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.PARTIAL_NO_HELPERS);
            done(t);
        });
    });
});

test('helpers should get loaded', function (t) {
    var app = express();
    app.engine('dust', helpers());
    t.ok(app.engines['.dust'].dust.helpers.sep instanceof Function);
    t.ok(app.engines['.dust'].dust.helpers.idx instanceof Function);
    t.ok(app.engines['.dust'].dust.helpers.node instanceof Function);
    t.ok(app.engines['.dust'].dust.helpers.browser instanceof Function);
    t.end();
});

test('helpers', function (t) {
    setup(helpers, function (done) {
        inject('/helper', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.HELPER);
            done(t);
        });
    });
});

test('should support a global layout', function (t) {
    setup(layout, function (done) {
        inject('/inc/include', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.LAYOUT);
            done(t);
        });
    });
});

test('should support local layouts', function (t) {
    setup(layout, function (done) {
        inject('/inc/include?layout=layouts/altmaster', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.ALT_LAYOUT);
            done(t);
        });
    });
});

test('should allow layout to be disabled', function (t) {
    setup(layout, function (done) {
        inject('/inc/include?layout=false', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.SUBDIR);
            done(t);
        });
    });
});

test('block scope', function (t) {
    setup(engine, function (req, res) {
        res.render(req.path.substr(1), { emoji: [':neckbeard:', ':poop:'] });
    }, function (done) {
        inject('/iterator', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.BLOCK_SCOPE);
            done(t);
        });
    });
});

test('streaming', function (t) {
    setup(streaming, function (req, res) {
        res.render(req.path.substr(1), { title: 'Hello, world!' }, function (err, stream) {
            stream.pipe(res);
        });
    }, function(done) {
        inject('/master', function (err, data) {
            t.error(err);
            t.strictEqual(data, assertions.PARTIAL);

            inject('/master', function (err, data) {
                t.error(err);
                t.strictEqual(data, assertions.PARTIAL);
                done(t);
            });
        });
    });
});

function streaming() {
    return engine({ stream: true });
}

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

function helpers() {
    var popd = pushd(__dirname);
    var eng = engine({
        helpers: [
            'dustjs-helpers',
            { name: './fixtures/helpers/node', arguments: { greeting:'node' } },
            './fixtures/helpers/browser'
        ]
    });
    popd();

    return eng;
}

function setup(setupEngine, setupRoute, cb) {
    var app = express();

    if (!cb) {
        cb = setupRoute;
        setupRoute = function (req, res) {
            var model = { title: 'Hello, world!' };
            if (req.query.layout) {
                model.layout = (req.query.layout === 'false') ? false : req.query.layout;
            }
            res.render(req.path.substr(1), model);
        };
    }

    app.engine('dust', setupEngine());
    app.set('view engine', 'dust');
    app.set('view cache', false);
    app.set('views', path.resolve(__dirname, 'fixtures/templates'));

    app.get('/*', setupRoute);

    var server = app.listen(8000, function () {
        cb(function (t) {
            server.once('close', function () {
                t.end();
            });
            server.close();
        });
    });

}

function layout() {
    return engine({ layout: 'layouts/master' });
}
