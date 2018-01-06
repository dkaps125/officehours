/* eslint-disable no-unused-vars */

class Service {
  constructor (options) {
    this.options = options || {};
    this.app = options.app
    this.MAX_TOKENS = this.app.get('tokens').max;
  }
  get (id, params) {
    const lastMidnight = new Date();
    lastMidnight.setHours(0,0,0,0);

    return this.app.service('/tokens').find({
      query: {
        createdAt: {
          $gt: lastMidnight.getTime(),
        },
        user: params.user._id
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
