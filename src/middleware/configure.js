const auth = require('@feathersjs/authentication');
const xss = require('xss');
const fs = require('fs');

module.exports = function(options = {}) {
  const { app } = options;
  const userService = app.service('/users');
  const globalService = app.service('/global');
  const frontend = app.get('frontend');

  return function configure(req, res, next) {
    const { name, directoryID } = req.body;
    console.log('configure called with: ', name, directoryID);
    globalService.find().then(globals => {
      if (!globals.data || globals.data.length !== 0) {
        // TODO: this 404's, we should fail properly
        next();
        return;
      }
      // set the app to configured
      globalService
        .create({ configured: true })
        .then(newGlobal => {
          // create our first admin user, TODO: send a success resp
          userService.create({
            directoryID,
            name,
            permissions: ['course_create', 'course_mod', 'user_create', 'user_mod', 'user_view', 'admin']
          });
          res.redirect(frontend);
        })
        .catch(err => {
          console.error(err);
          next();
        });
    });
  };
};
