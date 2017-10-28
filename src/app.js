const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const feathers = require('feathers');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const socketio = require('feathers-socketio');

const handler = require('feathers-errors/handler');
const notFound = require('feathers-errors/not-found');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

const authentication = require('./authentication');
const passport = require('passport');

const mongoose = require('./mongoose');
const sched = require('node-schedule');
const randomstring = require('randomstring');

const app = feathers();

// Load app configuration
app.configure(configuration());
// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', feathers.static(app.get('public')));

// Set up Plugins and providers
app.configure(hooks());
app.configure(mongoose);
app.configure(mongoose);
app.configure(rest());
const io = socketio();
app.configure(io);

// Set up our services (see `services/index.js`)
app.configure(services);

// Configure other middleware (see `middleware/index.js`)
app.configure(authentication);

app.configure(middleware);

// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(handler());
app.use(passport.initialize());

app.hooks(appHooks);

function setPasscode() {
  app.passcode = randomstring.generate({
    length: 5,
    capitalization: 'lowercase'
  })

  if (!!app.io) {
    app.io.emit("passcode updated");
  }
}

// on the hour, set a new passcode
sched.scheduleJob('0 * * * *', setPasscode);

setPasscode();

module.exports = app;
