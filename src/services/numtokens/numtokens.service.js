// Initializes the `numtokens` service on path `/numtokens`
const createService = require('./numtokens.class.js');
const hooks = require('./numtokens.hooks');
const filters = require('./numtokens.filters');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'numtokens',
    paginate,
    app: app,
    lean: true
  };

  // Initialize our service with any options it requires
  app.use('/numtokens', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('numtokens');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
