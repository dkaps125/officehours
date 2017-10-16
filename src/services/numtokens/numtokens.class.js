/* eslint-disable no-unused-vars */
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TOKENS = 15;

class Service {
  constructor (options) {
    this.options = options || {};
    this.app = options.app
  }
  get (id, params) {
    return this.app.service('/tokens').find({
      query: {
        createdAt: {
          $gt: new Date().getTime() - DAY_MS
        }
      }
    })
    .then(res => {
      const tokensRemaining = (MAX_TOKENS-res.total) < 0 ? 0 : (MAX_TOKENS-res.total);
      return Promise.resolve({tokensRemaining});
    })
    .catch(function(err) {
      console.log(error)
      return Promise.resolve({tokensRemaining: 0});
    })
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
