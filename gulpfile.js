var gulp = require('gulp');
var sass = require('gulp-sass');
var minifyCSS = require('gulp-csso');
var rename = require('gulp-rename');
var uglify = require('gulp-uglifyes');
var concat = require('gulp-concat');
var cache = require('gulp-cached');
var remember = require('gulp-remember');
var sourcemaps = require('gulp-sourcemaps');
var webpack = require('webpack-stream');
var del = require('del');

// we don't bundle in d3 to save space in bundle, since only instructor.js uses it
const jsLoc = ['./client/js/vendor/dist/d3.v4.js', './client/js/lib/*.js'];
const commonLoc = './client/js/common/*.js'
// order matters here
const vendorLoc = ['./client/js/vendor/jquery.js',
  './client/js/vendor/bootstrap.js',
  './client/js/vendor/feathers.js',
  './client/js/vendor/toastr.js'
];

gulp.task('js-vendor', function() {
  return gulp.src(vendorLoc.concat(commonLoc))
    //.pipe(sourcemaps.init())
    .pipe(uglify({
      mangle: false,
      ecma: 6
    }))
    .pipe(concat('vendor.js'))
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
    .pipe(cache())
    .pipe(remember())
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
  return gulp.src(['./client/assets/*', './client/reactcl/index.html'/*'./client/html/*'*/])
    .pipe(gulp.dest('./public'));
});

gulp.task('webpack', function() {
  return gulp.src('./client/reactcl/app.jsx')
    .pipe(webpack(require('./webpack.config.js')))
    .on('error', function(err) {
      console.error(err.toString());
      this.emit('end');
    })
    .pipe(gulp.dest('public/'));

});

gulp.task('fonts', function() {
  return gulp.src('./client/fonts/*')
    .pipe(gulp.dest('./public/fonts'));
});

gulp.task('sass:watch', function() {
   gulp.watch('./client/scss/*.scss', ['sass']);
});

gulp.task('clean', del.bind(null, ['./public/*']));

gulp.task('default', gulp.series(['clean', 'css', 'assets', 'fonts', 'js-vendor', 'webpack']));

gulp.task('watch', function() {
  gulp.watch('./client', gulp.series(['css', 'assets', 'webpack']));
});
