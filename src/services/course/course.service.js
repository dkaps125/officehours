// Initializes the `course` service on path `/courses`
const createService = require('feathers-mongoose');
const createModel = require('../../models/course.model');
const hooks = require('./course.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'course',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/courses', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('courses');

  service.hooks(hooks);
};
