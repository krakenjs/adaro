/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var test = require('tape');
var path = require('path'),
    reqwire = require('../lib/reqwire');


test('reqwire should load a given module', function (t) {
    var module = reqwire('dustjacket');
    t.ok(typeof module.registerWith === 'function');
    t.end();
});


test('reqwire should try multiple modules', function (t) {
    var module = reqwire('nonexistent', 'dustjacket');
    t.ok(typeof module.registerWith === 'function');
    t.end();
});


test('reqwire should error when module is not available', function (t) {
    var module;
    t.plan(2);
    try {
        module = reqwire('nonexistent');
    } catch (err) {
        t.ok(typeof err === 'object');
    } finally {
        t.ok(module === undefined);
    }
    t.end();
});


test('reqwire should error when no modules are available', function (t) {
    var module;
    t.plan(2);
    try {
        module = reqwire('nonexistent', 'alsononexistent');
    } catch (err) {
        t.ok(typeof err === 'object');
    } finally {
        t.ok(module === undefined);
    }
    t.end();
});


test('reqwire init should load a js file relative to app root', function (t) {
    reqwire.init('./test/fixtures/reqwire/module');
    t.pass();
    t.end();
});


test('reqwire init should load and init a file relative to app root', function (t) {
    var decoratee = {};
    reqwire.init('./test/fixtures/reqwire/init', decoratee);
    t.strictEqual(decoratee.decorated, true);
    t.end();
});


test('reqwire init should load and init a file with multiple args', function (t) {
    var decoratee = {};
    reqwire.init('./test/fixtures/reqwire/init', decoratee, 'moo');
    t.strictEqual(decoratee.decorated, 'moo');
    t.end();
});
