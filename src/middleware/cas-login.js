const passport = require('passport');
const auth = require('feathers-authentication');

module.exports = function (options = {}) {
  const app = options.app

  return function casLogin(req, res, next) {
    console.log('cas_login middleware is running');
    passport.authenticate('cas', function(err, user, info) {

      if (err) {
        // login error
        res.redirect("/login.html?invalid");
      } else if (!user || !user.data || !user.data.length > 0){
        // user not authorized
        res.redirect("/login.html?invalid");
      } else {
        // user authorized
        var redirect = "/";
        if (user.data[0].role == "Instructor") {
          redirect = "/instructor.html";
        } else if (user.data[0].role == "TA") {
          redirect = "/ta.html";
        } else if (user.data[0].role == "Student") {
          redirect = "/student.html";
        }

        return app.passport.createJWT({ userId: user.data[0]._id },
          app.get('authentication')).then(accessToken => {

          // have to do this manually for feathers-authentication-client to accept the jwt
          res.cookie('feathers-jwt', accessToken, { maxAge: 7200000, httpOnly: false })
          res.redirect(redirect)
        });
      }
    })(req, res, next);
  };
};
