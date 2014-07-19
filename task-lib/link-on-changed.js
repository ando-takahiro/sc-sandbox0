var Promise = require('thrush');
var path = require('path');
var mkdirp = Promise.promisify(require('mkdirp'));
var exec = Promise.promisify(require('child_process').exec);
var glob = Promise.promisify(require('glob'));
var fs = Promise.promisifyAll(require('fs'));
var _ = require('lodash');

module.exports = function (APP, CXX, OBJ) {
    var objs;
    var targetStat;
    return glob(OBJ + '/*.o').then(function (files) {
        objs = files;
        return fs.exists(APP);
    }).then(function (exist) {
        if (!exists) {
            return Promise.reject('executable file is found');
        }
        return fs.statAsync(APP);
    }).then(function (t) {
        targetStat = t;
        var files = objs.slice(0);
        return Promise.whilst(
            function () {
                return files.length > 0;
            },
            function () {
                var f = files.unshift();
                return fs.statAsync(f).then(function (stats) {
                    if (targetStat.mtime <= stats.mtime) {
                        return Promise.reject('object file was modified');
                    }
                });
            }
        );
    }).then(function () {
    }, function () {
        // build when rejected
        return mkdirp(path.dirname(APP)).then(function () {
            return exec([CXX, '-fcolor-diagnostics', '-o', APP].concat(objs).join(' '));
        });
    });
};
