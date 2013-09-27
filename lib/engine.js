'use strict';

var path = require('path'),
    dust = require('dustjs-linkedin'),
    Readable = require('stream').Readable,
    utils = require('./utils'),
    patch = require('./patch'),
    River = require('./brook'),
    reqwire = require('./reqwire');


var loaders = {
    dust: require('./dust'),
    js: require('./js')
};



function createRenderContext(options) {
    var context;

    // Hoist *only* view, settings, and ext to global context.
    context = dust.makeBase({
        views: options.views,
        settings: options.settings,
        ext: options.ext
    });

    // Remove from child context so global values are used.
    delete options.views;
    delete options.settings;
    delete options.ext;

    context = context.push(options);
    return context;
}



exports.create = function (type, config) {
    var reader, engine;

    config = config || {};

    // Load referenced helpers
    if (Array.isArray(config.helpers)) {
        config.helpers.forEach(function (name) {
            reqwire.init(name, dust);
        });
    }

    // Make sure cache is boolean before freezing.
    if (!Object.isFrozen(config)) {
        config.cache = (config.cache === undefined) ? true : !!config.cache;
        config = Object.freeze(config);
    }

    function reset() {
        patch.undo();
        if (!config.cache) {
            dust.cache = {};
        }
    }

    reader = loaders[type].create();
    engine = function engine(file, options, callback) {
        var ext, views, name, layout, context, stream;

        options = options || {};

        // This needs to be deferred until runtime in case an engine
        // gets created and isn't used. That's because it modifies
        // a global dust object.
        patch.apply(config, reader);

        // Figure out where the views live.
        views = utils.resolveViewDir(options);

        // Get the correct extension. (NOTE: requires leading '.')
        ext = path.extname(file);
        if (options.ext) {
            ext = '.' + options.ext;
        }

        // Resolve page layout, first checking request context options,
        // then falling back to application config. Explicit `false` for
        // and settings disables layout.
        layout = undefined;
        if (options.layout !== false) {
            layout = options.layout;
            if (config.layout !== false) {
                layout = layout || config.layout;
            }
        }

        // Get the correct template name from the provided file name and
        // sort out context/template, etc.
        name = utils.nameify(file, views, ext);
        if (typeof layout === 'string') {
            options._main = name;
            name = layout;
        }

        context = createRenderContext(options);
        if (config.stream) {
            stream = dust.stream(name, context);
            stream.on('error', reset);
            stream.on('end', reset);
            callback(null, new River(stream));
            return;
        }

        dust.render(name, context, function () {
            reset();
            callback.apply(undefined, arguments);
        });
    };

    // Make settings available
    Object.defineProperty(engine, 'settings', {
        get: function () {
            return config;
        }
    });

    return engine;
};