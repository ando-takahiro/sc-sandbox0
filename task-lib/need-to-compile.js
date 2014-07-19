var Promise = require('thrush');
var exec = Promise.promisify(require('child_process').exec);
var fs = Promise.promisifyAll(require('fs'));

module.exports = function (compiler, args) {
    var cache = {};
    return function (stream, cb, sourceFile, targetPath) {
        Promise.try(function () {
            return fs.existsAsync(targetPath).then(function (exist) {
                if (!exist) {
                    return Promise.reject('target is not found');
                }
                return fs.statAsync(targetPath);
            }).then(function (targetStats) {
                if (sourceFile.stat.mtime >= targetStats.mtime) {
                    return Promise.reject('source is newer');
                }
                var command = [compiler, '-M'].concat(args, sourceFile.path).join(' ');
                return exec(command);
            }).then(function (res) {
                var files = res[0].split(/[\s\\]+/).slice(2).filter(function (t) {
                    return t;
                });

                if (files.filter(function (f) {
                    return f in cache && sourceFile.stat.mtime <= cache[f];
                }).length > 0) {
                    return Promise.reject('header was modified');
                }

                var outOfCache = files.filter(function (f) {
                    return !(f in cache);
                });

                return Promise.whilst(
                    function () {
                        return outOfCache.length > 0;
                    },
                    function () {
                        var f = outOfCache.unshift();
                        return fs.existsAsync(f).then(function (exist) {
                            if (!exist) {
                                // compile to report header is not found
                                return Promise.reject('header is not found');
                            }
                            return fs.statAsync(f);
                        }).then(function (stats) {
                            var t = cache[f] = stats.mtime;
                            if (sourceFile.stat.mtime <= t) {
                                return Promise.reject('header was modified');
                            }
                        });
                    }
                );
            });
        }).then(
            function () {
                // resolved means not to need to compile
                cb();
            },
            function (e) {
                // reject means to need to compile
                stream.push(sourceFile);
                cb();
            }
        ).catch(function (e) {
                // unexpected error
                cb(e);
            });
    };
};

