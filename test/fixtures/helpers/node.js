'use strict';

module.exports = function (dust, options) {
    options = options || { greeting: "ASP.Net" };
    dust.helpers.node = function (chunk, ctx, bodies, params) { return chunk.write(options.greeting); };
};
