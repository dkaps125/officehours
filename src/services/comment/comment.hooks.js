const { authenticate } = require('feathers-authentication').hooks;
const auth  = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const xss = require('xss');

const MAX_TEXT_LEN = 500;

const restrictToTA =
commonHooks.when(hook => !!hook.params.user &&
  !(hook.params.user.role === "Instructor"
  || hook.params.user.role === "TA"),
  commonHooks.disallow());

const filterXSS = context => {
    if (context.data) {
      if ((typeof context.data.text) === "string") {
        context.data.text = context.data.text.substring(0, MAX_TEXT_LEN);
        context.data.text = xss(context.data.text);
      }
    }

    return context;
  }

module.exports = {
  before: {
    all: [ authenticate('jwt'), restrictToTA ],
    find: [],
    get: [],
    create: [auth.associateCurrentUser({as: 'ta'}), filterXSS],
    update: [auth.restrictToOwner({ ownerField: 'ta' }), filterXSS],
    patch: [auth.restrictToOwner({ ownerField: 'ta' }), filterXSS],
    remove: [commonHooks.disallow()] // comments should be immutable
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
