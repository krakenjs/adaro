'use strict';

var file = require('../file');


exports.create = function () {
    return file.createReader('dust');
};