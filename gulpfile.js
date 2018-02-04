var gulp = require('gulp');
var sass = require('gulp-sass');
var minifyCSS = require('gulp-csso');
var rename = require('gulp-rename');
const del = require('del');

gulp.task('css', function() {
  return gulp.src('./client/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCSS())
    .pipe(rename({
      suffix: '.min'
     }))
    .pipe(gulp.dest('./public/css'))
});

gulp.task('sass:watch', function() {
   gulp.watch('./client/scss/*.scss', ['sass']);
 });

gulp.task('clean', function(cb) {
  del(['./public/*'], cb);
});

gulp.task('default', ['css']);
