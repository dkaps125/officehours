// Initializes the `availabletas` service on path `/availabletas`
const createService = require('./availabletas.class.js');
const hooks = require('./availabletas.hooks');
const filters = require('./availabletas.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'availabletas',
    paginate,
    app
  };

  // Initialize our service with any options it requires
  app.use('/availabletas', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('availabletas');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
