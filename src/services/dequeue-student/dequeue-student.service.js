// Initializes the `dequeueStudent` service on path `/dequeue-student`
const createService = require('./dequeue-student.class.js');
const hooks = require('./dequeue-student.hooks');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'dequeue-student',
    paginate,
    app
  };

  // Initialize our service with any options it requires
  app.use('/dequeue-student', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('dequeue-student');

  service.hooks(hooks);
};
