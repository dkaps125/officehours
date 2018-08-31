/* eslint-disable no-unused-vars */
class Service {
  constructor(options) {
    this.options = options || {};
    this.app = options.app;
  }

  find(params) {
    const { course } = params.query;
    return this.app.service('/users').find({
      query: {
        onDuty: true,
        onDutyCourse: course,
        roles: {
          $elemMatch: {
            privilege: { $in: ['Instructor', 'TA'] },
            course
          }
        }
      }
    });
  }
}

module.exports = function(options) {
  return new Service(options);
};

module.exports.Service = Service;
