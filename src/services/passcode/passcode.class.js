/* eslint-disable no-unused-vars */
class Service {
  constructor(options) {
    this.options = options || {};
  }

  // TODO set passcode for each course?
  get(course, params) {
    return Promise.resolve({
      passcode: this.options.app.passcode
    });
  }
}

module.exports = function(options) {
  return new Service(options);
};

module.exports.Service = Service;
