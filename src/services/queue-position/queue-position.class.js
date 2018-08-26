/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');

class Service {
  constructor (options) {
    this.options = options || {};
    this.app = options.app
  }

  get (id, params) {
    return this.app.service('/tokens').find({
      query: {
        $limit: 100,
        fulfilled: false,
        cancelledByStudent: false,
        course: params.course
      },
      user: params.user
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
      console.error('queuePosition: ', err);
      throw new errors.BadRequest('Cannot update queue position');
    });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
