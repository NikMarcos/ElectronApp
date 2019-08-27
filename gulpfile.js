var gulp = require('gulp');
var electron = require('electron-connect').server.create();

gulp.task('serve', function () {

  // Start browser process
  electron.start();

  // Restart browser process
  gulp.watch(['index.js', 'index.html', 'index.css'], electron.restart);

  // Reload renderer process
  // gulp.watch(['index.js', 'index.html', 'index.css'], electron.reload);
});
