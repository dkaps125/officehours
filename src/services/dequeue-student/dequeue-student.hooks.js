const { authenticate } = require('@feathersjs/authentication').hooks;
const commonHooks = require('feathers-hooks-common');

const restrictToTA =
commonHooks.when(hook => !!hook.params.user &&
  !(hook.params.user.role === "Instructor"
  || hook.params.user.role === "TA"),
  commonHooks.disallow());

module.exports = {
  before: {
    all: [ authenticate('jwt'), restrictToTA ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
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
