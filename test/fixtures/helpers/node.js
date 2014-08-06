'use strict';

module.exports = function (dust, options) {
    options = options || { greeting: "Hello" };
    dust.helpers.node = function (chunk, ctx, bodies, params) { return chunk.write(options.greeting); };
};
