'use strict';

exports = module.exports = function (decoratee, value) {
    decoratee.decorated = value ? value : true;
};