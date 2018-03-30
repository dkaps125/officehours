const passport = require('passport');
const auth = require('@feathersjs/authentication');
const multer = require('multer');
const csvUpload = require('./csv');
const casLogin = require('./cas-login');
const { authenticate } = auth.hooks;
const path = require('path');

var upload = multer({
  dest: path.join(__dirname, '../../csvUploads/'),
  preservePath: true,
  limits: {
    fileSize: 1000000
  }
});

module.exports = function () {
  // Add your custom middleware here. Remember, that
  // in Express the order matters
  const app = this; // eslint-disable-line no-unused-vars
  const userService = app.service('users');
  const environment = process.env.NODE_ENV;
  var serverBaseURL = app.get('http') + app.get('host') + ':' + app.get('port')+'/';

  if (environment === "production") {
    serverBaseURL = app.get('http') + app.get('host') + '/'
  }

  const cas = new (require('passport-cas').Strategy)({
    ssoBaseURL: app.get("CAS").baseURL,
    serverBaseURL,
    validate: app.get("CAS").validationURL
  }, function(login, cb) {
    // all we get from CAS validation is the directoryID, which is all we need
    if (login != null) {
      userService.find({ query: { directoryID: login } })
      .then(user => {
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
  if (environment !== "production") {
    app.use('/loginAsFakeUser', function(req, res, next) {
      console.log('logging in as fake user')
      app.passport.createJWT({ userId: app.get("autologin").fakeUser0 },
        app.get('authentication')).then(accessToken => {

        res.cookie('feathers-jwt', accessToken, { maxAge: 900000, httpOnly: false })
        res.redirect('/')
      });
    });
  }
  app.use('/csvUpload', auth.express.authenticate('jwt'),
    upload.single('userfile'), csvUpload({app}));

  app.use('/login', (req,res) => {res.redirect('/')});
  app.use('/ta', (req,res) => {res.redirect('/')});
  app.use('/instructor', (req,res) => {res.redirect('/')});
  app.use('/student', (req,res) => {res.redirect('/')});
/*
  app.use('/', function(req, res, next) {
    // we do this for lazy routing
    res.redirect('/cas_login');
  });
  */
};
