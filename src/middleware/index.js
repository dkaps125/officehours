const casLogin = require('./cas-login');
const passport = require('passport');
const auth = require('feathers-authentication');
const { authenticate } = auth.hooks;
module.exports = function () {
  // Add your custom middleware here. Remember, that
  // in Express the order matters
  const app = this; // eslint-disable-line no-unused-vars
  const userService = app.service('users');

  const cas = new (require('passport-cas').Strategy)({
    ssoBaseURL: 'https://shib.idm.umd.edu/shibboleth-idp/profile/cas',
    serverBaseURL: "http://" + app.get('host') + ":" + app.get('port')+'/',
    validate: '/serviceValidate'
  }, function(login, cb) {
    if (login != null) {

      userService.find({ query: { directoryID: login } })
      .then(user => {
        console.log(user)
        if (!user || user.total == 0) {
          cb(null, false, null)
        } else {
          cb(null, user)
        }
      }).catch(function(error) {
        cb(null, false, { message: error })
      });

    } else {
      cb(null, false, { message: "cannot decode CAS response" })
    }
  })
  passport.use(cas);

  app.use('/cas_login', casLogin({app: app}));
  app.use('/loginAsFakeUser', function(req, res, next) {
    console.log('logging in as fake user')
    app.passport.createJWT({ userId: '59e533d1dd9acd1989414d6b' },
      app.get('authentication')).then(accessToken => {

      res.cookie('feathers-jwt', accessToken, { maxAge: 900000, httpOnly: false })
      res.redirect('/student.html')
    });
  });
  app.use('/', function(req, res, next) {
    // we do this for lazy routing
    res.redirect('/cas_login');
  });
};
