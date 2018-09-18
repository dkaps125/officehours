/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');

class Service {
  constructor (options) {
    this.options = options || {};
    this.app = options.app
  }

  get (course, params) {
    return this.app.service('/tokens').find({
      query: {
        $limit: 100,
        fulfilled: false,
        cancelledByStudent: false,
        course
      },
      user: params.user,
      provider: null
    }).then(tickets => {
      var peopleAheadOfMe = 0;

      for (var i = 0; i < tickets.total; i++) {
        if (tickets.data[i].user.toString() === params.user._id.toString()) {
          break;
        }
        peopleAheadOfMe++;
      }

      return { peopleAheadOfMe, sizeOfQueue: tickets.total}
    }).catch(err => {
      throw new errors.BadRequest('Cannot update queue position');
    });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
