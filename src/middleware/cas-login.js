const passport = require('passport');
const auth = require('@feathersjs/authentication');

module.exports = function(options = {}) {
  const app = options.app;

  const frontend = app.get('frontend');
  const errorRedirectURL = `${frontend}?invalid`;
  const { cookie: cookieParams } = app.get('authentication');

  return function casLogin(req, res, next) {
    passport.authenticate('cas', function(err, user, info) {
      if (err) {
        // login error
        res.redirect(errorRedirectURL);
      } else if (!user || !user.data || user.data.length <= 0) {
        // user not authorized
        res.redirect(errorRedirectURL);
      }
      // user authenticated
      return app.passport.createJWT({ userId: user.data[0]._id }, app.get('authentication')).then(accessToken => {
        // have to do this manually for feathers-authentication-client to accept the jwt
        // default maxAge is 86400000 or 1 day in MS
        res.cookie(cookieParams.name, accessToken, { maxAge: cookieParams.maxAge, httpOnly: !!cookieParams.httpOnly });
        res.redirect(frontend);
      });
    })(req, res, next);
  };
};
