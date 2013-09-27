/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    assert = require('chai').assert,
    reqwire = require('../lib/reqwire');


describe('reqwire', function () {


    it('should load a given module', function () {
        var module = reqwire('mocha');
        assert.isFunction(module);
    });


    it('should try multiple modules', function () {
        var module = reqwire('nonexistent', 'mocha');
        assert.isFunction(module);
    });


    it('should error when module is not available', function () {
        var error, module;
        try {
            module = reqwire('nonexistent');
        } catch (err) {
            error = err;
        } finally {
            assert.isUndefined(module);
            assert.isObject(error);
        }
    });


    it('should error when no modules are available', function () {
        var error, module;
        try {
            module = reqwire('nonexistent', 'alsononexistent');
        } catch (err) {
            error = err;
        } finally {
            assert.isUndefined(module);
            assert.isObject(error);
        }
    });


    describe('init', function () {

        it('should load a js file relative to app root', function () {
            // In this case mocha is the app, so app root is buried, unfortunately.
            reqwire.init('./test/fixtures/reqwire/module');
        });


        it('should load and init a file relative to app root', function () {
            // In this case mocha is the app, so app root is buried, unfortunately.
            var decoratee = {};
            reqwire.init('./test/fixtures/reqwire/init', decoratee);
            assert.strictEqual(decoratee.decorated, true);
        });


        it('should load and init a file with multiple args', function () {
            // In this case mocha is the app, so app root is buried, unfortunately.
            var decoratee = {};
            reqwire.init('./test/fixtures/reqwire/init', decoratee, 'moo');
            assert.strictEqual(decoratee.decorated, 'moo');
        });

    });

});