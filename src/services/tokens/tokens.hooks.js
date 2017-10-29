const { authenticate } = require('feathers-authentication').hooks;
const auth  = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const errors = require('feathers-errors');

const createdToken = hook => {
  console.log(hook);
}

const restrictToTAOrSelf =
// !!hooks.params.provider true when external
commonHooks.when(hook => !!hook.params.provider &&
  !!hook.params.user && !(hook.params.user.role === "Instructor"
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

const validatePasscode = context => {
  if (!!context.data && ((typeof context.data.passcode) === "string")
    && context.data.passcode.toLowerCase().trim() === context.app.passcode) {
      return context;
  }
  console.log(context.data)
  throw new errors.BadRequest('Incorrect passcode', { errors: { passcode: context.data.passcode } });
}

const emitQueuePositionUpdate = context => {
  context.app.io.emit("queue update");
}

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [restrictToTAOrSelf],
    get: [restrictToTAOrSelf],
    // TODO: validate description length
    create: [auth.associateCurrentUser({as: 'user'}),
      validatePasscode,
      commonHooks.discard('passcode')
    ],
    update: [restrictToTAOrSelf],
    patch: [restrictToTAOrSelf],
    remove: [commonHooks.disallow()] // tickets should be immutable
  },

  after: {
    all: [],
    find: [populateUserIfTA],
    get: [populateUserIfTA],
    create: [emitQueuePositionUpdate],
    update: [emitQueuePositionUpdate],
    patch: [emitQueuePositionUpdate],
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
