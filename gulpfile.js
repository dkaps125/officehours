var gulp = require('gulp');
var sass = require('gulp-sass');
var minifyCSS = require('gulp-csso');
var rename = require('gulp-rename');
var uglify = require('gulp-uglifyes');
var concat = require('gulp-concat');
var cache = require('gulp-cached');
var remember = require('gulp-remember');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');

const jsLoc = './client/js/lib/*.js';
const commonLoc = './client/js/common/*.js'
// order matters here
const vendorLoc = ['./client/js/vendor/jquery.js','./client/js/vendor/bootstrap.js', './client/js/vendor/feathers.js', './client/js/vendor/toastr.js', './client/js/vendor/d3.v4.js'];

gulp.task('js-vendor', function() {
  return gulp.src(vendorLoc.concat(commonLoc))
    //.pipe(sourcemaps.init())
    .pipe(uglify({
      mangle: false,
      ecma: 6
    }))
    .pipe(concat('bundle.js'))
    //.pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'))
});

gulp.task('js-build', function() {
  return gulp.src(jsLoc)
    .pipe(sourcemaps.init())
    .pipe(uglify({
      mangle: false,
      ecma: 6
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('js-dev', function() {
  return gulp.src(jsLoc)
    .pipe(cache(jsLoc))
    .pipe(remember(jsLoc))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('css', function() {
  return gulp.src(['./client/scss/*.scss', './client/scss/toastr.css'])
    .pipe(sass({ errLogToConsole: true })
      .on('error', sass.logError))
    .pipe(minifyCSS())
    .pipe(rename({
      suffix: '.min'
     }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('assets', function() {
  return gulp.src(['./client/assets/*', './client/html/*'])
    .pipe(gulp.dest('./public'));
});

gulp.task('fonts', function() {
  return gulp.src('./client/fonts/*')
    .pipe(gulp.dest('./public/fonts'));
});

gulp.task('sass:watch', function() {
   gulp.watch('./client/scss/*.scss', ['sass']);
});

gulp.task('clean', del.bind(null, ['./public/*']));

gulp.task('default', gulp.series(['clean', 'css', 'js-vendor', 'js-build', 'assets', 'fonts']));

gulp.task('watch', function() {
  gulp.watch('./client', gulp.series(['css', 'js-dev', 'assets']));
});
