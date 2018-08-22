// Initializes the `global` service on path `/global`
const createService = require('feathers-mongoose');
const createModel = require('../../models/global.model');
const hooks = require('./global.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'global',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/global', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('global');

  service.hooks(hooks);
};
