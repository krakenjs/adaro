'use strict';

var path = require('path');
var test = require('tape');
var express = require('express');
var engine = require('../index');
var assertions = require('./assertions');
var supertest = require('supertest');


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
    var app = setup(engine);
    supertest(app).get('/index').expect(assertions.RESULT).end(function (err, res) {
        t.error(err);
        t.end();
    });

});

test('should render a template in a subdirectory', function (t) {
    var app = setup(engine);
    supertest(app).get('/inc/include').expect(assertions.SUBDIR).end(function (err, res) {
        t.error(err);
        t.end();
    });
});

test('partials should render template', function (t) {
    var app = setup(engine);
    supertest(app).get('/master').expect(assertions.PARTIAL_NO_HELPERS).end(function (err, res) {
        t.error(err);
        t.end();
    });
});

test('helpers should get loaded', function (t) {
    var app = express();
    app.engine('dust', helpers());
    t.ok(app.engines['.dust'].dust.helpers.sep instanceof Function);
    t.ok(app.engines['.dust'].dust.helpers.eq instanceof Function);
    t.ok(app.engines['.dust'].dust.helpers.node instanceof Function);
    t.ok(app.engines['.dust'].dust.helpers.browser instanceof Function);
    t.end();
});

test('helpers', function (t) {
    var app = setup(helpers);
    supertest(app).get('/helper').expect(assertions.HELPER).end(function (err, res) {
        t.error(err);
        t.end();
    });
});

test('should support a global layout', function (t) {
    var app = setup(layout);
    supertest(app).get('/inc/include').expect(assertions.LAYOUT).end(function (err, res) {
        t.error(err);
        t.end();
    });
});

test('should support local layouts', function (t) {
    var app = setup(layout);
    supertest(app).get('/inc/include?layout=layouts/altmaster').expect(assertions.ALT_LAYOUT).end(function (err, res) {
        t.error(err);
        t.end();
    });
});

test('should allow layout to be disabled', function (t) {
    var app = setup(layout);
    supertest(app).get('/inc/include?layout=false').expect(assertions.SUBDIR).end(function (err, res) {
        t.error(err);
        t.end();
    });
});

test('block scope', function (t) {
    var app = setup(engine, function (req, res) {
        res.render(req.path.substr(1), { emoji: [':neckbeard:', ':poop:'] });
    });
    supertest(app).get('/iterator').expect(assertions.BLOCK_SCOPE).end(function (err, res) {
        t.error(err);
        t.end();
    });
});

test('streaming', function (t) {
    var app = setup(streaming, function (req, res) {
        res.render(req.path.substr(1), { title: 'Hello, world!' }, function (err, stream) {
            stream.pipe(res);
        });
    });
    supertest(app).get('/master').expect(assertions.PARTIAL).end(function (err, res) {
        t.error(err);
        t.end();
    });
});

test('make sure context.templateName is set for root template', function (t) {
    t.plan(2);
    var e = engine({
        helpers: [
            function (dust) {
                dust.helpers.checkContext = function (chunk, context) {
                    t.equal(context.templateName, 'test-context');
                    return chunk;
                };
            }
        ]
    });
    e('test-context', { views: path.resolve(__dirname, 'fixtures/templates')}, function (err, data) {
        console.log(arguments);
        t.error(err);
        t.end();
    });
});

function streaming() {
    return engine({ stream: true });
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

function setup(setupEngine, setupRoute) {
    var app = express();

    if (!setupRoute) {
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

    return app;
}

function layout() {
    return engine({ layout: 'layouts/master' });
}
