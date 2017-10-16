/* eslint-disable no-unused-vars */
class Service {
  constructor (options) {
    this.options = options || {};
    this.app = options.app
  }

  find (params) {
    return this.app.service('/users').find(
      {
        query: {
          $or: [
            {role: "TA"},
            {role: "Instructor"}
          ],
          onDuty: true
        }
      })
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
