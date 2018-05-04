// Initializes the `passcode` service on path `/passcode`
const createService = require('./passcode.class.js');
const hooks = require('./passcode.hooks');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'passcode',
    paginate,
    app
  };

  // Initialize our service with any options it requires
  app.use('/passcode', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('passcode');

  service.hooks(hooks);
};
