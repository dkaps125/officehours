/* eslint-disable no-unused-vars */
const DAY_MS = 24 * 60 * 60 * 1000;

class Service {
  constructor (options) {
    this.options = options || {};
    this.app = options.app
    this.MAX_TOKENS = this.app.get('tokens').max;
  }
  get (id, params) {
    return this.app.service('/tokens').find({
      query: {
        createdAt: {
          $gt: new Date().getTime() - DAY_MS
        },
        user: {
          "_id": params.user._id
        }
      }
    })
    .then(res => {
      const tokensRemaining = (this.MAX_TOKENS-res.total) < 0 ? 0 : (this.MAX_TOKENS-res.total);
      return Promise.resolve({tokensRemaining});
    })
    .catch(function(err) {
      return Promise.resolve({tokensRemaining: 0});
    })
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
