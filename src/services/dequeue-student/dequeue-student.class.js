/* eslint-disable no-unused-vars */
class Service {
  constructor (options) {
    this.options = options || {};
    this.app = options.app;
  }

  create (data, params) {
    // prevent double-dequeuing
    return this.app.service('tokens').find(
      {
        query: {
          $limit: 1,
          fulfilled: true,
          fulfilledBy: params.user._id,
          isBeingHelped: true,
          cancelledByStudent: false,
          $sort: {
            createdAt: -1
          }
        }
    }).then(tokens => {
      // there's already a dequeued ticket
      if (tokens.total >= 1) {
        return tokens;
      } else {
        return this.app.service('tokens').find(
          {
            query: {
              $limit: 1,
              fulfilled: false,
              cancelledByStudent: false,
              $sort: {
                createdAt: -1
              }
            }
        });
      }
    }).then(tokens => {
      if (tokens.total >= 1) {
        return this.app.service('tokens').patch(tokens.data[0]._id,
        {
          fulfilled: true,
          fulfilledBy: params.user._id,
          fulfilledByName: params.user.name || params.user.directoryID,
          isBeingHelped: true,
          dequeuedAt: Date.now(),
        });
      } else {
        return tokens
      }
    }).catch(function(err) {
      console.log(err);
      Promise.reject({error: "Cannot dequeue"})
    })
  }

}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
