var gulp = require('gulp');
var changed = require('gulp-changed');
var spawn = require('gulp-spawn');
var rename = require('gulp-rename');

var OBJ = './obj';
var APP = './bin/app';
var CXX = 'g++';
var CXXFLAGS = ['-c', '-Isrc', '-fcolor-diagnostics'];

gulp.task('compile', function () {
    return gulp.src('./src/**/*.cc').
        pipe(changed(OBJ, {
            extension: '.o',
            hasChanged: require('./task-lib/need-to-compile')(CXX, CXXFLAGS)
        })).
        pipe(spawn({
            cmd: CXX,
            args: CXXFLAGS.concat('-o', '/dev/stdout', '-x', 'c++', '-')
        })).
        pipe(rename({extname: '.o'})).
        pipe(gulp.dest(OBJ));
});

gulp.task('link', ['compile'], function () {
    return require('./task-lib/link-on-changed')(APP, CXX, OBJ);
});

gulp.task('default', ['link']);

