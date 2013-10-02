'use strict';


var proto = {

    matches: function (config, reader) {
        return this.config === config && this.reader === reader;
    }

};

exports.create = function (config, reader, patch) {

    return Object.create(proto, {
        config: {
            value: config
        },
        reader: {
            value: reader
        },
        patch: {
            value: patch
        }
    });

};

