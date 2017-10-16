// Initializes the `queuePosition` service on path `/queue-position`
const createService = require('./queue-position.class.js');
const hooks = require('./queue-position.hooks');
const filters = require('./queue-position.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'queue-position',
    paginate,
    app
  };

  // Initialize our service with any options it requires
  app.use('/queue-position', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('queue-position');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
