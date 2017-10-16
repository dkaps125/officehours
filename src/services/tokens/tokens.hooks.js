const { authenticate } = require('feathers-authentication').hooks;
const auth  = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');

const createdToken = hook => {
  console.log(hook);
}

const restrictToTAOrSelf =
// !!hooks.params.provider true when external
commonHooks.when(hook => !hook.params.user || !!hook.params.provider ||
  !(hook.params.user.role === "Instructor"
  || hook.params.user.role === "TA"),
  auth.restrictToOwner({ownerField: 'user'})
);

const userSchema = {
  include: {
    service: 'users',
    nameAs: 'user',
    parentField: 'user',
    childField: '_id'
  }
}

const populateUserIfTA =
commonHooks.when(hook => !!hook.params.user &&
  (hook.params.user.role === "Instructor"
  || hook.params.user.role === "TA"),
  commonHooks.populate({schema: userSchema})
);

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [restrictToTAOrSelf],
    get: [restrictToTAOrSelf],
    // TODO: validate description length
    create: [auth.associateCurrentUser({as: 'user'})],
    update: [restrictToTAOrSelf],
    patch: [restrictToTAOrSelf],
    remove: [commonHooks.disallow()] // tickets should be immutable
  },

  after: {
    all: [],
    find: [populateUserIfTA],
    get: [populateUserIfTA],
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
